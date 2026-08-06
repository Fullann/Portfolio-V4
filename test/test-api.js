#!/usr/bin/env node
'use strict';

// ============================================
// 🧪 SCRIPT DE TEST COMPLET API PORTFOLIO
// ============================================

const https = require('https');
const http = require('http');

// Configuration
const API_URL = 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpassword';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

let token = null;
const createdIds = {
  categories: [],
  portfolioProjects: [],
  projects: [],
  blogs: [],
  experience: [],
  education: [],
  skills: [],
  clients: [],
  testimonials: [],
  socialLinks: []
};

// ============================================
// 🛠️ UTILITAIRES HTTP
// ============================================

function request(method, path, data = null, useAuth = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (useAuth && token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = lib.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️', message, colors.cyan);
}

function logWarning(message) {
  log('⚠️', message, colors.yellow);
}

function logSection(title) {
  console.log('\n' + colors.bright + colors.magenta + '═'.repeat(50) + colors.reset);
  console.log(colors.bright + colors.magenta + `  ${title}` + colors.reset);
  console.log(colors.bright + colors.magenta + '═'.repeat(50) + colors.reset + '\n');
}

// ============================================
// 🔐 AUTHENTIFICATION
// ============================================

async function testAuth() {
  logSection('🔐 TEST AUTHENTIFICATION');
  
  try {
    logInfo('Tentative de connexion...');
    const response = await request('POST', '/api/auth/login', {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    if (response.status === 200 && response.data.token) {
      token = response.data.token;
      logSuccess(`Connexion réussie ! Token: ${token.substring(0, 20)}...`);
      return true;
    } else {
      logError(`Connexion échouée: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logError(`Erreur connexion: ${error.message}`);
    return false;
  }
}

// ============================================
// 📦 CATÉGORIES
// ============================================

async function testCategories() {
  logSection('📦 TEST CATÉGORIES');
  
  try {
    // CREATE
    logInfo('Création de catégories de test...');
    const cat1 = await request('POST', '/api/categories', {
      name: 'test-category-1',
      displayName: 'Test Category 1'
    }, true);
    
    const cat2 = await request('POST', '/api/categories', {
      name: 'test-category-2',
      displayName: 'Test Category 2'
    }, true);
    
    if (cat1.status === 201 && cat2.status === 201) {
      createdIds.categories.push(cat1.data.id, cat2.data.id);
      logSuccess(`Catégories créées: ID ${cat1.data.id}, ${cat2.data.id}`);
    } else {
      logError('Échec création catégories');
    }
    
    // READ
    logInfo('Récupération des catégories...');
    const getAll = await request('GET', '/api/categories');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} catégories récupérées`);
    }
    
    // UPDATE
    logInfo('Mise à jour d\'une catégorie...');
    const update = await request('PUT', `/api/categories/${createdIds.categories[0]}`, {
      name: 'test-category-updated',
      displayName: 'Test Category Updated'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Catégorie mise à jour');
    }
    
  } catch (error) {
    logError(`Erreur catégories: ${error.message}`);
  }
}

// ============================================
// 💼 PROJETS PORTFOLIO
// ============================================

async function testPortfolioProjects() {
  logSection('💼 TEST PROJETS PORTFOLIO');
  
  try {
    // CREATE
    logInfo('Création de projets portfolio...');
    const proj1 = await request('POST', '/api/portfolio-projects', {
      title: 'Test Portfolio Project 1',
      category: 'test-category-1',
      description: 'Description du projet de test',
      repoLink: 'https://github.com/test/project1',
      liveLink: 'https://project1.test.com',
      filterCategory: 'test-category-1'
    }, true);
    
    if (proj1.status === 201) {
      createdIds.portfolioProjects.push(proj1.data.id);
      logSuccess(`Projet portfolio créé: ID ${proj1.data.id}`);
    }
    
    // READ
    logInfo('Récupération des projets portfolio...');
    const getAll = await request('GET', '/api/portfolio-projects');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} projets portfolio récupérés`);
    }
    
    // UPDATE
    logInfo('Mise à jour d\'un projet...');
    const update = await request('PUT', `/api/portfolio-projects/${createdIds.portfolioProjects[0]}`, {
      title: 'Test Portfolio Project UPDATED',
      category: 'test-category-1',
      description: 'Description mise à jour',
      repoLink: 'https://github.com/test/project1-updated',
      liveLink: 'https://project1-updated.test.com',
      filterCategory: 'test-category-1'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Projet portfolio mis à jour');
    }
    
  } catch (error) {
    logError(`Erreur projets portfolio: ${error.message}`);
  }
}

// ============================================
// 📁 PROJETS
// ============================================

async function testProjects() {
  logSection('📁 TEST PROJETS');
  
  try {
    // CREATE
    logInfo('Création de projets...');
    const proj1 = await request('POST', '/api/projects', {
      title: 'Test Project 1',
      category: 'Test Category',
      description: 'Description du projet'
    }, true);
    
    if (proj1.status === 201) {
      createdIds.projects.push(proj1.data.id);
      logSuccess(`Projet créé: ID ${proj1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/projects');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} projets récupérés`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/projects/${createdIds.projects[0]}`, {
      title: 'Test Project UPDATED',
      category: 'Test Category Updated',
      description: 'Description mise à jour'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Projet mis à jour');
    }
    
  } catch (error) {
    logError(`Erreur projets: ${error.message}`);
  }
}

// ============================================
// ✍️ BLOGS
// ============================================

async function testBlogs() {
  logSection('✍️ TEST BLOGS');
  
  try {
    // CREATE
    logInfo('Création d\'articles de blog...');
    const blog1 = await request('POST', '/api/blogs', {
      title: 'Test Blog Article 1',
      category: 'Tech',
      excerpt: 'Extrait de l\'article de test',
      content: 'Contenu complet de l\'article de test...',
      author: 'Test Author'
    }, true);
    
    if (blog1.status === 201) {
      createdIds.blogs.push(blog1.data.id);
      logSuccess(`Article créé: ID ${blog1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/blogs');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} articles récupérés`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/blogs/${createdIds.blogs[0]}`, {
      title: 'Test Blog Article UPDATED',
      category: 'Tech',
      excerpt: 'Extrait mis à jour',
      content: 'Contenu mis à jour...',
      author: 'Test Author'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Article mis à jour');
    }
    
  } catch (error) {
    logError(`Erreur blogs: ${error.message}`);
  }
}

// ============================================
// 💼 EXPÉRIENCE
// ============================================

async function testExperience() {
  logSection('💼 TEST EXPÉRIENCE');
  
  try {
    // CREATE
    logInfo('Création d\'expériences...');
    const exp1 = await request('POST', '/api/experience', {
      position: 'Test Developer',
      period: '2020 - 2022',
      description: 'Description de l\'expérience de test'
    }, true);
    
    if (exp1.status === 201) {
      createdIds.experience.push(exp1.data.id);
      logSuccess(`Expérience créée: ID ${exp1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/experience');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} expériences récupérées`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/experience/${createdIds.experience[0]}`, {
      position: 'Test Senior Developer',
      period: '2020 - 2023',
      description: 'Description mise à jour'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Expérience mise à jour');
    }
    
  } catch (error) {
    logError(`Erreur expérience: ${error.message}`);
  }
}

// ============================================
// 🎓 ÉDUCATION
// ============================================

async function testEducation() {
  logSection('🎓 TEST ÉDUCATION');
  
  try {
    // CREATE
    logInfo('Création de formations...');
    const edu1 = await request('POST', '/api/education', {
      institution: 'Test University',
      period: '2015 - 2019',
      description: 'Bachelor in Computer Science'
    }, true);
    
    if (edu1.status === 201) {
      createdIds.education.push(edu1.data.id);
      logSuccess(`Formation créée: ID ${edu1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/education');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} formations récupérées`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/education/${createdIds.education[0]}`, {
      institution: 'Test University UPDATED',
      period: '2015 - 2020',
      description: 'Master in Computer Science'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Formation mise à jour');
    }
    
  } catch (error) {
    logError(`Erreur éducation: ${error.message}`);
  }
}

// ============================================
// ⚡ COMPÉTENCES
// ============================================

async function testSkills() {
  logSection('⚡ TEST COMPÉTENCES');
  
  try {
    // CREATE
    logInfo('Création de compétences...');
    const skill1 = await request('POST', '/api/skills', {
      name: 'Test Skill',
      percentage: 85
    }, true);
    
    if (skill1.status === 201) {
      createdIds.skills.push(skill1.data.id);
      logSuccess(`Compétence créée: ID ${skill1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/skills');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} compétences récupérées`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/skills/${createdIds.skills[0]}`, {
      name: 'Test Skill UPDATED',
      percentage: 95
    }, true);
    
    if (update.status === 200) {
      logSuccess('Compétence mise à jour');
    }
    
  } catch (error) {
    logError(`Erreur compétences: ${error.message}`);
  }
}

// ============================================
// 🤝 CLIENTS
// ============================================

async function testClients() {
  logSection('🤝 TEST CLIENTS');
  
  try {
    // CREATE
    logInfo('Création de clients...');
    const client1 = await request('POST', '/api/clients', {
      name: 'Test Client',
      website: 'https://testclient.com',
      description: 'Description du client de test'
    }, true);
    
    if (client1.status === 201) {
      createdIds.clients.push(client1.data.id);
      logSuccess(`Client créé: ID ${client1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/clients');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} clients récupérés`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/clients/${createdIds.clients[0]}`, {
      name: 'Test Client UPDATED',
      website: 'https://testclient-updated.com',
      description: 'Description mise à jour'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Client mis à jour');
    }
    
  } catch (error) {
    logError(`Erreur clients: ${error.message}`);
  }
}

// ============================================
// 💬 TÉMOIGNAGES
// ============================================

async function testTestimonials() {
  logSection('💬 TEST TÉMOIGNAGES');
  
  try {
    // CREATE
    logInfo('Création de témoignages...');
    const testimonial1 = await request('POST', '/api/testimonials', {
      name: 'Test Person',
      text: 'Excellent travail ! Très professionnel.'
    }, true);
    
    if (testimonial1.status === 201) {
      createdIds.testimonials.push(testimonial1.data.id);
      logSuccess(`Témoignage créé: ID ${testimonial1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/testimonials');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} témoignages récupérés`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/testimonials/${createdIds.testimonials[0]}`, {
      name: 'Test Person UPDATED',
      text: 'Travail exceptionnel ! Je recommande vivement.'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Témoignage mis à jour');
    }
    
  } catch (error) {
    logError(`Erreur témoignages: ${error.message}`);
  }
}

// ============================================
// 🔗 LIENS SOCIAUX
// ============================================

async function testSocialLinks() {
  logSection('🔗 TEST LIENS SOCIAUX');
  
  try {
    // CREATE
    logInfo('Création de liens sociaux...');
    const social1 = await request('POST', '/api/social-links', {
      name: 'Test Social',
      icon: 'logo-test',
      url: 'https://test.social.com/profile'
    }, true);
    
    if (social1.status === 201) {
      createdIds.socialLinks.push(social1.data.id);
      logSuccess(`Lien social créé: ID ${social1.data.id}`);
    }
    
    // READ
    const getAll = await request('GET', '/api/social-links');
    if (getAll.status === 200) {
      logSuccess(`${getAll.data.length} liens sociaux récupérés`);
    }
    
    // UPDATE
    const update = await request('PUT', `/api/social-links/${createdIds.socialLinks[0]}`, {
      name: 'Test Social UPDATED',
      icon: 'logo-test-updated',
      url: 'https://test-updated.social.com/profile'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Lien social mis à jour');
    }
    
  } catch (error) {
    logError(`Erreur liens sociaux: ${error.message}`);
  }
}

// ============================================
// 👤 INFORMATIONS PERSONNELLES
// ============================================

async function testPersonalInfo() {
  logSection('👤 TEST INFORMATIONS PERSONNELLES');
  
  try {
    // READ
    logInfo('Récupération des infos personnelles...');
    const getInfo = await request('GET', '/api/personal-info');
    if (getInfo.status === 200) {
      logSuccess('Infos personnelles récupérées');
    }
    
    // UPDATE
    logInfo('Mise à jour des infos personnelles...');
    const update = await request('PUT', '/api/personal-info', {
      name: 'Test User UPDATED',
      title: 'Test Developer',
      email: 'test@example.com',
      phone: '+1234567890',
      birthday: '1990-01-01',
      location: 'Test City',
      aboutText: 'Test about text updated'
    }, true);
    
    if (update.status === 200) {
      logSuccess('Infos personnelles mises à jour');
    }
    
  } catch (error) {
    logError(`Erreur infos personnelles: ${error.message}`);
  }
}

// ============================================
// 🗑️ NETTOYAGE DES DONNÉES DE TEST
// ============================================

async function cleanup() {
  logSection('🗑️ NETTOYAGE DES DONNÉES DE TEST');
  
  try {
    // Supprimer dans l'ordre inverse de création
    for (const id of createdIds.socialLinks) {
      await request('DELETE', `/api/social-links/${id}`, null, true);
      logInfo(`Lien social ${id} supprimé`);
    }
    
    for (const id of createdIds.testimonials) {
      await request('DELETE', `/api/testimonials/${id}`, null, true);
      logInfo(`Témoignage ${id} supprimé`);
    }
    
    for (const id of createdIds.clients) {
      await request('DELETE', `/api/clients/${id}`, null, true);
      logInfo(`Client ${id} supprimé`);
    }
    
    for (const id of createdIds.skills) {
      await request('DELETE', `/api/skills/${id}`, null, true);
      logInfo(`Compétence ${id} supprimée`);
    }
    
    for (const id of createdIds.education) {
      await request('DELETE', `/api/education/${id}`, null, true);
      logInfo(`Formation ${id} supprimée`);
    }
    
    for (const id of createdIds.experience) {
      await request('DELETE', `/api/experience/${id}`, null, true);
      logInfo(`Expérience ${id} supprimée`);
    }
    
    for (const id of createdIds.blogs) {
      await request('DELETE', `/api/blogs/${id}`, null, true);
      logInfo(`Article ${id} supprimé`);
    }
    
    for (const id of createdIds.projects) {
      await request('DELETE', `/api/projects/${id}`, null, true);
      logInfo(`Projet ${id} supprimé`);
    }
    
    for (const id of createdIds.portfolioProjects) {
      await request('DELETE', `/api/portfolio-projects/${id}`, null, true);
      logInfo(`Projet portfolio ${id} supprimé`);
    }
    
    for (const id of createdIds.categories) {
      await request('DELETE', `/api/categories/${id}`, null, true);
      logInfo(`Catégorie ${id} supprimée`);
    }
    
    logSuccess('Toutes les données de test ont été supprimées !');
    
  } catch (error) {
    logError(`Erreur nettoyage: ${error.message}`);
  }
}

// ============================================
// 🚀 EXÉCUTION PRINCIPALE
// ============================================

async function testI18n() {
  logSection('🌐 TEST MULTILINGUE (i18n)');
  try {
    const langs = await request('GET', '/api/i18n/languages');
    if (langs.status === 200) {
      logSuccess(`${langs.data.length} langues actives récupérées`);
    }
    const trans = await request('GET', '/api/i18n/translations/fr');
    if (trans.status === 200) {
      logSuccess(`Dictionnaire FR récupéré (${Object.keys(trans.data).length} clés)`);
    }
  } catch (error) {
    logError(`Erreur i18n: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n' + colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🧪 TEST COMPLET API PORTFOLIO - v1.0        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  logInfo(`URL de l'API: ${API_URL}`);
  logInfo(`Utilisateur: ${ADMIN_USERNAME}`);
  console.log('');
  
  const startTime = Date.now();
  
  // Authentification
  const authSuccess = await testAuth();
  if (!authSuccess) {
    logError('Impossible de continuer sans authentification !');
    process.exit(1);
  }
  
  // Tests de toutes les routes
  await testCategories();
  await testPortfolioProjects();
  await testProjects();
  await testBlogs();
  await testExperience();
  await testEducation();
  await testSkills();
  await testClients();
  await testTestimonials();
  await testSocialLinks();
  await testPersonalInfo();
  await testI18n();
  
  // Nettoyage
  await cleanup();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logSection('📊 RÉSUMÉ');
  logSuccess(`Tous les tests terminés en ${duration}s`);
  
  console.log('\n' + colors.bright + colors.green);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   ✅ TESTS TERMINÉS AVEC SUCCÈS !             ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(colors.reset + '\n');
}

// Lancer les tests
runAllTests().catch(error => {
  logError(`Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
