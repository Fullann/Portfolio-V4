const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portfolio',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction d'initialisation de la base de données
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS experience (
                id INT AUTO_INCREMENT PRIMARY KEY,
                position VARCHAR(255) NOT NULL,
                period VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

        connection.release();
        
        await insertDefaultData();
        console.log('✅ Base de données MySQL initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    }
}

async function insertDefaultData() {
    try {
        // Vérifier et insérer les données par défaut pour les projets
        const [projectRows] = await pool.execute('SELECT COUNT(*) as count FROM projects');
        if (projectRows[0].count === 0) {
            await pool.execute(`
                INSERT INTO projects (title, category, image, description)
                VALUES (?, ?, ?, ?)
            `, ['Finance', 'web development', './assets/images/project-1.jpg', 'Projet de développement web financier']);
        }

        // Vérifier et insérer les données par défaut pour les témoignages
        const [testimonialRows] = await pool.execute('SELECT COUNT(*) as count FROM testimonials');
        if (testimonialRows[0].count === 0) {
            await pool.execute(`
                INSERT INTO testimonials (name, text, avatar, date)
                VALUES (?, ?, ?, ?)
            `, ['Daniel Lewis', 'Richard was hired to create a corporate identity. We were very pleased with the work done.', './assets/images/avatar-1.png', '2021-06-14']);
        }

        // Insérer les informations personnelles par défaut
        const [personalInfoRows] = await pool.execute('SELECT COUNT(*) as count FROM personal_info');
        if (personalInfoRows[0].count === 0) {
            const aboutText = JSON.stringify([
                "I'm Creative Director and UI/UX Designer from Sydney, Australia, working in web development and print media. I enjoy turning complex problems into simple, beautiful and intuitive designs.",
                "My job is to build your website so that it is functional and user-friendly but at the same time attractive. Moreover, I add personal touch to your product and make sure that is eye-catching and easy to use. My aim is to bring across your message and identity in the most creative way. I created web design for many famous brand companies."
            ]);
            await pool.execute(`
                INSERT INTO personal_info (id, name, title, email, phone, birthday, location, avatar, about_text)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
            `, ['Richard hanrick', 'Web developer', 'richard@example.com', '+1 (213) 352-2795', '1982-06-23', 'Sacramento, California, USA', './assets/images/my-avatar.png', aboutText]);
        }

        // Insérer les catégories par défaut
        const [categoryRows] = await pool.execute('SELECT COUNT(*) as count FROM categories');
        if (categoryRows[0].count === 0) {
            const categories = [
                ['web development', 'Web Development'],
                ['applications', 'Applications'],
                ['web design', 'Web Design'],
                ['mobile apps', 'Mobile Apps']
            ];
            
            for (const [name, displayName] of categories) {
                await pool.execute(`
                    INSERT INTO categories (name, display_name)
                    VALUES (?, ?)
                `, [name, displayName]);
            }
        }

        // Insérer les compétences par défaut
        const [skillRows] = await pool.execute('SELECT COUNT(*) as count FROM skills');
        if (skillRows[0].count === 0) {
            const skills = [
                ['Web design', 80],
                ['Graphic design', 70],
                ['Branding', 90],
                ['WordPress', 50]
            ];
            
            for (const [name, percentage] of skills) {
                await pool.execute(`
                    INSERT INTO skills (name, percentage)
                    VALUES (?, ?)
                `, [name, percentage]);
            }
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion des données par défaut:', error);
    }
}

// Fonctions d'accès aux données
const dbOperations = {
    // Projets
    projects: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM projects ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO projects (title, category, image, description)
                VALUES (?, ?, ?, ?)
            `, [data.title, data.category, data.image, data.description]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
            if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
            if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
            if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE projects SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.projects.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
            return result;
        }
    },

    // Témoignages
    testimonials: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM testimonials ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM testimonials WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO testimonials (name, text, avatar, date)
                VALUES (?, ?, ?, ?)
            `, [data.name, data.text, data.avatar, data.date]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
            if (data.text !== undefined) { fields.push('text = ?'); values.push(data.text); }
            if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
            if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.testimonials.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM testimonials WHERE id = ?', [id]);
            return result;
        }
    },

    // Projets portfolio
    portfolioProjects: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM portfolio_projects ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM portfolio_projects WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO portfolio_projects (title, category, image, description, repo_link, live_link, filter_category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [data.title, data.category, data.image, data.description, data.repoLink, data.liveLink, data.filterCategory]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
            if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
            if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
            if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
            if (data.repoLink !== undefined) { fields.push('repo_link = ?'); values.push(data.repoLink); }
            if (data.liveLink !== undefined) { fields.push('live_link = ?'); values.push(data.liveLink); }
            if (data.filterCategory !== undefined) { fields.push('filter_category = ?'); values.push(data.filterCategory); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE portfolio_projects SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.portfolioProjects.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM portfolio_projects WHERE id = ?', [id]);
            return result;
        },
        updateCategoryReferences: async (oldName, newName, newDisplayName) => {
            const [result] = await pool.execute(`
                UPDATE portfolio_projects 
                SET filter_category = ?, category = ?
                WHERE filter_category = ?
            `, [newName, newDisplayName, oldName]);
            return result;
        }
    },

    // Clients
    clients: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM clients ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO clients (name, logo, website, description)
                VALUES (?, ?, ?, ?)
            `, [data.name, data.logo, data.website, data.description]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
            if (data.logo !== undefined) { fields.push('logo = ?'); values.push(data.logo); }
            if (data.website !== undefined) { fields.push('website = ?'); values.push(data.website); }
            if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE clients SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.clients.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM clients WHERE id = ?', [id]);
            return result;
        }
    },

    // Catégories
    categories: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM categories ORDER BY display_name');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
            return rows[0];
        },
        getByName: async (name) => {
            const [rows] = await pool.execute('SELECT * FROM categories WHERE name = ?', [name]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO categories (name, display_name)
                VALUES (?, ?)
            `, [data.name, data.displayName]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
            if (data.displayName !== undefined) { fields.push('display_name = ?'); values.push(data.displayName); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE categories SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.categories.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
            return result;
        }
    },

    // Blogs
    blogs: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM blogs ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM blogs WHERE id = ?', [id]);
            return rows[0];
        },
        getBySlug: async (slug) => {
            const [rows] = await pool.execute('SELECT * FROM blogs WHERE slug = ?', [slug]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO blogs (title, category, excerpt, content, image, date, author, slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [data.title, data.category, data.excerpt, data.content, data.image, data.date, data.author, data.slug]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
            if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
            if (data.excerpt !== undefined) { fields.push('excerpt = ?'); values.push(data.excerpt); }
            if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
            if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
            if (data.author !== undefined) { fields.push('author = ?'); values.push(data.author); }
            if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE blogs SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.blogs.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM blogs WHERE id = ?', [id]);
            return result;
        }
    },

    // Informations personnelles
    personalInfo: {
        get: async () => {
            const [rows] = await pool.execute('SELECT * FROM personal_info WHERE id = 1');
            return rows[0];
        },
        update: async (data) => {
            const fields = [];
            const values = [];
            
            if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
            if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
            if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
            if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
            if (data.birthday !== undefined) { fields.push('birthday = ?'); values.push(data.birthday); }
            if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
            if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
            if (data.aboutText !== undefined) { fields.push('about_text = ?'); values.push(data.aboutText); }
            if (data.cvFile !== undefined) { fields.push('cv_file = ?'); values.push(data.cvFile); }
            
            fields.push('updated_at = NOW()');
            values.push(1);
            
            await pool.execute(`
                UPDATE personal_info SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.personalInfo.get();
        }
    },

    // Liens sociaux
    socialLinks: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM social_links ORDER BY created_at');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM social_links WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO social_links (name, icon, url)
                VALUES (?, ?, ?)
            `, [data.name, data.icon, data.url]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
            if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
            if (data.url !== undefined) { fields.push('url = ?'); values.push(data.url); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE social_links SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.socialLinks.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM social_links WHERE id = ?', [id]);
            return result;
        }
    },

    // Éducation
    education: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM education ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM education WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO education (institution, period, description)
                VALUES (?, ?, ?)
            `, [data.institution, data.period, data.description]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.institution !== undefined) { fields.push('institution = ?'); values.push(data.institution); }
            if (data.period !== undefined) { fields.push('period = ?'); values.push(data.period); }
            if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE education SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.education.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM education WHERE id = ?', [id]);
            return result;
        }
    },

    // Expérience
    experience: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM experience ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM experience WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO experience (position, period, description)
                VALUES (?, ?, ?)
            `, [data.position, data.period, data.description]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.position !== undefined) { fields.push('position = ?'); values.push(data.position); }
            if (data.period !== undefined) { fields.push('period = ?'); values.push(data.period); }
            if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE experience SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.experience.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM experience WHERE id = ?', [id]);
            return result;
        }
    },

    // Compétences
    skills: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM skills ORDER BY created_at');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM skills WHERE id = ?', [id]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO skills (name, percentage)
                VALUES (?, ?)
            `, [data.name, data.percentage]);
            return { id: result.insertId, ...data };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
            if (data.percentage !== undefined) { fields.push('percentage = ?'); values.push(data.percentage); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE skills SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.skills.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM skills WHERE id = ?', [id]);
            return result;
        }
    },

    // Admin
    admin: {
        getAll: async () => {
            const [rows] = await pool.execute('SELECT * FROM admin_users ORDER BY created_at DESC');
            return rows;
        },
        getById: async (id) => {
            const [rows] = await pool.execute('SELECT * FROM admin_users WHERE id = ?', [id]);
            return rows[0];
        },
        getByUsername: async (username) => {
            const [rows] = await pool.execute('SELECT * FROM admin_users WHERE username = ?', [username]);
            return rows[0];
        },
        create: async (data) => {
            const [result] = await pool.execute(`
                INSERT INTO admin_users (username, password)
                VALUES (?, ?)
            `, [data.username, data.password]);
            return { id: result.insertId, username: data.username };
        },
        update: async (id, data) => {
            const fields = [];
            const values = [];
            
            if (data.username !== undefined) { fields.push('username = ?'); values.push(data.username); }
            if (data.password !== undefined) { fields.push('password = ?'); values.push(data.password); }
            
            values.push(id);
            
            await pool.execute(`
                UPDATE admin_users SET ${fields.join(', ')} WHERE id = ?
            `, values);
            
            return dbOperations.admin.getById(id);
        },
        delete: async (id) => {
            const [result] = await pool.execute('DELETE FROM admin_users WHERE id = ?', [id]);
            return result;
        },
        updatePassword: async (username, newPassword) => {
            const [result] = await pool.execute(`
                UPDATE admin_users SET password = ? WHERE username = ?
            `, [newPassword, username]);
            return result;
        }
    },

    // Fonction pour vider toutes les tables
    deleteAll: async () => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.execute('DELETE FROM projects');
            await connection.execute('DELETE FROM testimonials');
            await connection.execute('DELETE FROM portfolio_projects');
            await connection.execute('DELETE FROM clients');
            await connection.execute('DELETE FROM blogs');
            await connection.execute('DELETE FROM social_links');
            await connection.execute('DELETE FROM education');
            await connection.execute('DELETE FROM experience');
            await connection.execute('DELETE FROM skills');
            
            // Réinitialiser les informations personnelles
            const aboutText = JSON.stringify(["Votre présentation personnelle ici."]);
            await connection.execute(`
                UPDATE personal_info 
                SET name = 'Votre Nom',
                    title = 'Votre Titre',
                    email = 'votre@email.com',
                    phone = '+33 1 23 45 67 89',
                    birthday = '1990-01-01',
                    location = 'Votre Ville, Pays',
                    avatar = './assets/images/my-avatar.png',
                    about_text = ?,
                    updated_at = NOW()
                WHERE id = 1
            `, [aboutText]);
            
            await connection.commit();
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = { dbOperations, initializeDatabase, pool };