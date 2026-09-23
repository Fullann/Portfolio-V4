const { dbOperations } = require('../../config/database');

/**
 * Récupère toutes les données nécessaires à la génération du HTML depuis la base de données.
 * @returns {Promise<Object>} Un objet contenant tous les tableaux de données.
 */
async function fetchAllData() {
  const [
    projects,
    testimonials,
    portfolioProjects,
    clients,
    categories,
    blogs,
    personalInfo,
    socialLinks,
    education,
    experience,
    certifications,
    skills,
    siteSettings
  ] = await Promise.all([
    dbOperations.projects.getAll(),
    dbOperations.testimonials.getAll(),
    dbOperations.portfolioProjects.getAll(),
    dbOperations.clients.getAll(),
    dbOperations.categories.getAll(),
    dbOperations.blogs.getAll(),
    dbOperations.personalInfo.get(),
    dbOperations.socialLinks.getAll(),
    dbOperations.education.getAll(),
    dbOperations.experience.getAll(),
    dbOperations.certifications.getAll(),
    dbOperations.skills.getAll(),
    dbOperations.settings.getAll()
  ]);

  return {
    projects,
    testimonials,
    portfolioProjects,
    clients,
    categories,
    blogs,
    personalInfo,
    socialLinks,
    education,
    experience,
    certifications,
    skills,
    siteSettings
  };
}

module.exports = { fetchAllData };
