const fs = require('fs').promises;
const path = require('path');
const { fetchAllData } = require('./generator/fetchData');
const { renderHtmlTemplate } = require('./generator/renderTemplate');
const { formatPersonalInfo, formatPortfolioProject } = require('../utils/formatters');
const { debounceAsync } = require('../utils/helpers');
const { normalizeGitHubUrl } = require('../utils/githubHelper');

/**
 * Orchestrateur principal : récupère les données, les formate, génère le HTML via EJS et l'écrit sur le disque.
 */
async function updateHtmlFile() {
  try {
    console.log('🔄 Mise à jour du fichier HTML...');

    // 1. Récupérer toutes les données brutes de la base de données
    const data = await fetchAllData();

    // 2. Formater les données spécifiques
    const formattedPersonalInfo = formatPersonalInfo(data.personalInfo);
    const visiblePortfolioProjects = data.portfolioProjects.filter(p => p.is_visible !== 0);
    const formattedPortfolioProjects = await Promise.all(
      visiblePortfolioProjects.map(formatPortfolioProject)
    );

    // 3. Préparer les variables pour le template SEO
    const siteName = data.siteSettings.site_name || `${formattedPersonalInfo.name} Portfolio`;
    const siteDesc = data.siteSettings.site_description || `Portfolio de ${formattedPersonalInfo.name} : projets web, expériences, compétences et contact.`;
    const baseUrl = (data.siteSettings.base_url || 'http://localhost:3000').replace(/\/$/, '');
    let avatarUrl = formattedPersonalInfo.avatar || '/assets/images/my-avatar.png';
    if (!avatarUrl.startsWith('http')) {
      avatarUrl = `${baseUrl}/${avatarUrl.replace(/^\.\//, '')}`;
    }

    // 4. Déterminer les projets "Héros" (actuels ou les 4 premiers)
    const currentWorkProjects = formattedPortfolioProjects.filter(p => p.isCurrentWork === 1);
    const heroProjects = currentWorkProjects.length > 0 ? currentWorkProjects : formattedPortfolioProjects.slice(0, 4);

    // 4b. Extraire la liste unique des technologies pour les filtres du portfolio
    const allTechnologies = [...new Set(
      formattedPortfolioProjects.flatMap(p => p.technologies || [])
    )].sort();

    // 4c. Regrouper les compétences par catégories
    const categorizedSkills = {};
    (data.skills || []).forEach(skill => {
      const cat = skill.category || 'Frontend';
      if (!categorizedSkills[cat]) {
        categorizedSkills[cat] = [];
      }
      categorizedSkills[cat].push(skill);
    });

    const availabilityStatus = data.siteSettings.availability_status || 'available';
    const availabilityText = data.siteSettings.availability_text || 'Disponible pour de nouveaux projets';
    const githubUsername = data.siteSettings.github_username || 'Fullann';

    // 5. Rassembler toutes les données pour EJS
    const templateData = {
      formattedPersonalInfo,
      siteName,
      siteDesc,
      baseUrl,
      avatarUrl,
      heroProjects,
      testimonials: data.testimonials,
      formattedPortfolioProjects,
      allTechnologies,
      clients: data.clients,
      categories: data.categories,
      blogs: (data.blogs || []).map(b => ({ ...b, image: normalizeGitHubUrl(b.image) })),
      version: Date.now(),
      socialLinks: data.socialLinks,
      education: data.education,
      experience: data.experience,
      certifications: data.certifications || [],
      skills: data.skills,
      categorizedSkills,
      availabilityStatus,
      availabilityText,
      githubUsername,
      hcaptchaSitekey: data.siteSettings?.hcaptcha_sitekey || process.env.HCAPTCHA_SITEKEY || ''
    };

    // 6. Rendre le HTML avec EJS
    const htmlContent = await renderHtmlTemplate(templateData);

    // 7. Écrire le fichier final dans public/index.html
    const outputPath = path.join(__dirname, '..', 'public', 'index.html');
    await fs.writeFile(outputPath, htmlContent, 'utf-8');

    console.log('✅ Fichier HTML mis à jour avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du HTML:', error);
    throw error;
  }
}

// Version débouncée : les appels multiples en rafale sont fusionnés en une seule
// exécution après 500ms, évitant les race conditions d'écriture simultanée.
const updateHtmlFileDebounced = debounceAsync(updateHtmlFile, 500);

module.exports = { updateHtmlFile: updateHtmlFileDebounced, updateHtmlFileImmediate: updateHtmlFile };
