const { dbOperations } = require('../config/database');

function formatPersonalInfo(dbData) {
  if (!dbData) return null;

  let aboutText;
  try {
    aboutText = JSON.parse(dbData.about_text || '[]');
  } catch (error) {
    if (dbData.about_text && typeof dbData.about_text === 'string') {
      aboutText = [dbData.about_text];
    } else {
      aboutText = [];
    }
  }

  return {
    name: dbData.name,
    title: dbData.title,
    email: dbData.email,
    phone: dbData.phone,
    birthday: dbData.birthday,
    location: dbData.location,
    avatar: dbData.avatar,
    cvFile: dbData.cv_file,
    aboutText: aboutText
  };
}

async function formatPortfolioProject(dbData) {
  let category = null;

  if (dbData.filter_category && dbData.filter_category.trim()) {
    try {
      category = await dbOperations.categories.getByName(dbData.filter_category);
    } catch (error) {
      console.error('Erreur lors de la récupération de la catégorie:', error);
    }
  }

  return {
    id: dbData.id,
    title: dbData.title,
    category: category ? category.display_name : dbData.category || 'Non définie',
    image: dbData.image,
    description: dbData.description,
    repoLink: dbData.repo_link,
    liveLink: dbData.live_link,
    filterCategory: dbData.filter_category || null,
    isCurrentWork: Number(dbData.is_current_work) || 0
  };
}

module.exports = {
  formatPersonalInfo,
  formatPortfolioProject
};
