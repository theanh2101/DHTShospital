const axios = require("axios");
const ChatModel = require("../models/chat.model");
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || "";

// 🧠 Hàm fallback (phòng khi lỗi API hoặc không có key)
function fallbackReply(message) {
  const m = message.toLowerCase();

  if (m.includes("giờ") && (m.includes("làm") || m.includes("mở") || m.includes("mở cửa") || m.includes("giờ làm"))) {
    return "🏥 Bệnh viện DHST mở cửa 24/7, bao gồm cả cuối tuần và ngày lễ. Để biết giờ làm việc cụ thể của từng phòng khám, bạn vui lòng gọi hotline 096.989.9999 nhé.";
  }

  if (m.includes("đặt lịch") || m.includes("đặt") || m.includes("lịch")) {
    return "📅 Bạn có thể đặt lịch khám qua website hoặc liên hệ hotline 096.989.9999 để được hỗ trợ đặt nhanh nhất.";
  }

  if (m.includes("giá") || m.includes("chi phí")) {
    return "💰 Chi phí phụ thuộc vào loại dịch vụ hoặc chuyên khoa. Để được báo giá chi tiết, bạn hãy gọi hotline 096.989.9999 nhé.";
  }

  if (m.includes("zalo")) {
    return "💬 Bạn có thể liên hệ qua Zalo số 0868686868 hoặc nhấn biểu tượng Zalo trên website bệnh viện DHST.";
  }

  return "Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng gọi hotline 096.989.9999 để được hỗ trợ cụ thể hơn nhé.";
}

// 💬 Xử lý tin nhắn gửi từ frontend
const handleChatMessage = async (req, res) => {
  try {
    const userMsg = (req.body.message || "").trim();
    if (!userMsg) return res.status(400).json({ error: "Tin nhắn trống" });

    let reply = "";

    // Nếu không có API key thì fallback
    if (!GOOGLE_API_KEY) {
      reply = fallbackReply(userMsg);
      await ChatModel.saveMessage(userMsg, reply);
      return res.json({ reply });
    }

    // 🔥 Sử dụng model gemini-2.5-flash
    const model = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;

    // 🧠 Prompt hướng dẫn AI
    const prompt = `
        Bạn là trợ lý tư vấn y tế thân thiện của bệnh viện DHST. 
        - Giải thích rõ ràng, dễ hiểu, lịch sự nhưng vẫn ngắn gọn, có các gạch đầu dòng.
        - Không được chẩn đoán hay kê thuốc.
        - Có thể nêu nguyên nhân phổ biến và hướng xử lý an toàn.
        - Cuối mỗi câu trả lời, hãy nhắc người dùng gọi **hotline 0868686868** để được tư vấn chính xác hơn.
        - Nếu người dùng hỏi về giá, lịch, dịch vụ... hãy trả lời cụ thể và thân thiện.
        - Trả lời bằng tiếng Việt tự nhiên, thân mật nhưng chuyên nghiệp.
    `;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${prompt}\n\nCâu hỏi của người dùng: "${userMsg}"` }],
        },
      ],
      generationConfig: {
        temperature: 0.8, // mức sáng tạo vừa phải
        maxOutputTokens: 1500, // trả lời đủ dài và tự nhiên
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    // 🚀 Gọi API Gemini
    const apiRes = await axios.post(apiUrl, payload);
    console.log("✅ Gemini response:", JSON.stringify(apiRes.data, null, 2));

   let rawReply = apiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text || fallbackReply(userMsg);

        reply = rawReply
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .split(/\. |\.\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => `- ${s}`)
        .join("<br>");


    // Lưu lịch sử
    await ChatModel.saveMessage(userMsg, reply);

    // Trả về client
    res.json({ reply });

  } catch (err) {
    console.error("❌ Gemini API error:", err.response ? err.response.data : err.message);
    const userMsg = req.body.message || "";
    const reply = fallbackReply(userMsg);
    await ChatModel.saveMessage(userMsg, reply);
    res.json({ reply });
  }
};

// 📜 Lấy lịch sử chat
const getChatHistory = async (req, res) => {
  try {
    const history = await ChatModel.getAllMessages();
    res.json(history);
  } catch (error) {
    console.error("❌ Error getting chat history:", error);
    res.status(500).json({ error: "Không thể lấy lịch sử chat" });
  }
};

module.exports = {
  handleChatMessage,
  getChatHistory,
};
