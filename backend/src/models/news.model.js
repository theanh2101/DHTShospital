const pool = require("../../config/db");

const NewsModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT id, title, slug, summary, image, author, category, status, created_at
      FROM news
      ORDER BY created_at DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM news WHERE id = ? LIMIT 1", [id]);
    return rows[0];
  },

  async getByCategory(category) {
    const [rows] = await pool.query(
      `
      SELECT id, title, slug, summary, image, author, category, status, created_at
      FROM news
      WHERE category = ?
      ORDER BY created_at DESC
      `,
      [category]
    );
    return rows;
  },

  async create(data) {
    const { title, slug, summary, content, image, author, category, status } = data;
    const validStatus = status === "draft" ? "draft" : "published";

    const [result] = await pool.query(
      `
      INSERT INTO news (title, slug, summary, content, image, author, category, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [title, slug, summary, content, image, author, category, validStatus]
    );
    return result.insertId;
  },

  async update(id, data) {
    const { title, slug, summary, content, image, author, category, status } = data;
    const validStatus = status === "draft" ? "draft" : "published";

    const [result] = await pool.query(
      `
      UPDATE news
      SET title = ?, slug = ?, summary = ?, content = ?, image = ?, author = ?, category = ?, status = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [title, slug, summary, content, image, author, category, validStatus, id]
    );
    return result.affectedRows;
  },

  // 🆕 ✅ Cập nhật chỉ trạng thái (tránh set NULL cho các cột khác)
  async updateStatus(id, status) {
    const validStatus = status === "draft" ? "draft" : "published";
    const [result] = await pool.query(
      `UPDATE news SET status = ?, updated_at = NOW() WHERE id = ?`,
      [validStatus, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query("DELETE FROM news WHERE id = ?", [id]);
    return result.affectedRows;
  },
};

module.exports = NewsModel;
