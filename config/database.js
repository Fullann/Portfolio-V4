require('dotenv').config();

const { pool, safeUpdate } = require('./dbPool');
const { initializeDatabase } = require('./initDb');

const projectModel = require('../models/project.model');
const testimonialModel = require('../models/testimonial.model');
const portfolioProjectModel = require('../models/portfolioProject.model');
const clientModel = require('../models/client.model');
const categoryModel = require('../models/category.model');
const blogModel = require('../models/blog.model');
const personalInfoModel = require('../models/personalInfo.model');
const socialLinkModel = require('../models/socialLink.model');
const educationModel = require('../models/education.model');
const experienceModel = require('../models/experience.model');
const skillModel = require('../models/skill.model');
const adminUserModel = require('../models/adminUser.model');
const settingModel = require('../models/setting.model');
const i18nModel = require('../models/i18n.model');

// Définir la méthode globale deleteAll
const deleteAll = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute("DELETE FROM projects");
    await connection.execute("DELETE FROM testimonials");
    await connection.execute("DELETE FROM portfolio_projects");
    await connection.execute("DELETE FROM clients");
    await connection.execute("DELETE FROM blogs");
    await connection.execute("DELETE FROM social_links");
    await connection.execute("DELETE FROM education");
    await connection.execute("DELETE FROM experience");
    await connection.execute("DELETE FROM skills");

    const aboutText = JSON.stringify(["Votre présentation personnelle ici."]);
    await connection.execute(
      `UPDATE personal_info 
       SET name = 'Votre Nom',
           title = 'Votre Titre',
           email = 'votre@email.com',
           phone = '+33 1 23 45 67 89',
           birthday = '1990-01-01',
           location = 'Votre Ville, Pays',
           avatar = './assets/images/my-avatar.png',
           about_text = ?,
           updated_at = NOW()
       WHERE id = 1`,
      [aboutText]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const dbOperations = {
  projects: projectModel,
  testimonials: testimonialModel,
  portfolioProjects: portfolioProjectModel,
  clients: clientModel,
  categories: categoryModel,
  blogs: blogModel,
  personalInfo: personalInfoModel,
  socialLinks: socialLinkModel,
  education: educationModel,
  experience: experienceModel,
  skills: skillModel,
  admin: adminUserModel,
  settings: settingModel,
  i18n: i18nModel,
  deleteAll
};

module.exports = {
  dbOperations,
  initializeDatabase,
  pool,
  safeUpdate
};