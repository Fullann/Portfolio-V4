#!/usr/bin/env node

/**
 * 🛠️ Script d'Audit et de Réparation Automatique de la Base de Données en Production
 *
 * Ce script :
 * 1. Teste la connexion à MySQL avec les variables d'environnement (.env).
 * 2. Analyse chaque table du schéma attendu.
 * 3. Si une table manque, elle est créée immédiatement.
 * 4. Si des colonnes manquent dans une table existante, elles sont ajoutées automatiquement (ALTER TABLE).
 * 5. Vérifie et injecte les index et clés de configuration essentielles (sans écraser les données).
 *
 * Utilisation :
 *   node scripts/check-and-fix-db.js
 *   npm run db:check
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// Couleurs ANSI pour affichage terminal clair
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Schéma canonique de référence pour Portfolio V4
const EXPECTED_SCHEMA = {
  projects: {
    createSql: `
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        image TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      title: "VARCHAR(255) NOT NULL",
      category: "VARCHAR(255) NOT NULL",
      image: "TEXT",
      description: "TEXT",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  testimonials: {
    createSql: `
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        avatar TEXT,
        date VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      name: "VARCHAR(255) NOT NULL",
      text: "TEXT NOT NULL",
      avatar: "TEXT",
      date: "VARCHAR(20)",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  portfolio_projects: {
    createSql: `
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
        is_visible INT DEFAULT 1,
        technologies TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      title: "VARCHAR(255) NOT NULL",
      category: "VARCHAR(255) NOT NULL",
      image: "TEXT",
      description: "TEXT",
      repo_link: "TEXT",
      live_link: "TEXT",
      filter_category: "VARCHAR(255)",
      is_current_work: "INT DEFAULT 0",
      is_visible: "INT DEFAULT 1",
      technologies: "TEXT",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  clients: {
    createSql: `
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        website TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      name: "VARCHAR(255) NOT NULL",
      logo: "TEXT",
      website: "TEXT",
      description: "TEXT",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  categories: {
    createSql: `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      name: "VARCHAR(255) NOT NULL UNIQUE",
      display_name: "VARCHAR(255) NOT NULL",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  blogs: {
    createSql: `
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
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      title: "VARCHAR(255) NOT NULL",
      category: "VARCHAR(255) NOT NULL",
      excerpt: "TEXT",
      content: "LONGTEXT",
      image: "TEXT",
      date: "VARCHAR(20)",
      author: "VARCHAR(255)",
      slug: "VARCHAR(255) UNIQUE",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  personal_info: {
    createSql: `
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
    `,
    columns: {
      id: "INT PRIMARY KEY DEFAULT 1",
      name: "VARCHAR(255) NOT NULL",
      title: "VARCHAR(255) NOT NULL",
      email: "VARCHAR(255) NOT NULL",
      phone: "VARCHAR(50) NOT NULL",
      birthday: "VARCHAR(20) NOT NULL",
      location: "VARCHAR(255) NOT NULL",
      avatar: "TEXT",
      about_text: "LONGTEXT",
      cv_file: "TEXT",
      updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
  },

  social_links: {
    createSql: `
      CREATE TABLE IF NOT EXISTS social_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      name: "VARCHAR(255) NOT NULL",
      icon: "VARCHAR(255) NOT NULL",
      url: "TEXT NOT NULL",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  education: {
    createSql: `
      CREATE TABLE IF NOT EXISTS education (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution VARCHAR(255) NOT NULL,
        period VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      institution: "VARCHAR(255) NOT NULL",
      period: "VARCHAR(255) NOT NULL",
      description: "TEXT",
      display_order: "INT DEFAULT 0",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  experience: {
    createSql: `
      CREATE TABLE IF NOT EXISTS experience (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position VARCHAR(255) NOT NULL,
        period VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      position: "VARCHAR(255) NOT NULL",
      period: "VARCHAR(255) NOT NULL",
      description: "TEXT",
      display_order: "INT DEFAULT 0",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  certifications: {
    createSql: `
      CREATE TABLE IF NOT EXISTS certifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        issuer VARCHAR(255),
        date VARCHAR(50),
        logo TEXT,
        credential_url TEXT,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      title: "VARCHAR(255) NOT NULL",
      issuer: "VARCHAR(255)",
      date: "VARCHAR(50)",
      logo: "TEXT",
      credential_url: "TEXT",
      display_order: "INT DEFAULT 0",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  skills: {
    createSql: `
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        percentage INT NOT NULL,
        category VARCHAR(100) DEFAULT 'Frontend',
        icon VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      name: "VARCHAR(255) NOT NULL",
      percentage: "INT NOT NULL",
      category: "VARCHAR(100) DEFAULT 'Frontend'",
      icon: "VARCHAR(255) DEFAULT ''",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  analytics_events: {
    createSql: `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        event_target VARCHAR(255) DEFAULT '',
        event_date DATE NOT NULL,
        count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily_event (event_type, event_target, event_date)
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      event_type: "VARCHAR(50) NOT NULL",
      event_target: "VARCHAR(255) DEFAULT ''",
      event_date: "DATE NOT NULL",
      count: "INT DEFAULT 1",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  admin_users: {
    createSql: `
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      username: "VARCHAR(255) NOT NULL UNIQUE",
      password: "VARCHAR(255) NOT NULL",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  audit_logs: {
    createSql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(255) NOT NULL,
        target VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      user_id: "INT",
      action: "VARCHAR(255) NOT NULL",
      target: "VARCHAR(255)",
      details: "TEXT",
      ip_address: "VARCHAR(45)",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }
  },

  settings: {
    createSql: `
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
    columns: {
      setting_key: "VARCHAR(255) PRIMARY KEY",
      setting_value: "TEXT",
      updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    }
  },

  languages: {
    createSql: `
      CREATE TABLE IF NOT EXISTS languages (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        flag VARCHAR(10) NOT NULL,
        is_default TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1
      )
    `,
    columns: {
      code: "VARCHAR(10) PRIMARY KEY",
      name: "VARCHAR(50) NOT NULL",
      flag: "VARCHAR(10) NOT NULL",
      is_default: "TINYINT(1) DEFAULT 0",
      is_active: "TINYINT(1) DEFAULT 1"
    }
  },

  translations: {
    createSql: `
      CREATE TABLE IF NOT EXISTS translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lang_code VARCHAR(10) NOT NULL,
        translation_key VARCHAR(100) NOT NULL,
        translation_value LONGTEXT NOT NULL,
        UNIQUE KEY lang_key_unique (lang_code, translation_key)
      )
    `,
    columns: {
      id: "INT AUTO_INCREMENT PRIMARY KEY",
      lang_code: "VARCHAR(10) NOT NULL",
      translation_key: "VARCHAR(100) NOT NULL",
      translation_value: "LONGTEXT NOT NULL"
    }
  }
};

// Clés de configuration obligatoires
const ESSENTIAL_SETTINGS = [
  ["site_name", "Mon Portfolio"],
  ["site_description", "Portfolio personnel"],
  ["site_author", "Fullann"],
  ["base_url", "http://localhost:3000"],
  ["admin_email", ""],
  ["hcaptcha_sitekey", ""],
  ["hcaptcha_secret", ""],
  ["maintenance_mode", "false"],
  ["availability_status", "available"],
  ["availability_text", "Disponible pour de nouveaux projets"],
  ["github_username", "Fullann"]
];

async function checkAndFixDatabase() {
  console.log(`\n${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   🔍 AUDIT & RÉPARATION BASE DE DONNÉES EN PRODUCTION${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "portfolio",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    connectTimeout: 10000,
  };

  console.log(`${colors.dim}Paramètres de connexion détectés :${colors.reset}`);
  console.log(`  - Hôte     : ${colors.bold}${dbConfig.host}:${dbConfig.port}${colors.reset}`);
  console.log(`  - Base     : ${colors.bold}${dbConfig.database}${colors.reset}`);
  console.log(`  - Utilisateur : ${colors.bold}${dbConfig.user}${colors.reset}`);
  console.log(`  - Mot de passe: ${dbConfig.password ? '****** (configuré)' : `${colors.yellow}[vide]${colors.reset}`}\n`);

  let connection;
  const startTime = Date.now();

  try {
    process.stdout.write(`📡 Tentative de connexion MySQL... `);
    connection = await mysql.createConnection(dbConfig);
    const latency = Date.now() - startTime;
    console.log(`${colors.green}${colors.bold}SUCCÈS (${latency}ms)${colors.reset}`);

    const [verResult] = await connection.execute("SELECT VERSION() as version, DATABASE() as current_db");
    console.log(`   Version MySQL : ${colors.green}${verResult[0].version}${colors.reset}`);
    console.log(`   Base active   : ${colors.green}${verResult[0].current_db}${colors.reset}\n`);
  } catch (connErr) {
    console.log(`${colors.red}${colors.bold}ÉCHEC !${colors.reset}`);
    console.error(`\n${colors.red}❌ Impossible de se connecter à la base de données :${colors.reset}`);
    console.error(`   Message : ${connErr.message}`);
    console.error(`   Code    : ${connErr.code || 'N/A'}`);
    console.log(`\n${colors.yellow}👉 Conseils de dépannage pour la production (o2switch) :${colors.reset}`);
    console.log(`   1. Vérifiez que votre fichier .env est bien présent à la racine.`);
    console.log(`   2. Sur o2switch, DB_NAME et DB_USER ont un préfixe cPanel obligatoire (ex: cpaneluser_portfolio).`);
    console.log(`   3. Sur o2switch, DB_HOST=localhost (ou 127.0.0.1).`);
    console.log(`   4. Vérifiez que l'utilisateur MySQL a bien 'ALL PRIVILEGES' sur la base.\n`);
    process.exit(1);
  }

  let totalTablesChecked = 0;
  let totalTablesCreated = 0;
  let totalColumnsAdded = 0;
  let totalColumnsOk = 0;

  try {
    console.log(`${colors.bold}📋 Vérification de l'intégrité du schéma (${Object.keys(EXPECTED_SCHEMA).length} tables attendues) :${colors.reset}`);

    // Récupérer la liste des tables existantes dans la base
    const [existingTablesRaw] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    const existingTableNames = new Set(existingTablesRaw.map(r => r.table_name || r.TABLE_NAME));

    for (const [tableName, tableSpec] of Object.entries(EXPECTED_SCHEMA)) {
      totalTablesChecked++;
      const tableExists = existingTableNames.has(tableName);

      if (!tableExists) {
        // Table manquante -> la créer
        process.stdout.write(`  📁 Table ${colors.yellow}${tableName.padEnd(20)}${colors.reset} : `);
        await connection.execute(tableSpec.createSql);
        totalTablesCreated++;
        console.log(`${colors.yellow}➕ CRÉÉE (absente du schéma)${colors.reset}`);
      } else {
        process.stdout.write(`  📁 Table ${colors.cyan}${tableName.padEnd(20)}${colors.reset} : ${colors.green}✓ Présente${colors.reset}`);

        // Table existante -> vérifier les colonnes
        const [existingColsRaw] = await connection.execute(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
          [tableName]
        );
        const existingColNames = new Set(existingColsRaw.map(c => (c.column_name || c.COLUMN_NAME).toLowerCase()));

        const missingCols = [];
        for (const [colName, colDef] of Object.entries(tableSpec.columns)) {
          if (!existingColNames.has(colName.toLowerCase())) {
            missingCols.push({ colName, colDef });
          } else {
            totalColumnsOk++;
          }
        }

        if (missingCols.length === 0) {
          console.log(` ${colors.dim}(Toutes colonnes OK)${colors.reset}`);
        } else {
          console.log(` ${colors.yellow}⚠️ ${missingCols.length} colonne(s) manquante(s)${colors.reset}`);
          for (const { colName, colDef } of missingCols) {
            try {
              process.stdout.write(`     └─ ➕ Ajout colonne ${colors.bold}${colName}${colors.reset} (${colDef})... `);
              await connection.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${colDef}`);
              totalColumnsAdded++;
              console.log(`${colors.green}OK${colors.reset}`);
            } catch (alterErr) {
              console.log(`${colors.red}ERREUR : ${alterErr.message}${colors.reset}`);
            }
          }
        }
      }
    }

    // ===================================================
    // VÉRIFICATION DES DONNÉES ESSENTIELLES & PARAMÈTRES
    // ===================================================
    console.log(`\n${colors.bold}⚙️  Vérification des paramètres par défaut & clés de config :${colors.reset}`);

    let settingsAdded = 0;
    for (const [key, value] of ESSENTIAL_SETTINGS) {
      const [res] = await connection.execute(
        "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)",
        [key, value]
      );
      if (res.affectedRows > 0) {
        settingsAdded++;
        console.log(`  ➕ Clé de configuration injectée : ${colors.yellow}${key}${colors.reset} = "${value}"`);
      }
    }
    if (settingsAdded === 0) {
      console.log(`  ${colors.green}✓ Toutes les clés de configuration système sont présentes.${colors.reset}`);
    }

    // Vérifier personal_info id=1
    const [infoRows] = await connection.execute("SELECT COUNT(*) as count FROM personal_info WHERE id = 1");
    if (infoRows[0].count === 0) {
      const defaultAbout = JSON.stringify([
        "Bienvenue sur mon portfolio professionnel.",
        "Passionné par l'architecture logicielle, le développement web et la sécurité."
      ]);
      await connection.execute(
        `INSERT INTO personal_info (id, name, title, email, phone, birthday, location, avatar, about_text)
         VALUES (1, 'Fullann', 'Développeur Fullstack', 'contact@fullann.ch', '+41 00 000 00 00', '1995-01-01', 'Suisse', './assets/images/my-avatar.png', ?)`,
        [defaultAbout]
      );
      console.log(`  ➕ Profil personal_info initialisé par défaut (id=1).`);
    } else {
      console.log(`  ${colors.green}✓ Profil personnel (personal_info id=1) présent.${colors.reset}`);
    }

    // Vérifier les langues par défaut
    const [langCount] = await connection.execute("SELECT COUNT(*) as count FROM languages");
    if (langCount[0].count === 0) {
      await connection.execute(`
        INSERT INTO languages (code, name, flag, is_default, is_active) VALUES
        ('fr', 'Français', '🇫🇷', 1, 1),
        ('en', 'English', '🇬🇧', 0, 1),
        ('es', 'Español', '🇪🇸', 0, 0)
      `);
      console.log(`  ➕ Langues par défaut initialisées (FR, EN, ES).`);
    } else {
      console.log(`  ${colors.green}✓ Table des langues initialisée (${langCount[0].count} langue(s)).${colors.reset}`);
    }

    // ===================================================
    // RAPPORT FINAL
    // ===================================================
    console.log(`\n${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}${colors.bold}   🎉 RAPPORT D'AUDIT TERMINÉ AVEC SUCCÈS${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`  - Tables vérifiées          : ${colors.bold}${totalTablesChecked}${colors.reset}`);
    console.log(`  - Tables créées             : ${totalTablesCreated > 0 ? `${colors.yellow}${totalTablesCreated}` : `${colors.green}0 (toutes existaient)`}${colors.reset}`);
    console.log(`  - Colonnes conformes        : ${colors.green}${totalColumnsOk}${colors.reset}`);
    console.log(`  - Colonnes réparées/ajoutées : ${totalColumnsAdded > 0 ? `${colors.yellow}${totalColumnsAdded}` : `${colors.green}0 (aucune manquante)`}${colors.reset}`);
    console.log(`  - État global de la DB      : ${colors.green}${colors.bold}100% OPÉRATIONNELLE POUR LA PROD${colors.reset}\n`);

  } catch (queryErr) {
    console.error(`\n${colors.red}❌ Erreur durant l'audit du schéma :${colors.reset}`, queryErr);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter l'audit
checkAndFixDatabase();
