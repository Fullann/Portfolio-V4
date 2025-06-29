const Database = require("better-sqlite3");

// Créer ou ouvrir la base de données
const db = new Database("portfolio.db");

// Activer le mode WAL pour de meilleures performances
db.pragma("journal_mode = WAL");

// Créer les tables
function initializeDatabase() {
  // Table des projets (services)
  db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des témoignages
  db.exec(`
        CREATE TABLE IF NOT EXISTS testimonials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            text TEXT NOT NULL,
            avatar TEXT,
            date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des projets portfolio
  db.exec(`
        CREATE TABLE IF NOT EXISTS portfolio_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            image TEXT,
            description TEXT,
            repo_link TEXT,
            live_link TEXT,
            filter_category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des clients
  db.exec(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            logo TEXT,
            website TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des catégories
  db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des blogs
  db.exec(`
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            excerpt TEXT,
            content TEXT,
            image TEXT,
            date TEXT,
            author TEXT,
            slug TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des informations personnelles
  db.exec(`
        CREATE TABLE IF NOT EXISTS personal_info (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            birthday TEXT NOT NULL,
            location TEXT NOT NULL,
            avatar TEXT,
            about_text TEXT,
            cv_file TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des liens sociaux
  db.exec(`
        CREATE TABLE IF NOT EXISTS social_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table de l'éducation
  db.exec(`
        CREATE TABLE IF NOT EXISTS education (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            institution TEXT NOT NULL,
            period TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table de l'expérience
  db.exec(`
        CREATE TABLE IF NOT EXISTS experience (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position TEXT NOT NULL,
            period TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Table des compétences
  db.exec(`
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            percentage INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
  insertDefaultData();
}

function insertDefaultData() {
  // Vérifier et insérer les données par défaut pour les projets
  const projectCount = db
    .prepare("SELECT COUNT(*) as count FROM projects")
    .get();
  if (projectCount.count === 0) {
    const insertProject = db.prepare(`
            INSERT INTO projects (title, category, image, description)
            VALUES (?, ?, ?, ?)
        `);
    insertProject.run(
      "Finance",
      "web development",
      "./assets/images/project-1.jpg",
      "Projet de développement web financier"
    );
  }

  // Vérifier et insérer les données par défaut pour les témoignages
  const testimonialCount = db
    .prepare("SELECT COUNT(*) as count FROM testimonials")
    .get();
  if (testimonialCount.count === 0) {
    const insertTestimonial = db.prepare(`
            INSERT INTO testimonials (name, text, avatar, date)
            VALUES (?, ?, ?, ?)
        `);
    insertTestimonial.run(
      "Daniel Lewis",
      "Richard was hired to create a corporate identity. We were very pleased with the work done.",
      "./assets/images/avatar-1.png",
      "2021-06-14"
    );
  }

  // Insérer les informations personnelles par défaut
  const personalInfoCount = db
    .prepare("SELECT COUNT(*) as count FROM personal_info")
    .get();
  if (personalInfoCount.count === 0) {
    const insertPersonalInfo = db.prepare(`
            INSERT INTO personal_info (id, name, title, email, phone, birthday, location, avatar, about_text)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
    const aboutText = JSON.stringify([
      "I'm Creative Director and UI/UX Designer from Sydney, Australia, working in web development and print media. I enjoy turning complex problems into simple, beautiful and intuitive designs.",
      "My job is to build your website so that it is functional and user-friendly but at the same time attractive. Moreover, I add personal touch to your product and make sure that is eye-catching and easy to use. My aim is to bring across your message and identity in the most creative way. I created web design for many famous brand companies.",
    ]);
    insertPersonalInfo.run(
      "Richard hanrick",
      "Web developer",
      "richard@example.com",
      "+1 (213) 352-2795",
      "1982-06-23",
      "Sacramento, California, USA",
      "./assets/images/my-avatar.png",
      aboutText
    );
  }

  // Insérer les catégories par défaut
  const categoryCount = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(`
            INSERT INTO categories (name, display_name)
            VALUES (?, ?)
        `);
    insertCategory.run("web development", "Web Development");
    insertCategory.run("applications", "Applications");
    insertCategory.run("web design", "Web Design");
    insertCategory.run("mobile apps", "Mobile Apps");
  }

  // Insérer les compétences par défaut
  const skillCount = db.prepare("SELECT COUNT(*) as count FROM skills").get();
  if (skillCount.count === 0) {
    const insertSkill = db.prepare(`
            INSERT INTO skills (name, percentage)
            VALUES (?, ?)
        `);
    insertSkill.run("Web design", 80);
    insertSkill.run("Graphic design", 70);
    insertSkill.run("Branding", 90);
    insertSkill.run("WordPress", 50);
  }
}

// Fonctions d'accès aux données
const dbOperations = {
  // Projets
  projects: {
    getAll: () =>
      db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all(),
    getById: (id) => db.prepare("SELECT * FROM projects WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO projects (title, category, image, description)
                VALUES (?, ?, ?, ?)
            `);
      const result = stmt.run(
        data.title,
        data.category,
        data.image,
        data.description
      );
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE projects 
                SET title = COALESCE(?, title),
                    category = COALESCE(?, category),
                    image = COALESCE(?, image),
                    description = COALESCE(?, description)
                WHERE id = ?
            `);
      stmt.run(data.title, data.category, data.image, data.description, id);
      return dbOperations.projects.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM projects WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Témoignages
  testimonials: {
    getAll: () =>
      db.prepare("SELECT * FROM testimonials ORDER BY created_at DESC").all(),
    getById: (id) =>
      db.prepare("SELECT * FROM testimonials WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO testimonials (name, text, avatar, date)
                VALUES (?, ?, ?, ?)
            `);
      const result = stmt.run(data.name, data.text, data.avatar, data.date);
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE testimonials 
                SET name = COALESCE(?, name),
                    text = COALESCE(?, text),
                    avatar = COALESCE(?, avatar),
                    date = COALESCE(?, date)
                WHERE id = ?
            `);
      stmt.run(data.name, data.text, data.avatar, data.date, id);
      return dbOperations.testimonials.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM testimonials WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Projets portfolio
  portfolioProjects: {
    getAll: () =>
      db
        .prepare("SELECT * FROM portfolio_projects ORDER BY created_at DESC")
        .all(),
    getById: (id) =>
      db.prepare("SELECT * FROM portfolio_projects WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO portfolio_projects (title, category, image, description, repo_link, live_link, filter_category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
      const result = stmt.run(
        data.title,
        data.category,
        data.image,
        data.description,
        data.repoLink,
        data.liveLink,
        data.filterCategory
      );
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE portfolio_projects 
                SET title = COALESCE(?, title),
                    category = COALESCE(?, category),
                    image = COALESCE(?, image),
                    description = COALESCE(?, description),
                    repo_link = COALESCE(?, repo_link),
                    live_link = COALESCE(?, live_link),
                    filter_category = COALESCE(?, filter_category)
                WHERE id = ?
            `);
      stmt.run(
        data.title,
        data.category,
        data.image,
        data.description,
        data.repoLink,
        data.liveLink,
        data.filterCategory,
        id
      );
      return dbOperations.portfolioProjects.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM portfolio_projects WHERE id = ?");
      return stmt.run(id);
    },
    updateCategoryReferences: (oldName, newName, newDisplayName) => {
      const stmt = db.prepare(`
                UPDATE portfolio_projects 
                SET filter_category = ?, category = ?
                WHERE filter_category = ?
            `);
      return stmt.run(newName, newDisplayName, oldName);
    },
  },

  // Clients
  clients: {
    getAll: () =>
      db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all(),
    getById: (id) => db.prepare("SELECT * FROM clients WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO clients (name, logo, website, description)
                VALUES (?, ?, ?, ?)
            `);
      const result = stmt.run(
        data.name,
        data.logo,
        data.website,
        data.description
      );
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE clients 
                SET name = COALESCE(?, name),
                    logo = COALESCE(?, logo),
                    website = COALESCE(?, website),
                    description = COALESCE(?, description)
                WHERE id = ?
            `);
      stmt.run(data.name, data.logo, data.website, data.description, id);
      return dbOperations.clients.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM clients WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Catégories
  categories: {
    getAll: () =>
      db.prepare("SELECT * FROM categories ORDER BY display_name").all(),
    getById: (id) =>
      db.prepare("SELECT * FROM categories WHERE id = ?").get(id),
    getByName: (name) =>
      db.prepare("SELECT * FROM categories WHERE name = ?").get(name),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO categories (name, display_name)
                VALUES (?, ?)
            `);
      const result = stmt.run(data.name, data.displayName);
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE categories 
                SET name = COALESCE(?, name),
                    display_name = COALESCE(?, display_name)
                WHERE id = ?
            `);
      stmt.run(data.name, data.displayName, id);
      return dbOperations.categories.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM categories WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Blogs
  blogs: {
    getAll: () =>
      db.prepare("SELECT * FROM blogs ORDER BY created_at DESC").all(),
    getById: (id) => db.prepare("SELECT * FROM blogs WHERE id = ?").get(id),
    getBySlug: (slug) =>
      db.prepare("SELECT * FROM blogs WHERE slug = ?").get(slug),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO blogs (title, category, excerpt, content, image, date, author, slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
      const result = stmt.run(
        data.title,
        data.category,
        data.excerpt,
        data.content,
        data.image,
        data.date,
        data.author,
        data.slug
      );
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE blogs 
                SET title = COALESCE(?, title),
                    category = COALESCE(?, category),
                    excerpt = COALESCE(?, excerpt),
                    content = COALESCE(?, content),
                    image = COALESCE(?, image),
                    author = COALESCE(?, author),
                    slug = COALESCE(?, slug)
                WHERE id = ?
            `);
      stmt.run(
        data.title,
        data.category,
        data.excerpt,
        data.content,
        data.image,
        data.author,
        data.slug,
        id
      );
      return dbOperations.blogs.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM blogs WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Informations personnelles
  personalInfo: {
    get: () => db.prepare("SELECT * FROM personal_info WHERE id = 1").get(),
    update: (data) => {
      const stmt = db.prepare(`
                UPDATE personal_info 
                SET name = COALESCE(?, name),
                    title = COALESCE(?, title),
                    email = COALESCE(?, email),
                    phone = COALESCE(?, phone),
                    birthday = COALESCE(?, birthday),
                    location = COALESCE(?, location),
                    avatar = COALESCE(?, avatar),
                    about_text = COALESCE(?, about_text),
                    cv_file = COALESCE(?, cv_file),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `);
      stmt.run(
        data.name,
        data.title,
        data.email,
        data.phone,
        data.birthday,
        data.location,
        data.avatar,
        data.aboutText,
        data.cvFile
      );
      return dbOperations.personalInfo.get();
    },
  },

  // Liens sociaux
  socialLinks: {
    getAll: () =>
      db.prepare("SELECT * FROM social_links ORDER BY created_at").all(),
    getById: (id) =>
      db.prepare("SELECT * FROM social_links WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO social_links (name, icon, url)
                VALUES (?, ?, ?)
            `);
      const result = stmt.run(data.name, data.icon, data.url);
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE social_links 
                SET name = COALESCE(?, name),
                    icon = COALESCE(?, icon),
                    url = COALESCE(?, url)
                WHERE id = ?
            `);
      stmt.run(data.name, data.icon, data.url, id);
      return dbOperations.socialLinks.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM social_links WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Éducation
  education: {
    getAll: () =>
      db.prepare("SELECT * FROM education ORDER BY created_at DESC").all(),
    getById: (id) => db.prepare("SELECT * FROM education WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO education (institution, period, description)
                VALUES (?, ?, ?)
            `);
      const result = stmt.run(data.institution, data.period, data.description);
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE education 
                SET institution = COALESCE(?, institution),
                    period = COALESCE(?, period),
                    description = COALESCE(?, description)
                WHERE id = ?
            `);
      stmt.run(data.institution, data.period, data.description, id);
      return dbOperations.education.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM education WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Expérience
  experience: {
    getAll: () =>
      db.prepare("SELECT * FROM experience ORDER BY created_at DESC").all(),
    getById: (id) =>
      db.prepare("SELECT * FROM experience WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO experience (position, period, description)
                VALUES (?, ?, ?)
            `);
      const result = stmt.run(data.position, data.period, data.description);
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE experience 
                SET position = COALESCE(?, position),
                    period = COALESCE(?, period),
                    description = COALESCE(?, description)
                WHERE id = ?
            `);
      stmt.run(data.position, data.period, data.description, id);
      return dbOperations.experience.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM experience WHERE id = ?");
      return stmt.run(id);
    },
  },

  // Compétences
  skills: {
    getAll: () => db.prepare("SELECT * FROM skills ORDER BY created_at").all(),
    getById: (id) => db.prepare("SELECT * FROM skills WHERE id = ?").get(id),
    create: (data) => {
      const stmt = db.prepare(`
                INSERT INTO skills (name, percentage)
                VALUES (?, ?)
            `);
      const result = stmt.run(data.name, data.percentage);
      return { id: result.lastInsertRowid, ...data };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
                UPDATE skills 
                SET name = COALESCE(?, name),
                    percentage = COALESCE(?, percentage)
                WHERE id = ?
            `);
      stmt.run(data.name, data.percentage, id);
      return dbOperations.skills.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM skills WHERE id = ?");
      return stmt.run(id);
    },
  },
  admin: {
    getAll: () =>
      db.prepare("SELECT * FROM admin_users ORDER BY created_at DESC").all(),
    getById: (id) =>
      db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id),
    getByUsername: (username) =>
      db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username),
    create: (data) => {
      const stmt = db.prepare(`
            INSERT INTO admin_users (username, password)
            VALUES (?, ?)
        `);
      const result = stmt.run(data.username, data.password);
      return { id: result.lastInsertRowid, username: data.username };
    },
    update: (id, data) => {
      const stmt = db.prepare(`
            UPDATE admin_users 
            SET username = COALESCE(?, username),
                password = COALESCE(?, password)
            WHERE id = ?
        `);
      stmt.run(data.username, data.password, id);
      return dbOperations.admin.getById(id);
    },
    delete: (id) => {
      const stmt = db.prepare("DELETE FROM admin_users WHERE id = ?");
      return stmt.run(id);
    },
    updatePassword: (username, newPassword) => {
      const stmt = db.prepare(`
            UPDATE admin_users 
            SET password = ?
            WHERE username = ?
        `);
      return stmt.run(newPassword, username);
    },
  },
  // Fonction pour vider toutes les tables
  deleteAll: () => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM projects").run();
      db.prepare("DELETE FROM testimonials").run();
      db.prepare("DELETE FROM portfolio_projects").run();
      db.prepare("DELETE FROM clients").run();
      db.prepare("DELETE FROM blogs").run();
      db.prepare("DELETE FROM social_links").run();
      db.prepare("DELETE FROM education").run();
      db.prepare("DELETE FROM experience").run();
      db.prepare("DELETE FROM skills").run();
      // db.prepare('DELETE FROM admin_users').run();

      // Réinitialiser les informations personnelles
      const aboutText = JSON.stringify(["Votre présentation personnelle ici."]);
      db.prepare(
        `
            UPDATE personal_info 
            SET name = 'Votre Nom',
                title = 'Votre Titre',
                email = 'votre@email.com',
                phone = '+33 1 23 45 67 89',
                birthday = '1990-01-01',
                location = 'Votre Ville, Pays',
                avatar = './assets/images/my-avatar.png',
                about_text = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `
      ).run(aboutText);
    });
    transaction();
  },
};

// Initialiser la base de données
initializeDatabase();

module.exports = { db, dbOperations };
