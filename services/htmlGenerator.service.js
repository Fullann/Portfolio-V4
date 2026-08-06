const fs = require('fs').promises;
const path = require('path');
const { dbOperations } = require('../config/database');
const { formatPersonalInfo, formatPortfolioProject } = require('../utils/formatters');

async function updateHtmlFile() {
  try {
    console.log('🔄 Mise à jour du fichier HTML...');

    // Lire le template HTML
    const templatePath = path.join(__dirname, '..', 'index-template.html');
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Récupérer toutes les données
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
      dbOperations.skills.getAll(),
      dbOperations.settings.getAll()
    ]);

    const formattedPersonalInfo = formatPersonalInfo(personalInfo);
    const formattedPortfolioProjects = await Promise.all(
      portfolioProjects.map(formatPortfolioProject)
    );

    // Mettre à jour le SEO, Open Graph & Twitter Cards
    const siteName = siteSettings.site_name || `${formattedPersonalInfo.name} Portfolio`;
    const siteDesc = siteSettings.site_description || `Portfolio de ${formattedPersonalInfo.name} : projets web, expériences, compétences et contact.`;
    const baseUrl = (siteSettings.base_url || 'http://localhost:3000').replace(/\/$/, '');
    let avatarUrl = formattedPersonalInfo.avatar || '/assets/images/my-avatar.png';
    if (!avatarUrl.startsWith('http')) {
      avatarUrl = `${baseUrl}/${avatarUrl.replace(/^\.\//, '')}`;
    }

    htmlContent = htmlContent
      .replace(/<title>.*?<\/title>/i, `<title>${siteName} | ${formattedPersonalInfo.title || 'Portfolio'}</title>`)
      .replace(/<meta\s+name="description"\s+content=".*?"\s*\/>/i, `<meta name="description" content="${siteDesc}" />`)
      .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/>/i, `<link rel="canonical" href="${baseUrl}/" />`)
      .replace(/<meta\s+property="og:site_name"\s+content=".*?"\s*\/>/i, `<meta property="og:site_name" content="${siteName}" />`)
      .replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/>/i, `<meta property="og:title" content="${formattedPersonalInfo.name} | ${formattedPersonalInfo.title}" />`)
      .replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/>/i, `<meta property="og:description" content="${siteDesc}" />`)
      .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/>/i, `<meta property="og:url" content="${baseUrl}/" />`)
      .replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/>/i, `<meta property="og:image" content="${avatarUrl}" />`)
      .replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/>/i, `<meta name="twitter:title" content="${formattedPersonalInfo.name} | ${formattedPersonalInfo.title}" />`)
      .replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/>/i, `<meta name="twitter:description" content="${siteDesc}" />`)
      .replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/>/i, `<meta name="twitter:image" content="${avatarUrl}" />`);

    // Générer le HTML pour les projets "Sur quoi je travaille actuellement"
    const currentWorkProjects = formattedPortfolioProjects.filter(p => p.isCurrentWork === 1);
    const heroProjects = currentWorkProjects.length > 0 ? currentWorkProjects : formattedPortfolioProjects.slice(0, 4);

    const projectsHtml = heroProjects
      .map(project => `
      <li class="project-item active" data-filter-item data-category="${project.filterCategory || project.category}">
        <a href="#" data-project-item>
          <figure class="project-img">
            <div class="project-item-icon-box">
              <ion-icon name="eye-outline"></ion-icon>
            </div>
            <img src="${project.image || '/assets/images/project-1.jpg'}" alt="${project.title}" loading="lazy" data-project-image>
          </figure>
          <h3 class="project-title" data-project-title>${project.title}</h3>
          <p class="project-category" data-project-category>${project.category}</p>
          
          <!-- Données cachées pour la modal -->
          <div style="display: none;">
            <span data-project-description>${project.description || ''}</span>
            <span data-project-repo-link>${project.repoLink || ''}</span>
            <span data-project-live-link>${project.liveLink || ''}</span>
          </div>
        </a>
      </li>
    `)
      .join('\n');

    // Générer le HTML pour les témoignages
    const testimonialsHtml = testimonials
      .map(testimonial => `
        <li class="testimonials-item">
          <div class="content-card" data-testimonials-item>
            <figure class="testimonials-avatar-box">
              <img src="${testimonial.avatar}" alt="${testimonial.name}" width="60" data-testimonials-avatar>
            </figure>
            <h4 class="h4 testimonials-item-title" data-testimonials-title>${testimonial.name}</h4>
            <div class="testimonials-text" data-testimonials-text>
              <p>${testimonial.text}</p>
            </div>
          </div>
        </li>
`)
      .join('\n');

    // Générer le HTML pour les projets portfolio
    const portfolioProjectsHtml = formattedPortfolioProjects
      .map(project => `
      <li class="project-item" data-filter-item data-category="${project.filterCategory || project.category.toLowerCase()}">
        <a href="#" data-project-item>
          <figure class="project-img">
            <div class="project-item-icon-box">
              <ion-icon name="eye-outline"></ion-icon>
            </div>
            <img src="${project.image}" alt="${project.title}" loading="lazy" data-project-image>
          </figure>
          <h3 class="project-title" data-project-title>${project.title}</h3>
          <p class="project-category" data-project-category>${project.category}</p>
          
          <!-- Données pour la modal -->
          <div style="display: none;">
            <span data-project-description>${project.description}</span>
            <span data-project-repo-link>${project.repoLink || ''}</span>
            <span data-project-live-link>${project.liveLink || ''}</span>
          </div>
        </a>
      </li>
`)
      .join('\n');

    // Générer le HTML pour les clients
    const clientsHtml = clients
      .map(client => `
        <li class="clients-item">
          <a href="${client.website || '#'}" ${client.website ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            <img src="${client.logo}" alt="${client.name}" class="client-logo" loading="lazy">
          </a>
        </li>
`)
      .join('\n');

    // Générer le HTML pour les filtres de catégories
    const categoryFiltersHtml = categories
      .map(category => `
        <li class="filter-item">
          <button data-filter-btn>${category.display_name}</button>
        </li>
`)
      .join('\n');

    // Générer le HTML pour le select des catégories
    const categorySelectHtml = categories
      .map(category => `
        <li class="select-item">
                    <button data-select-item>${category.display_name}</button>
                </li>
`)
      .join('\n');

    // Générer le HTML pour les blogs
    const calculateReadingTime = (text) => {
      if (!text) return '1 min de lecture';
      const words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / 200));
      return `${minutes} min de lecture`;
    };

    const blogsHtml = blogs
      .map(blog => `
      <li class="blog-post-item">
        <a href="/blog/${blog.slug}">
          <figure class="blog-banner-box">
            <img src="${blog.image}" alt="${blog.title}" loading="lazy">
          </figure>
          <div class="blog-content">
            <div class="blog-meta">
              <p class="blog-category">${blog.category}</p>
              <span class="dot"></span>
              <time datetime="${blog.date}">${blog.date}</time>
              <span class="dot"></span>
              <span>${calculateReadingTime(blog.content || blog.excerpt)}</span>
            </div>
            <h3 class="h3 blog-item-title">${blog.title}</h3>
            <p class="blog-text">${blog.excerpt}</p>
          </div>
        </a>
      </li>
`)
      .join('\n');

    // Générer le HTML pour les liens sociaux
    const socialLinksHtml = socialLinks
      .map(link => `
        <li class="social-item">
          <a href="${link.url}" class="social-link" target="_blank" rel="noopener noreferrer">
            <ion-icon name="${link.icon}"></ion-icon>
          </a>
        </li>
`)
      .join('\n');

    // Générer le HTML pour l'éducation
    const educationHtml = education
      .map(edu => `
        <li class="timeline-item">
          <h4 class="h4 timeline-item-title">${edu.institution}</h4>
          <span>${edu.period}</span>
          <p class="timeline-text">${edu.description}</p>
        </li>
`)
      .join('\n');

    // Générer le HTML pour l'expérience
    const experienceHtml = experience
      .map(exp => `
        <li class="timeline-item">
          <h4 class="h4 timeline-item-title">${exp.position}</h4>
          <span>${exp.period}</span>
          <p class="timeline-text">${exp.description}</p>
        </li>
`)
      .join('\n');

    // Générer le HTML pour les compétences
    const skillsHtml = skills
      .map(skill => `
        <li class="skills-item">
          <div class="title-wrapper">
            <h5 class="h5">${skill.name}</h5>
            <data value="${skill.percentage}">${skill.percentage}%</data>
          </div>
          <div class="skill-progress-bg">
            <div class="skill-progress-fill" style="width: ${skill.percentage}%"></div>
          </div>
        </li>
`)
      .join('\n');

    // Générer le HTML pour le texte "À propos"
    const aboutTextHtml = formattedPersonalInfo?.aboutText
      ? formattedPersonalInfo.aboutText.map(paragraph => `<p>${paragraph}</p>`).join('\n')
      : '';

    // Générer la section CV
    const cvSectionHtml = formattedPersonalInfo?.cvFile
      ? `
            <div class="cv-container">
                <div class="cv-preview">
                    <div class="cv-info">
                        <ion-icon name="document-text-outline"></ion-icon>
                        <div class="cv-details">
                            <h4>Télécharger mon CV</h4>
                            <p>Consultez mon parcours complet au format PDF</p>
                        </div>
                    </div>
                    <div class="cv-actions">
                        <a href="/download-cv" class="cv-download-btn" target="_blank">
                            <ion-icon name="download-outline"></ion-icon>
                            <span>Télécharger PDF</span>
                        </a>
                        <button onclick="viewCVInline()" class="cv-view-btn">
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>Aperçu</span>
                        </button>
                    </div>
                </div>
                <div id="cv-viewer" class="cv-viewer" style="display: none;">
                    <iframe src="${formattedPersonalInfo.cvFile}" width="100%" height="600px"></iframe>
                </div>
            </div>
        `
      : `
            <div class="cv-container">
                <p>Aucun CV disponible pour le moment.</p>
            </div>
        `;

    // Générer la carte Google Maps
    const mapHtml = formattedPersonalInfo?.location
      ? `
                    <iframe
                        src="https://maps.google.com/maps?q=${encodeURIComponent(formattedPersonalInfo.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed"
                        width="400"
                        height="300"
                        loading="lazy"
                        style="border:0;"
                        allowfullscreen="">
                    </iframe>
                `
      : '';

    // Remplacer les sections dans le HTML
    const replacements = [
      { regex: /(<!-- PROJECTS_START -->)([\s\S]*?)(<!-- PROJECTS_END -->)/, content: projectsHtml },
      { regex: /(<!-- TESTIMONIALS_START -->)([\s\S]*?)(<!-- TESTIMONIALS_END -->)/, content: testimonialsHtml },
      { regex: /(<!-- PORTFOLIO_PROJECTS_START -->)([\s\S]*?)(<!-- PORTFOLIO_PROJECTS_END -->)/, content: portfolioProjectsHtml },
      { regex: /(<!-- CLIENTS_START -->)([\s\S]*?)(<!-- CLIENTS_END -->)/, content: clientsHtml },
      { regex: /(<!-- BLOGS_START -->)([\s\S]*?)(<!-- BLOGS_END -->)/, content: blogsHtml },
      { regex: /(<!-- CATEGORY_FILTERS_START -->)([\s\S]*?)(<!-- CATEGORY_FILTERS_END -->)/, content: categoryFiltersHtml },
      { regex: /(<!-- CATEGORY_SELECT_START -->)([\s\S]*?)(<!-- CATEGORY_SELECT_END -->)/, content: categorySelectHtml },
      { regex: /(<!-- SOCIAL_LINKS_START -->)([\s\S]*?)(<!-- SOCIAL_LINKS_END -->)/, content: socialLinksHtml },
      { regex: /(<!-- EDUCATION_START -->)([\s\S]*?)(<!-- EDUCATION_END -->)/, content: educationHtml },
      { regex: /(<!-- EXPERIENCE_START -->)([\s\S]*?)(<!-- EXPERIENCE_END -->)/, content: experienceHtml },
      { regex: /(<!-- SKILLS_START -->)([\s\S]*?)(<!-- SKILLS_END -->)/, content: skillsHtml },
      { regex: /(<!-- ABOUT_TEXT_START -->)([\s\S]*?)(<!-- ABOUT_TEXT_END -->)/, content: aboutTextHtml },
      { regex: /(<!-- CV_SECTION_START -->)([\s\S]*?)(<!-- CV_SECTION_END -->)/, content: cvSectionHtml },
      { regex: /(<!-- MAP_START -->)([\s\S]*?)(<!-- MAP_END -->)/, content: mapHtml }
    ];

    replacements.forEach(({ regex, content }) => {
      if (regex.test(htmlContent)) {
        htmlContent = htmlContent.replace(regex, `$1\n${content}\n$3`);
      }
    });

    // Remplacer les informations personnelles
    if (formattedPersonalInfo) {
      const personalInfoRegex = /(<!-- PERSONAL_INFO_START -->)([\s\S]*?)(<!-- PERSONAL_INFO_END -->)/;
      if (personalInfoRegex.test(htmlContent)) {
        const personalInfoHtml = `
          <h1 class="name" title="${formattedPersonalInfo.name}">${formattedPersonalInfo.name}</h1>
          <p class="title">${formattedPersonalInfo.title}</p>
`;
        htmlContent = htmlContent.replace(personalInfoRegex, `$1\n${personalInfoHtml}$3`);
      }

      // Remplacer l'avatar
      const avatarRegex = /(<!-- AVATAR_START -->)([\s\S]*?)(<!-- AVATAR_END -->)/;
      if (avatarRegex.test(htmlContent)) {
        const avatarHtml = `<img src="${formattedPersonalInfo.avatar}" alt="${formattedPersonalInfo.name}" width="80">`;
        htmlContent = htmlContent.replace(avatarRegex, `$1\n${avatarHtml}\n$3`);
      }

      // Remplacer les informations de contact
      const contactInfoRegex = /(<!-- CONTACT_INFO_START -->)([\s\S]*?)(<!-- CONTACT_INFO_END -->)/;
      if (contactInfoRegex.test(htmlContent)) {
        const contactInfoHtml = `
          <li class="contact-item">
            <div class="icon-box">
              <ion-icon name="mail-outline"></ion-icon>
            </div>
            <div class="contact-info">
              <p class="contact-title">Adresse Email</p>
              <a href="mailto:${formattedPersonalInfo.email}" class="contact-link">${formattedPersonalInfo.email}</a>
            </div>
          </li>
          <li class="contact-item">
            <div class="icon-box">
              <ion-icon name="phone-portrait-outline"></ion-icon>
            </div>
            <div class="contact-info">
              <p class="contact-title">Numéro de téléphone</p>
              <a href="tel:${formattedPersonalInfo.phone}" class="contact-link">${formattedPersonalInfo.phone}</a>
            </div>
          </li>
          <li class="contact-item">
            <div class="icon-box">
              <ion-icon name="calendar-outline"></ion-icon>
            </div>
            <div class="contact-info">
              <p class="contact-title">Date d'anniversaire</p>
              <time datetime="${formattedPersonalInfo.birthday}">${formattedPersonalInfo.birthday}</time>
            </div>
          </li>
          <li class="contact-item">
            <div class="icon-box">
              <ion-icon name="location-outline"></ion-icon>
            </div>
            <div class="contact-info">
              <p class="contact-title">Location</p>
              <address>${formattedPersonalInfo.location}</address>
            </div>
          </li>
`;
        htmlContent = htmlContent.replace(contactInfoRegex, `$1\n${contactInfoHtml}$3`);
      }
    }

    // Écrire le fichier HTML final
    const outputPath = path.join(__dirname, '..', 'public', 'index.html');
    await fs.writeFile(outputPath, htmlContent, 'utf-8');

    console.log('✅ Fichier HTML mis à jour avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du HTML:', error);
    throw error;
  }
}

module.exports = { updateHtmlFile };
