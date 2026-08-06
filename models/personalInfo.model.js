const { pool, safeUpdate } = require('../config/dbPool');

const personalInfoModel = {
  get: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM personal_info WHERE id = 1"
    );
    return rows[0];
  },
  update: async (data) => {
    await safeUpdate("personal_info", 1, data, {
      name: "name",
      title: "title",
      email: "email",
      phone: "phone",
      birthday: "birthday",
      location: "location",
      avatar: "avatar",
      aboutText: "about_text",
      cvFile: "cv_file"
    });
    return personalInfoModel.get();
  }
};

module.exports = personalInfoModel;
