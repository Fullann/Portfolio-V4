// ============================================
// 🎯 PORTFOLIO ADMIN DASHBOARD - COMPLET
// ============================================

// Variables globales
let token = localStorage.getItem('adminToken');
let currentEditingId = null;

// ============================================
// 🚨 INTERCEPTEUR DE REQUÊTES
// ============================================

async function fetchWithAuth(url, options = {}) {
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  options.headers = headers;
  
  console.log(`🌐 ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, options);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.error('🔴 Token invalide');
      localStorage.removeItem('adminToken');
      token = null;
      document.getElementById('login-section').classList.remove('hidden');
      document.getElementById('admin-panel').classList.add('hidden');
      showNotification('⚠️ Session expirée', 'error');
      throw new Error('Unauthorized');
    }
    
    return response;
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('❌ Erreur:', error);
      showNotification('Erreur de connexion', 'error');
    }
    throw error;
  }
}

// ============================================
// 🔐 AUTHENTIFICATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initialisation du dashboard...');
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('📝 Tentative de connexion...');
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          token = data.token;
          localStorage.setItem('adminToken', token);
          document.getElementById('login-section').classList.add('hidden');
          document.getElementById('admin-panel').classList.remove('hidden');
          await initializeDashboard();
          showNotification('✅ Connexion réussie !', 'success');
        } else {
          showNotification('❌ ' + data.error, 'error');
        }
      } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur de connexion', 'error');
      }
      
      return false;
    });
  }
  
  // Vérifier token au chargement
  if (token) {
    console.log('🔑 Token trouvé, vérification...');
    
    fetch('/api/portfolio-projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (response.ok) {
        console.log('✅ Token valide');
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        initializeDashboard();
      } else {
        console.log('❌ Token invalide');
        localStorage.removeItem('adminToken');
        token = null;
      }
    })
    .catch(() => {
      console.log('❌ Erreur réseau');
      localStorage.removeItem('adminToken');
      token = null;
    });
  }
  
  // Attacher tous les autres event listeners
  attachAllEventListeners();
  
  // Fermer modales avec clic extérieur
  document.querySelectorAll('[id$="-modal"]').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Fermer modales avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        if (!modal.classList.contains('hidden')) {
          closeModal(modal.id);
        }
      });
    }
  });
});

function logout() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    localStorage.removeItem('adminToken');
    token = null;
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    showNotification('Déconnexion réussie', 'success');
  }
}

// ============================================
// 🎨 ATTACHER TOUS LES EVENT LISTENERS
// ============================================

function attachAllEventListeners() {
  console.log('📌 Attachement des event listeners...');
  
  const forms = {
    'category-form': handleCategorySubmit,
    'portfolio-form': handlePortfolioSubmit,
    'project-form': handleProjectSubmit,
    'blog-form': handleBlogSubmit,
    'experience-form': handleExperienceSubmit,
    'education-form': handleEducationSubmit,
    'skill-form': handleSkillSubmit,
    'client-form': handleClientSubmit,
    'testimonial-form': handleTestimonialSubmit,
    'social-form': handleSocialSubmit,
    'personal-info-form': handlePersonalInfoSubmit,
    'account-update-form': handleAccountUpdate,
    'password-change-form': handlePasswordChange
  };
  
  Object.entries(forms).forEach(([formId, handler]) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener('submit', handler);
    }
  });
  
  // Synchroniser slider et input
  const skillPercentage = document.getElementById('skill-percentage');
  const skillSlider = document.getElementById('skill-slider');
  
  if (skillPercentage && skillSlider) {
    skillPercentage.addEventListener('input', (e) => {
      skillSlider.value = e.target.value;
    });
    
    skillSlider.addEventListener('input', (e) => {
      skillPercentage.value = e.target.value;
    });
  }
  
  console.log('✅ Event listeners attachés');
}

// ============================================
// 📝 HANDLERS DE FORMULAIRES
// ============================================

async function handleCategorySubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  console.log('💾 Enregistrement catégorie...');
  
  const categoryData = {
    name: document.getElementById('category-name').value,
    displayName: document.getElementById('category-display').value
  };
  
  try {
    const url = currentEditingId 
      ? `/api/categories/${currentEditingId}`
      : '/api/categories';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(categoryData)
    });
    
    if (response.ok) {
      showNotification(`✅ Catégorie ${currentEditingId ? 'modifiée' : 'ajoutée'} !`, 'success');
      closeModal('category-modal');
      await loadCategories();
      await loadCategoryOptions();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handlePortfolioSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  console.log('💾 Enregistrement projet portfolio...');
  
  const formData = new FormData();
  formData.append('title', document.getElementById('portfolio-title').value);
  formData.append('category', document.getElementById('portfolio-category').value);
  formData.append('description', document.getElementById('portfolio-description').value);
  formData.append('repoLink', document.getElementById('portfolio-repo').value);
  formData.append('liveLink', document.getElementById('portfolio-live').value);
  formData.append('filterCategory', document.getElementById('portfolio-category').value);
  
  const imageFile = document.getElementById('portfolio-image').files[0];
  if (imageFile) formData.append('image', imageFile);
  
  try {
    const url = currentEditingId 
      ? `/api/portfolio-projects/${currentEditingId}`
      : '/api/portfolio-projects';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: formData
    });
    
    if (response.ok) {
      showNotification(`✅ Projet ${currentEditingId ? 'modifié' : 'ajouté'} !`, 'success');
      closeModal('portfolio-modal');
      await loadPortfolioProjects();
      await loadDashboardStats();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const formData = new FormData();
  formData.append('title', document.getElementById('project-title').value);
  formData.append('category', document.getElementById('project-category').value);
  formData.append('description', document.getElementById('project-description').value);
  
  const imageFile = document.getElementById('project-image').files[0];
  if (imageFile) formData.append('image', imageFile);
  
  try {
    const url = currentEditingId ? `/api/projects/${currentEditingId}` : '/api/projects';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, { method, body: formData });
    
    if (response.ok) {
      showNotification(`✅ Projet ${currentEditingId ? 'modifié' : 'ajouté'} !`, 'success');
      closeModal('project-modal');
      await loadProjects();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleBlogSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const formData = new FormData();
  formData.append('title', document.getElementById('blog-title').value);
  formData.append('category', document.getElementById('blog-category').value);
  formData.append('excerpt', document.getElementById('blog-excerpt').value);
  formData.append('content', document.getElementById('blog-content').value);
  formData.append('author', document.getElementById('blog-author').value);
  
  const imageFile = document.getElementById('blog-image').files[0];
  if (imageFile) formData.append('image', imageFile);
  
  try {
    const url = currentEditingId ? `/api/blogs/${currentEditingId}` : '/api/blogs';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, { method, body: formData });
    
    if (response.ok) {
      showNotification(`✅ Article ${currentEditingId ? 'modifié' : 'publié'} !`, 'success');
      closeModal('blog-modal');
      await loadBlogs();
      await loadDashboardStats();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleExperienceSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const experienceData = {
    position: document.getElementById('experience-position').value,
    period: document.getElementById('experience-period').value,
    description: document.getElementById('experience-description').value
  };
  
  try {
    const url = currentEditingId ? `/api/experience/${currentEditingId}` : '/api/experience';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(experienceData)
    });
    
    if (response.ok) {
      showNotification(`✅ Expérience ${currentEditingId ? 'modifiée' : 'ajoutée'} !`, 'success');
      closeModal('experience-modal');
      await loadExperience();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleEducationSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const educationData = {
    institution: document.getElementById('education-institution').value,
    period: document.getElementById('education-period').value,
    description: document.getElementById('education-description').value
  };
  
  try {
    const url = currentEditingId ? `/api/education/${currentEditingId}` : '/api/education';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(educationData)
    });
    
    if (response.ok) {
      showNotification(`✅ Formation ${currentEditingId ? 'modifiée' : 'ajoutée'} !`, 'success');
      closeModal('education-modal');
      await loadEducation();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleSkillSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const skillData = {
    name: document.getElementById('skill-name').value,
    percentage: document.getElementById('skill-percentage').value
  };
  
  try {
    const url = currentEditingId ? `/api/skills/${currentEditingId}` : '/api/skills';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(skillData)
    });
    
    if (response.ok) {
      showNotification(`✅ Compétence ${currentEditingId ? 'modifiée' : 'ajoutée'} !`, 'success');
      closeModal('skill-modal');
      await loadSkills();
      await loadDashboardStats();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleClientSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const formData = new FormData();
  formData.append('name', document.getElementById('client-name').value);
  formData.append('website', document.getElementById('client-website').value);
  formData.append('description', document.getElementById('client-description').value);
  
  const logoFile = document.getElementById('client-logo').files[0];
  if (logoFile) formData.append('logo', logoFile);
  
  try {
    const url = currentEditingId ? `/api/clients/${currentEditingId}` : '/api/clients';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, { method, body: formData });
    
    if (response.ok) {
      showNotification(`✅ Client ${currentEditingId ? 'modifié' : 'ajouté'} !`, 'success');
      closeModal('client-modal');
      await loadClients();
      await loadDashboardStats();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleTestimonialSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const formData = new FormData();
  formData.append('name', document.getElementById('testimonial-name').value);
  formData.append('text', document.getElementById('testimonial-text').value);
  
  const avatarFile = document.getElementById('testimonial-avatar').files[0];
  if (avatarFile) formData.append('avatar', avatarFile);
  
  try {
    const url = currentEditingId ? `/api/testimonials/${currentEditingId}` : '/api/testimonials';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, { method, body: formData });
    
    if (response.ok) {
      showNotification(`✅ Témoignage ${currentEditingId ? 'modifié' : 'ajouté'} !`, 'success');
      closeModal('testimonial-modal');
      await loadTestimonials();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleSocialSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const socialData = {
    name: document.getElementById('social-name').value,
    icon: document.getElementById('social-icon').value,
    url: document.getElementById('social-url').value
  };
  
  try {
    const url = currentEditingId ? `/api/social-links/${currentEditingId}` : '/api/social-links';
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(socialData)
    });
    
    if (response.ok) {
      showNotification(`✅ Lien social ${currentEditingId ? 'modifié' : 'ajouté'} !`, 'success');
      closeModal('social-modal');
      await loadSocialLinks();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handlePersonalInfoSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const formData = new FormData();
  formData.append('name', document.getElementById('personal-name').value);
  formData.append('title', document.getElementById('personal-title').value);
  formData.append('email', document.getElementById('personal-email').value);
  formData.append('phone', document.getElementById('personal-phone').value);
  formData.append('birthday', document.getElementById('personal-birthday').value);
  formData.append('location', document.getElementById('personal-location').value);
  formData.append('aboutText', document.getElementById('personal-about').value);
  
  const avatarFile = document.getElementById('personal-avatar').files[0];
  if (avatarFile) formData.append('avatar', avatarFile);
  
  const cvFile = document.getElementById('personal-cv').files[0];
  if (cvFile) formData.append('cv', cvFile);
  
  try {
    const response = await fetchWithAuth('/api/personal-info', {
      method: 'PUT',
      body: formData
    });
    
    if (response.ok) {
      showNotification('✅ Profil mis à jour !', 'success');
      await loadPersonalInfo();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handleAccountUpdate(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const newUsername = document.getElementById('new-username').value;
  
  try {
    const response = await fetchWithAuth('/api/admin/update-account', {
      method: 'PUT',
      body: JSON.stringify({ username: newUsername })
    });
    
    if (response.ok) {
      showNotification('✅ Nom d\'utilisateur modifié !', 'success');
      await loadAccountInfo();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

async function handlePasswordChange(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    showNotification('❌ Les mots de passe ne correspondent pas !', 'error');
    return false;
  }
  
  try {
    const response = await fetchWithAuth('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    if (response.ok) {
      showNotification('✅ Mot de passe changé !', 'success');
      document.getElementById('password-change-form').reset();
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.error, 'error');
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
  
  return false;
}

// ============================================
// 📊 CHARGEMENT DES DONNÉES
// ============================================

async function initializeDashboard() {
  try {
    await Promise.all([
      loadDashboardStats(),
      loadPersonalInfo(),
      loadSocialLinks(),
      loadPortfolioProjects(),
      loadProjects(),
      loadBlogs(),
      loadExperience(),
      loadEducation(),
      loadSkills(),
      loadClients(),
      loadTestimonials(),
      loadCategories(),
      loadCategoryOptions(),
      loadAccountInfo()
    ]);
    console.log('✅ Dashboard chargé');
  } catch (error) {
    console.error('❌ Erreur init:', error);
  }
}

async function loadDashboardStats() {
  try {
    const [portfolio, blogs, clients, skills] = await Promise.all([
      fetch('/api/portfolio-projects').then(r => r.json()),
      fetch('/api/blogs').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/skills').then(r => r.json())
    ]);
    
    document.getElementById('stat-portfolio').textContent = portfolio.length;
    document.getElementById('stat-blogs').textContent = blogs.length;
    document.getElementById('stat-clients').textContent = clients.length;
    document.getElementById('stat-skills').textContent = skills.length;
  } catch (error) {
    console.error('Erreur stats:', error);
  }
}

async function loadPersonalInfo() {
  try {
    const response = await fetch('/api/personal-info');
    const info = await response.json();
    
    console.log('👤 Infos personnelles:', info);
    
    if (info) {
      document.getElementById('personal-name').value = info.name || '';
      document.getElementById('personal-title').value = info.title || '';
      document.getElementById('personal-email').value = info.email || '';
      document.getElementById('personal-phone').value = info.phone || '';
      document.getElementById('personal-birthday').value = info.birthday || '';
      document.getElementById('personal-location').value = info.location || '';
      document.getElementById('personal-about').value = Array.isArray(info.aboutText) ? info.aboutText.join('\n') : (info.aboutText || '');
      
      if (info.name) {
        document.getElementById('preview-name').textContent = info.name;
        document.getElementById('preview-initial').textContent = info.name.charAt(0).toUpperCase();
        document.getElementById('user-initial').textContent = info.name.charAt(0).toUpperCase();
      }
      if (info.title) document.getElementById('preview-title').textContent = info.title;
      if (info.email) document.getElementById('preview-email').textContent = info.email;
      if (info.phone) document.getElementById('preview-phone').textContent = info.phone;
      if (info.location) document.getElementById('preview-location').textContent = info.location;
      
      if (info.avatar) {
        const avatarImg = document.getElementById('preview-avatar');
        avatarImg.src = info.avatar;
        avatarImg.classList.remove('hidden');
        document.getElementById('preview-initial').style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadSocialLinks() {
  try {
    const response = await fetch('/api/social-links');
    const socialLinks = await response.json();
    const list = document.getElementById('social-links-list');
    
    if (!list) return;
    
    console.log('🔗 Liens sociaux:', socialLinks);
    
    if (socialLinks.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">Aucun lien social</p>';
      return;
    }
    
    list.innerHTML = socialLinks.map(social => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <ion-icon name="${social.icon}" class="text-2xl text-indigo-600"></ion-icon>
          </div>
          <div>
            <p class="font-semibold text-gray-800">${social.name}</p>
            <p class="text-xs text-gray-500 truncate max-w-[200px]">${social.url}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="editSocial(${social.id})" type="button" class="p-2 hover:bg-white rounded-lg transition">✏️</button>
          <button onclick="deleteSocial(${social.id})" type="button" class="p-2 hover:bg-red-50 rounded-lg transition">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    const list = document.getElementById('categories-list');
    
    console.log('📦 Catégories:', categories);
    
    if (!list) return;
    
    if (categories.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-4">Aucune catégorie</p>';
      return;
    }
    
    list.innerHTML = categories.map(category => `
      <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p class="font-semibold text-gray-800 text-sm">${category.display_name || 'Sans nom'}</p>
          <p class="text-xs text-gray-500">${category.name || ''}</p>
        </div>
        <div class="flex gap-1">
          <button onclick="editCategory(${category.id})" type="button" class="p-1 hover:bg-green-100 rounded transition text-xs">✏️</button>
          <button onclick="deleteCategory(${category.id})" type="button" class="p-1 hover:bg-red-100 rounded transition text-xs">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadCategoryOptions() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    const select = document.getElementById('portfolio-category');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Sélectionner une catégorie</option>' +
      categories.map(cat => 
        `<option value="${cat.name}">${cat.display_name || cat.name}</option>`
      ).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadPortfolioProjects() {
  try {
    const response = await fetch('/api/portfolio-projects');
    const projects = await response.json();
    const list = document.getElementById('portfolio-list');
    
    console.log('💼 Projets portfolio:', projects);
    
    if (!list) return;
    
    if (projects.length === 0) {
      list.innerHTML = '<div class="col-span-full text-center py-16"><p class="text-gray-500">Aucun projet portfolio</p></div>';
      return;
    }
    
    list.innerHTML = projects.map(project => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group">
        ${project.image ? `
          <div class="h-48 overflow-hidden bg-gray-100">
            <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
          </div>
        ` : `
          <div class="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        `}
        <div class="p-4">
          <h3 class="font-bold text-gray-800 mb-1">${project.title}</h3>
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">${project.description || 'Pas de description'}</p>
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">${project.category || 'Non catégorisé'}</span>
          </div>
          <div class="flex gap-2">
            ${project.repoLink ? `<a href="${project.repoLink}" target="_blank" class="flex-1 text-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition">Code</a>` : ''}
            ${project.liveLink ? `<a href="${project.liveLink}" target="_blank" class="flex-1 text-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">Voir</a>` : ''}
          </div>
          <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <button onclick="editPortfolioProject(${project.id})" type="button" class="flex-1 px-3 py-2 hover:bg-green-50 text-green-700 rounded-lg text-sm font-semibold transition">✏️ Modifier</button>
            <button onclick="deletePortfolioProject(${project.id})" type="button" class="flex-1 px-3 py-2 hover:bg-red-50 text-red-700 rounded-lg text-sm font-semibold transition">🗑️ Supprimer</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadProjects() {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();
    const list = document.getElementById('projects-list');
    
    console.log('📁 Projets:', projects);
    
    if (!list) return;
    
    if (projects.length === 0) {
      list.innerHTML = '<div class="col-span-full text-center py-16"><p class="text-gray-500">Aucun projet</p></div>';
      return;
    }
    
    list.innerHTML = projects.map(project => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition">
        ${project.image ? `
          <div class="h-48 overflow-hidden bg-gray-100">
            <img src="${project.image}" alt="${project.title}" class="w-full h-full object-cover"/>
          </div>
        ` : ''}
        <div class="p-4">
          <h3 class="font-bold text-gray-800 mb-1">${project.title}</h3>
          <p class="text-sm text-indigo-600 mb-2">${project.category}</p>
          <p class="text-sm text-gray-600 mb-3">${project.description}</p>
          <div class="flex gap-2">
            <button onclick="editProject(${project.id})" type="button" class="flex-1 px-3 py-2 hover:bg-green-50 text-green-700 rounded-lg text-sm font-semibold transition">✏️ Modifier</button>
            <button onclick="deleteProject(${project.id})" type="button" class="flex-1 px-3 py-2 hover:bg-red-50 text-red-700 rounded-lg text-sm font-semibold transition">🗑️ Supprimer</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadBlogs() {
  try {
    const response = await fetch('/api/blogs');
    const blogs = await response.json();
    const list = document.getElementById('blogs-list');
    
    console.log('✍️ Blogs:', blogs);
    
    if (!list) return;
    
    if (blogs.length === 0) {
      list.innerHTML = '<div class="text-center py-16"><p class="text-gray-500">Aucun article</p></div>';
      return;
    }
    
    list.innerHTML = blogs.map(blog => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition">
        <div class="flex gap-4">
          ${blog.image ? `
            <div class="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src="${blog.image}" alt="${blog.title}" class="w-full h-full object-cover"/>
            </div>
          ` : ''}
          <div class="flex-1">
            <h3 class="font-bold text-gray-800 text-lg mb-2">${blog.title}</h3>
            <p class="text-sm text-indigo-600 mb-2">${blog.category} • ${blog.author || 'Admin'}</p>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">${blog.excerpt}</p>
            <div class="flex gap-2">
              <a href="/blog/${blog.slug}" target="_blank" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition">👁️ Voir</a>
              <button onclick="editBlog(${blog.id})" type="button" class="px-4 py-2 hover:bg-green-50 text-green-700 rounded-lg text-sm font-semibold transition">✏️ Modifier</button>
              <button onclick="deleteBlog(${blog.id})" type="button" class="px-4 py-2 hover:bg-red-50 text-red-700 rounded-lg text-sm font-semibold transition">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadExperience() {
  try {
    const response = await fetch('/api/experience');
    const experience = await response.json();
    const list = document.getElementById('experience-list');
    
    console.log('💼 Expérience:', experience);
    
    if (!list) return;
    
    if (experience.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-8">Aucune expérience</p>';
      return;
    }
    
    list.innerHTML = experience.map((exp, index) => `
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-gray-800">${exp.position}</h4>
          <div class="flex gap-1">
            ${index > 0 ? `<button onclick="moveExperienceUp(${exp.id})" type="button" class="p-1 hover:bg-blue-100 rounded transition">⬆️</button>` : ''}
            ${index < experience.length - 1 ? `<button onclick="moveExperienceDown(${exp.id})" type="button" class="p-1 hover:bg-blue-100 rounded transition">⬇️</button>` : ''}
          </div>
        </div>
        <p class="text-sm text-indigo-600 mb-2">${exp.period}</p>
        <p class="text-sm text-gray-600">${exp.description}</p>
        <div class="flex gap-2 mt-3">
          <button onclick="editExperience(${exp.id})" type="button" class="text-xs px-3 py-1 hover:bg-green-100 text-green-700 rounded transition">✏️ Modifier</button>
          <button onclick="deleteExperience(${exp.id})" type="button" class="text-xs px-3 py-1 hover:bg-red-100 text-red-700 rounded transition">🗑️ Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadEducation() {
  try {
    const response = await fetch('/api/education');
    const education = await response.json();
    const list = document.getElementById('education-list');
    
    console.log('🎓 Formation:', education);
    
    if (!list) return;
    
    if (education.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-8">Aucune formation</p>';
      return;
    }
    
    list.innerHTML = education.map((edu, index) => `
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-gray-800">${edu.institution}</h4>
          <div class="flex gap-1">
            ${index > 0 ? `<button onclick="moveEducationUp(${edu.id})" type="button" class="p-1 hover:bg-purple-100 rounded transition">⬆️</button>` : ''}
            ${index < education.length - 1 ? `<button onclick="moveEducationDown(${edu.id})" type="button" class="p-1 hover:bg-purple-100 rounded transition">⬇️</button>` : ''}
          </div>
        </div>
        <p class="text-sm text-purple-600 mb-2">${edu.period}</p>
        <p class="text-sm text-gray-600">${edu.description}</p>
        <div class="flex gap-2 mt-3">
          <button onclick="editEducation(${edu.id})" type="button" class="text-xs px-3 py-1 hover:bg-green-100 text-green-700 rounded transition">✏️ Modifier</button>
          <button onclick="deleteEducation(${edu.id})" type="button" class="text-xs px-3 py-1 hover:bg-red-100 text-red-700 rounded transition">🗑️ Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadSkills() {
  try {
    const response = await fetch('/api/skills');
    const skills = await response.json();
    const list = document.getElementById('skills-list');
    
    console.log('⚡ Compétences:', skills);
    
    if (!list) return;
    
    if (skills.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">Aucune compétence</p>';
      return;
    }
    
    list.innerHTML = skills.map(skill => `
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-bold text-gray-800">${skill.name}</h4>
          <span class="text-sm font-semibold text-amber-600">${skill.percentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div class="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-500" style="width: ${skill.percentage}%"></div>
        </div>
        <div class="flex gap-2">
          <button onclick="editSkill(${skill.id})" type="button" class="text-xs px-3 py-1 hover:bg-green-100 text-green-700 rounded transition">✏️ Modifier</button>
          <button onclick="deleteSkill(${skill.id})" type="button" class="text-xs px-3 py-1 hover:bg-red-100 text-red-700 rounded transition">🗑️ Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadClients() {
  try {
    const response = await fetch('/api/clients');
    const clients = await response.json();
    const list = document.getElementById('clients-list');
    
    console.log('🤝 Clients:', clients);
    
    if (!list) return;
    
    if (clients.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun client</p>';
      return;
    }
    
    list.innerHTML = clients.map(client => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-center gap-3">
          ${client.logo ? `
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-white">
              <img src="${client.logo}" alt="${client.name}" class="w-full h-full object-contain"/>
            </div>
          ` : ''}
          <div>
            <p class="font-semibold text-gray-800">${client.name}</p>
            ${client.website ? `<a href="${client.website}" target="_blank" class="text-xs text-indigo-600 hover:underline">${client.website}</a>` : ''}
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="editClient(${client.id})" type="button" class="p-2 hover:bg-green-100 rounded-lg transition">✏️</button>
          <button onclick="deleteClient(${client.id})" type="button" class="p-2 hover:bg-red-100 rounded-lg transition">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadTestimonials() {
  try {
    const response = await fetch('/api/testimonials');
    const testimonials = await response.json();
    const list = document.getElementById('testimonials-list');
    
    console.log('💬 Témoignages:', testimonials);
    
    if (!list) return;
    
    if (testimonials.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun témoignage</p>';
      return;
    }
    
    list.innerHTML = testimonials.map(testimonial => `
      <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-start gap-3 mb-2">
          ${testimonial.avatar ? `
            <div class="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0">
              <img src="${testimonial.avatar}" alt="${testimonial.name}" class="w-full h-full object-cover"/>
            </div>
          ` : `
            <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span class="text-orange-600 font-bold">${testimonial.name.charAt(0)}</span>
            </div>
          `}
          <div class="flex-1">
            <p class="font-semibold text-gray-800">${testimonial.name}</p>
            <p class="text-sm text-gray-600 mt-1">${testimonial.text}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <button onclick="editTestimonial(${testimonial.id})" type="button" class="text-xs px-3 py-1 hover:bg-green-100 text-green-700 rounded transition">✏️ Modifier</button>
          <button onclick="deleteTestimonial(${testimonial.id})" type="button" class="text-xs px-3 py-1 hover:bg-red-100 text-red-700 rounded transition">🗑️ Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadAccountInfo() {
  try {
    const response = await fetchWithAuth('/api/admin/account-info');
    
    if (response.ok) {
      const accountInfo = await response.json();
      document.getElementById('current-username').textContent = accountInfo.username;
      
      if (accountInfo.createdat) {
        const created = new Date(accountInfo.createdat).toLocaleDateString('fr-FR');
        document.getElementById('account-created').textContent = created;
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================
// 🔧 FONCTIONS UTILITAIRES
// ============================================

function showSection(sectionName) {
  document.querySelectorAll('.section-content').forEach(section => {
    section.classList.add('hidden');
  });
  
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const section = document.getElementById(`${sectionName}-section`);
  if (section) {
    section.classList.remove('hidden');
    section.classList.add('animate-slide-in');
  }
  
  const sidebarItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (sidebarItem) {
    sidebarItem.classList.add('active');
  }
  
  const titles = {
    dashboard: { title: 'Dashboard', desc: 'Vue d\'ensemble' },
    personal: { title: 'Profil', desc: 'Informations personnelles' },
    portfolio: { title: 'Portfolio', desc: 'Projets en ligne' },
    projects: { title: 'Projets', desc: 'Autres réalisations' },
    blog: { title: 'Blog', desc: 'Articles' },
    resume: { title: 'CV', desc: 'Parcours' },
    clients: { title: 'Clients', desc: 'Témoignages' },
    settings: { title: 'Paramètres', desc: 'Configuration' }
  };
  
  if (titles[sectionName]) {
    document.getElementById('section-title').textContent = titles[sectionName].title;
    document.getElementById('section-description').textContent = titles[sectionName].desc;
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    currentEditingId = null;
  }
}

function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modal.classList.contains('hidden')) {
      openModal(modalId);
    } else {
      closeModal(modalId);
    }
  }
}

function showNotification(message, type = 'success') {
  document.querySelectorAll('.notification-toast').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification-toast fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  } text-white font-semibold`;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    notification.style.transition = 'all 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// 🎭 FONCTIONS MODALES
// ============================================

function openCategoryModal() {
  currentEditingId = null;
  document.getElementById('category-form').reset();
  openModal('category-modal');
}

function openPortfolioModal() {
  currentEditingId = null;
  document.getElementById('portfolio-form').reset();
  openModal('portfolio-modal');
}

function openProjectModal() {
  currentEditingId = null;
  document.getElementById('project-form').reset();
  openModal('project-modal');
}

function openBlogModal() {
  currentEditingId = null;
  document.getElementById('blog-form').reset();
  openModal('blog-modal');
}

function openExperienceModal() {
  currentEditingId = null;
  document.getElementById('experience-form').reset();
  openModal('experience-modal');
}

function openEducationModal() {
  currentEditingId = null;
  document.getElementById('education-form').reset();
  openModal('education-modal');
}

function openSkillModal() {
  currentEditingId = null;
  document.getElementById('skill-form').reset();
  const slider = document.getElementById('skill-slider');
  if (slider) slider.value = 50;
  openModal('skill-modal');
}

function openClientModal() {
  currentEditingId = null;
  document.getElementById('client-form').reset();
  openModal('client-modal');
}

function openTestimonialModal() {
  currentEditingId = null;
  document.getElementById('testimonial-form').reset();
  openModal('testimonial-modal');
}

function openSocialModal() {
  currentEditingId = null;
  document.getElementById('social-form').reset();
  openModal('social-modal');
}

// ============================================
// ✏️ FONCTIONS EDIT
// ============================================

async function editCategory(id) {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    const category = categories.find(c => c.id === id);
    
    if (category) {
      currentEditingId = id;
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-display').value = category.display_name;
      openModal('category-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editPortfolioProject(id) {
  try {
    const response = await fetch('/api/portfolio-projects');
    const projects = await response.json();
    const project = projects.find(p => p.id === id);
    
    if (project) {
      currentEditingId = id;
      document.getElementById('portfolio-title').value = project.title;
      document.getElementById('portfolio-category').value = project.filterCategory || '';
      document.getElementById('portfolio-description').value = project.description;
      document.getElementById('portfolio-repo').value = project.repoLink || '';
      document.getElementById('portfolio-live').value = project.liveLink || '';
      openModal('portfolio-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editProject(id) {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();
    const project = projects.find(p => p.id === id);
    
    if (project) {
      currentEditingId = id;
      document.getElementById('project-title').value = project.title;
      document.getElementById('project-category').value = project.category;
      document.getElementById('project-description').value = project.description;
      openModal('project-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editBlog(id) {
  try {
    const response = await fetch('/api/blogs');
    const blogs = await response.json();
    const blog = blogs.find(b => b.id === id);
    
    if (blog) {
      currentEditingId = id;
      document.getElementById('blog-title').value = blog.title;
      document.getElementById('blog-category').value = blog.category;
      document.getElementById('blog-excerpt').value = blog.excerpt;
      document.getElementById('blog-content').value = blog.content;
      document.getElementById('blog-author').value = blog.author || '';
      openModal('blog-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editExperience(id) {
  try {
    const response = await fetch('/api/experience');
    const experience = await response.json();
    const exp = experience.find(e => e.id === id);
    
    if (exp) {
      currentEditingId = id;
      document.getElementById('experience-position').value = exp.position;
      document.getElementById('experience-period').value = exp.period;
      document.getElementById('experience-description').value = exp.description;
      openModal('experience-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editEducation(id) {
  try {
    const response = await fetch('/api/education');
    const education = await response.json();
    const edu = education.find(e => e.id === id);
    
    if (edu) {
      currentEditingId = id;
      document.getElementById('education-institution').value = edu.institution;
      document.getElementById('education-period').value = edu.period;
      document.getElementById('education-description').value = edu.description;
      openModal('education-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editSkill(id) {
  try {
    const response = await fetch('/api/skills');
    const skills = await response.json();
    const skill = skills.find(s => s.id === id);
    
    if (skill) {
      currentEditingId = id;
      document.getElementById('skill-name').value = skill.name;
      document.getElementById('skill-percentage').value = skill.percentage;
      const slider = document.getElementById('skill-slider');
      if (slider) slider.value = skill.percentage;
      openModal('skill-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editClient(id) {
  try {
    const response = await fetch('/api/clients');
    const clients = await response.json();
    const client = clients.find(c => c.id === id);
    
    if (client) {
      currentEditingId = id;
      document.getElementById('client-name').value = client.name;
      document.getElementById('client-website').value = client.website || '';
      document.getElementById('client-description').value = client.description || '';
      openModal('client-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editTestimonial(id) {
  try {
    const response = await fetch('/api/testimonials');
    const testimonials = await response.json();
    const testimonial = testimonials.find(t => t.id === id);
    
    if (testimonial) {
      currentEditingId = id;
      document.getElementById('testimonial-name').value = testimonial.name;
      document.getElementById('testimonial-text').value = testimonial.text;
      openModal('testimonial-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function editSocial(id) {
  try {
    const response = await fetch('/api/social-links');
    const socialLinks = await response.json();
    const social = socialLinks.find(s => s.id === id);
    
    if (social) {
      currentEditingId = id;
      document.getElementById('social-name').value = social.name;
      document.getElementById('social-icon').value = social.icon;
      document.getElementById('social-url').value = social.url;
      openModal('social-modal');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================
// 🗑️ FONCTIONS DELETE
// ============================================

async function deleteCategory(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Catégorie supprimée !', 'success');
      await loadCategories();
      await loadCategoryOptions();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deletePortfolioProject(id) {
  if (!confirm('Supprimer ce projet ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/portfolio-projects/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Projet supprimé !', 'success');
      await loadPortfolioProjects();
      await loadDashboardStats();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteProject(id) {
  if (!confirm('Supprimer ce projet ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/projects/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Projet supprimé !', 'success');
      await loadProjects();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteBlog(id) {
  if (!confirm('Supprimer cet article ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/blogs/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Article supprimé !', 'success');
      await loadBlogs();
      await loadDashboardStats();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteExperience(id) {
  if (!confirm('Supprimer cette expérience ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/experience/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Expérience supprimée !', 'success');
      await loadExperience();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteEducation(id) {
  if (!confirm('Supprimer cette formation ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/education/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Formation supprimée !', 'success');
      await loadEducation();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteSkill(id) {
  if (!confirm('Supprimer cette compétence ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/skills/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Compétence supprimée !', 'success');
      await loadSkills();
      await loadDashboardStats();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteClient(id) {
  if (!confirm('Supprimer ce client ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/clients/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Client supprimé !', 'success');
      await loadClients();
      await loadDashboardStats();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Supprimer ce témoignage ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/testimonials/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Témoignage supprimé !', 'success');
      await loadTestimonials();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

async function deleteSocial(id) {
  if (!confirm('Supprimer ce lien social ?')) return;
  
  try {
    const response = await fetchWithAuth(`/api/social-links/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('✅ Lien supprimé !', 'success');
      await loadSocialLinks();
    }
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Erreur:', error);
    }
  }
}

// ============================================
// ⬆️⬇️ FONCTIONS MOVE
// ============================================

async function moveExperienceUp(id) {
  try {
    const response = await fetchWithAuth(`/api/experience/${id}/move-up`, {
      method: 'POST'
    });
    
    if (response.ok) await loadExperience();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function moveExperienceDown(id) {
  try {
    const response = await fetchWithAuth(`/api/experience/${id}/move-down`, {
      method: 'POST'
    });
    
    if (response.ok) await loadExperience();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function moveEducationUp(id) {
  try {
    const response = await fetchWithAuth(`/api/education/${id}/move-up`, {
      method: 'POST'
    });
    
    if (response.ok) await loadEducation();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function moveEducationDown(id) {
  try {
    const response = await fetchWithAuth(`/api/education/${id}/move-down`, {
      method: 'POST'
    });
    
    if (response.ok) await loadEducation();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

console.log('🎯 Admin Dashboard v5.0 COMPLET - Prêt ! ✅');
