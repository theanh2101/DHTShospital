const pool = require("../../config/db"); // giữ require

const NewsModel = {
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM news ORDER BY created_at DESC");
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM news WHERE id = ?", [id]);
    return rows[0];
  },

  async create(data) {
    const { title, slug, summary, content, image, author, category } = data;
    const [result] = await pool.query(
      "INSERT INTO news (title, slug, summary, content, image, author, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, slug, summary, content, image, author, category]
    );
    return result.insertId;
  },

  async update(id, data) {
    const { title, slug, summary, content, image, author, category, status } = data;
    const [result] = await pool.query(
      `UPDATE news 
       SET title=?, slug=?, summary=?, content=?, image=?, author=?, category=?, status=? 
       WHERE id=?`,
      [title, slug, summary, content, image, author, category, status, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query("DELETE FROM news WHERE id = ?", [id]);
    return result.affectedRows;
  },
};

module.exports = NewsModel; // dùng module.exports thay export default
