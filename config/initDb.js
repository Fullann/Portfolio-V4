const { pool } = require('./dbPool');

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Créer les tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        image TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        avatar TEXT,
        date VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS portfolio_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        image TEXT,
        description TEXT,
        repo_link TEXT,
        live_link TEXT,
        filter_category VARCHAR(255),
        is_current_work INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await connection.execute("ALTER TABLE portfolio_projects ADD COLUMN is_current_work INT DEFAULT 0");
    } catch (e) {
      // Ignorer si la colonne existe déjà
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        website TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        image TEXT,
        date VARCHAR(20),
        author VARCHAR(255),
        slug VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS personal_info (
        id INT PRIMARY KEY DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        birthday VARCHAR(20) NOT NULL,
        location VARCHAR(255) NOT NULL,
        avatar TEXT,
        about_text LONGTEXT,
        cv_file TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS social_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS education (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution VARCHAR(255) NOT NULL,
        period VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS experience (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position VARCHAR(255) NOT NULL,
        period VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrations de colonnes pour tables existantes
    try {
      await connection.execute("ALTER TABLE education ADD COLUMN display_order INT DEFAULT 0");
    } catch (e) { /* ignore if column exists */ }

    try {
      await connection.execute("ALTER TABLE experience ADD COLUMN display_order INT DEFAULT 0");
    } catch (e) { /* ignore if column exists */ }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        percentage INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS languages (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        flag VARCHAR(10) NOT NULL,
        is_default TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lang_code VARCHAR(10) NOT NULL,
        translation_key VARCHAR(100) NOT NULL,
        translation_value TEXT NOT NULL,
        UNIQUE KEY lang_key_unique (lang_code, translation_key)
      )
    `);

    // Seed default languages if empty
    const [langRows] = await connection.execute("SELECT COUNT(*) as count FROM languages");
    if (langRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO languages (code, name, flag, is_default, is_active) VALUES
        ('fr', 'Français', '🇫🇷', 1, 1),
        ('en', 'English', '🇬🇧', 0, 1),
        ('es', 'Español', '🇪🇸', 0, 0)
      `);

      const defaultTranslations = [
        ['fr', 'nav.about', 'À propos'],
        ['fr', 'nav.resume', 'Parcours'],
        ['fr', 'nav.portfolio', 'Portfolio'],
        ['fr', 'nav.blog', 'Blog'],
        ['fr', 'nav.contact', 'Contact'],
        ['fr', 'about.availability', 'Disponible pour des mandats web freelance (sites vitrines, applications et maintenance).'],
        ['fr', 'about.cta_discuss', 'Discutons de ton projet'],
        ['fr', 'about.cta_view', 'Voir mes projets'],
        ['fr', 'about.working_on', 'Sur quoi je travaille actuellement'],
        ['fr', 'about.recommendations', 'Recommandations'],
        ['fr', 'resume.education', 'Formation'],
        ['fr', 'resume.experience', 'Expérience'],
        ['fr', 'resume.skills', 'Mes Compétences'],
        ['fr', 'contact.title', 'Formulaire de Contact'],
        ['fr', 'contact.name', 'Nom complet'],
        ['fr', 'contact.email', 'Adresse email'],
        ['fr', 'contact.message', 'Votre message'],
        ['fr', 'contact.send', 'Envoyer le message'],
        ['fr', 'portfolio.all', 'Tous'],
        ['fr', 'blog.read_time', 'min de lecture'],
        ['fr', 'blog.share_title', 'Partager cet article'],
        ['fr', 'blog.copy_link', 'Copier le lien'],
        ['fr', 'sidebar.contacts_show', 'Afficher les contacts'],
        ['fr', 'sidebar.email', 'Email'],
        ['fr', 'sidebar.phone', 'Téléphone'],
        ['fr', 'sidebar.birthday', 'Date de naissance'],
        ['fr', 'sidebar.location', 'Localisation'],
        ['fr', 'sidebar.contacts_hide', 'Masquer les contacts'],
        ['fr', 'about.clients', 'Clients'],
        ['fr', 'resume.cv', 'Mon CV'],
        ['fr', 'contact.reassurance', 'Réponse sous 24h ouvrées. Ton message reste confidentiel et n\'est jamais partagé.'],
        ['fr', 'contact.name_placeholder', 'Ton nom'],
        ['fr', 'contact.email_placeholder', 'Adresse e-mail'],
        ['fr', 'contact.message_placeholder', 'Ton message ici...'],
        ['fr', 'portfolio.select_category', 'Sélectionner une catégorie'],

        ['en', 'nav.about', 'About Me'],
        ['en', 'nav.resume', 'Resume'],
        ['en', 'nav.portfolio', 'Portfolio'],
        ['en', 'nav.blog', 'Blog'],
        ['en', 'nav.contact', 'Contact'],
        ['en', 'about.availability', 'Available for freelance web projects (showcase sites, applications & maintenance).'],
        ['en', 'about.cta_discuss', "Let's discuss your project"],
        ['en', 'about.cta_view', 'View my projects'],
        ['en', 'about.working_on', 'What I am currently working on'],
        ['en', 'about.recommendations', 'Recommendations'],
        ['en', 'about.clients', 'Clients'],
        ['en', 'resume.education', 'Education'],
        ['en', 'resume.experience', 'Experience'],
        ['en', 'resume.skills', 'My Skills'],
        ['en', 'resume.cv', 'My Resume'],
        ['en', 'contact.title', 'Contact Form'],
        ['en', 'contact.name', 'Full Name'],
        ['en', 'contact.email', 'Email Address'],
        ['en', 'contact.message', 'Your Message'],
        ['en', 'contact.send', 'Send Message'],
        ['en', 'contact.reassurance', 'Response within 24 working hours. Your message is confidential and never shared.'],
        ['en', 'contact.name_placeholder', 'Your name'],
        ['en', 'contact.email_placeholder', 'Email address'],
        ['en', 'contact.message_placeholder', 'Your message here...'],
        ['en', 'portfolio.all', 'All'],
        ['en', 'portfolio.select_category', 'Select a category'],
        ['en', 'blog.read_time', 'min read'],
        ['en', 'blog.share_title', 'Share this article'],
        ['en', 'blog.copy_link', 'Copy link'],
        ['en', 'sidebar.contacts_show', 'Show contacts'],
        ['en', 'sidebar.contacts_hide', 'Hide contacts'],
        ['en', 'sidebar.email', 'Email'],
        ['en', 'sidebar.phone', 'Phone'],
        ['en', 'sidebar.birthday', 'Birthday'],
        ['en', 'sidebar.location', 'Location']
      ];

      for (const [lang, key, val] of defaultTranslations) {
        await connection.execute(
          "INSERT IGNORE INTO translations (lang_code, translation_key, translation_value) VALUES (?, ?, ?)",
          [lang, key, val]
        );
      }
    }

    // ─── Migration incrémentale : ajouter les nouvelles clés i18n ───────────
    // Utilise INSERT IGNORE → n'écrase pas les valeurs modifiées via l'admin
    const i18nMigration = [
      ['fr', 'sidebar.contacts_hide', 'Masquer les contacts'],
      ['fr', 'about.clients', 'Clients'],
      ['fr', 'resume.cv', 'Mon CV'],
      ['fr', 'contact.reassurance', "Réponse sous 24h ouvrées. Ton message reste confidentiel et n'est jamais partagé."],
      ['fr', 'contact.name_placeholder', 'Ton nom'],
      ['fr', 'contact.email_placeholder', 'Adresse e-mail'],
      ['fr', 'contact.message_placeholder', 'Ton message ici...'],
      ['fr', 'portfolio.select_category', 'Sélectionner une catégorie'],
      ['en', 'sidebar.contacts_hide', 'Hide contacts'],
      ['en', 'about.clients', 'Clients'],
      ['en', 'resume.cv', 'My Resume'],
      ['en', 'contact.reassurance', 'Response within 24 working hours. Your message is confidential and never shared.'],
      ['en', 'contact.name_placeholder', 'Your name'],
      ['en', 'contact.email_placeholder', 'Email address'],
      ['en', 'contact.message_placeholder', 'Your message here...'],
      ['en', 'portfolio.select_category', 'Select a category'],
    ];
    for (const [lang, key, val] of i18nMigration) {
      await connection.execute(
        "INSERT IGNORE INTO translations (lang_code, translation_key, translation_value) VALUES (?, ?, ?)",
        [lang, key, val]
      );
    }

    connection.release();

    await insertDefaultData();
    console.log("✅ Base de données MySQL initialisée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
  }
}

async function insertDefaultData() {
  try {
    const [projectRows] = await pool.execute("SELECT COUNT(*) as count FROM projects");
    if (projectRows[0].count === 0) {
      await pool.execute(
        `INSERT INTO projects (title, category, image, description) VALUES (?, ?, ?, ?)`,
        ["Finance", "web development", "./assets/images/project-1.jpg", "Projet de développement web financier"]
      );
    }

    const [testimonialRows] = await pool.execute("SELECT COUNT(*) as count FROM testimonials");
    if (testimonialRows[0].count === 0) {
      await pool.execute(
        `INSERT INTO testimonials (name, text, avatar, date) VALUES (?, ?, ?, ?)`,
        ["Daniel Lewis", "Richard was hired to create a corporate identity. We were very pleased with the work done.", "./assets/images/avatar-1.png", "2021-06-14"]
      );
    }

    const [personalInfoRows] = await pool.execute("SELECT COUNT(*) as count FROM personal_info");
    if (personalInfoRows[0].count === 0) {
      const aboutText = JSON.stringify([
        "I'm Creative Director and UI/UX Designer from Sydney, Australia, working in web development and print media. I enjoy turning complex problems into simple, beautiful and intuitive designs.",
        "My job is to build your website so that it is functional and user-friendly but at the same time attractive. Moreover, I add personal touch to your product and make sure that is eye-catching and easy to use. My aim is to bring across your message and identity in the most creative way. I created web design for many famous brand companies."
      ]);
      await pool.execute(
        `INSERT INTO personal_info (id, name, title, email, phone, birthday, location, avatar, about_text) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["Richard hanrick", "Web developer", "richard@example.com", "+1 (213) 352-2795", "1982-06-23", "Sacramento, California, USA", "./assets/images/my-avatar.png", aboutText]
      );
    }

    const [categoryRows] = await pool.execute("SELECT COUNT(*) as count FROM categories");
    if (categoryRows[0].count === 0) {
      const categories = [
        ["web development", "Web Development"],
        ["applications", "Applications"],
        ["web design", "Web Design"],
        ["mobile apps", "Mobile Apps"]
      ];
      for (const [name, displayName] of categories) {
        await pool.execute(`INSERT INTO categories (name, display_name) VALUES (?, ?)`, [name, displayName]);
      }
    }

    const [skillRows] = await pool.execute("SELECT COUNT(*) as count FROM skills");
    if (skillRows[0].count === 0) {
      const skills = [
        ["Web design", 80],
        ["Graphic design", 70],
        ["Branding", 90],
        ["WordPress", 50]
      ];
      for (const [name, percentage] of skills) {
        await pool.execute(`INSERT INTO skills (name, percentage) VALUES (?, ?)`, [name, percentage]);
      }
    }

    const [settingsRows] = await pool.execute("SELECT COUNT(*) as count FROM settings");
    if (settingsRows[0].count === 0) {
      const defaultSettings = [
        ["site_name", "Mon Portfolio"],
        ["site_description", "Portfolio personnel"],
        ["site_author", "Fullann"],
        ["base_url", "http://localhost:3000"],
        ["admin_email", ""],
        ["hcaptcha_sitekey", ""],
        ["hcaptcha_secret", ""]
      ];
      for (const [key, value] of defaultSettings) {
        await pool.execute(`INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)`, [key, value]);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion des données par défaut:", error);
  }
}

module.exports = { initializeDatabase, insertDefaultData };
