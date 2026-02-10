# 🎨 Portfolio V4 - Full Stack Application

Portfolio personnel moderne avec interface d'administration complète, construit avec Node.js, Express et MySQL.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [Routes API](#-routes-api)
- [Controllers](#-controllers)
- [Middlewares](#-middlewares)
- [Base de données](#-base-de-données)
- [Déploiement](#-déploiement)
- [Scripts utiles](#-scripts-utiles)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Fonctionnalités

### Frontend Public
- 🏠 Page d'accueil avec présentation
- 💼 Portfolio de projets avec filtres par catégorie
- ✍️ Blog avec articles et pagination
- 📱 Design responsive
- 🎯 SEO optimisé avec métadonnées dynamiques

### Backend Admin
- 🔐 Authentification JWT sécurisée
- 📊 Dashboard d'administration complet
- 📝 CRUD pour tous les contenus
- 🖼️ Upload et optimisation d'images (WebP)
- 🛡️ Rate limiting et protection CAPTCHA
- 📈 Gestion des catégories, projets, blogs, etc.

---

## 🏗️ Architecture

```
Portfolio V4
│
├── Frontend (Vanilla JS + HTML/CSS)
│   ├── Page publique (index.html)
│   └── Interface admin (admin/index.html)
│
├── Backend (Node.js + Express)
│   ├── API REST
│   ├── Authentication JWT
│   └── Middlewares de sécurité
│
└── Base de données (MySQL)
    ├── 12 tables
    └── Gestion complète du portfolio
```

---

## 📦 Prérequis

- **Node.js** : v18.x ou supérieur (recommandé v18 LTS)
- **MySQL** : v5.7 ou supérieur
- **npm** : v8.x ou supérieur

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Fullann/Portfolio-V4.git
cd Portfolio-V4
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer la base de données

```bash
# Connexion à MySQL
mysql -u root -p

# Créer la base de données
CREATE DATABASE portfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_db;

# Importer le schéma (si tu as un dump SQL)
source mysql-db.sql;

# Ou exécute le script d'initialisation
node mysql-db.js
```

---

## ⚙️ Configuration

### 1. Variables d'environnement

Crée un fichier `.env` à la racine :

```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ton_mot_de_passe
DB_NAME=portfolio_db

# Serveur
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=ton_secret_jwt_super_securise_ici

# Google reCAPTCHA (optionnel)
RECAPTCHA_SECRET_KEY=ta_cle_secrete_recaptcha
```

### 2. Configuration de la base de données

Si tu n'utilises pas `.env`, modifie directement dans `server.js` :

```javascript
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ton_mot_de_passe',
  database: 'portfolio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();
```

---

## 🎬 Lancement

### Développement

```bash
# Lancement simple
npm start

# Avec nodemon (redémarrage auto)
npm run dev
```

### Production

```bash
# Avec PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Ou directement
NODE_ENV=production node server.js
```

### Accès

- **Frontend public** : http://localhost:3000
- **Interface admin** : http://localhost:3000/admin
- **API** : http://localhost:3000/api

**Credentials admin par défaut** :
- Username : `admin`
- Password : `admin123`

⚠️ **Change ces identifiants en production !**

---

## 📁 Structure du projet

```
Portfolio-V4/
├── public/                      # Frontend
│   ├── admin/                   # Interface d'administration
│   │   ├── index.html          # Page admin
│   │   └── admin.js            # Logique admin
│   ├── assets/                  # Ressources statiques
│   │   ├── images/             # Images uploadées
│   │   ├── documents/          # PDFs, CV, etc.
│   │   ├── css/                # Styles
│   │   └── js/                 # Scripts
│   ├── index.html              # Page d'accueil
│   ├── script.js               # Logique frontend
│   └── style.css               # Styles globaux
│
├── controllers/                 # Controllers API
│   ├── admin.controller.js     # Admin & upload
│   ├── auth.controller.js      # Authentification
│   ├── blogs.controller.js     # Articles blog
│   ├── categories.controller.js # Catégories
│   ├── clients.controller.js   # Clients
│   ├── education.controller.js # Formation
│   ├── experience.controller.js # Expérience pro
│   ├── personalInfo.controller.js # Infos perso
│   ├── portfolio.controller.js # Projets portfolio
│   ├── projects.controller.js  # Autres projets
│   ├── skills.controller.js    # Compétences
│   └── testimonials.controller.js # Témoignages
│
├── middleware/                  # Middlewares
│   ├── auth.js                 # Vérification JWT
│   ├── rateLimiter.js          # Rate limiting
│   ├── recaptcha.js            # Validation reCAPTCHA
│   └── imageOptimizer.js       # Optimisation images
│
├── scripts/                     # Scripts utilitaires
│   ├── test-api.js             # Tests API complets
│   └── cleanup-images.js       # Nettoyage images
│
├── server.js                    # Point d'entrée serveur
├── mysql-db.js                 # Schéma BDD
├── package.json                # Dépendances
├── ecosystem.config.js         # Config PM2
└── README.md                   # Ce fichier
```

---

## 🛣️ Routes API

### 🔐 Authentification

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| POST | `/api/auth/login` | Connexion admin | ❌ |
| POST | `/api/auth/verify` | Vérifier token | ✅ |

**Exemple login** :
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### 👤 Informations Personnelles

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/personal-info` | Récupérer infos | ❌ |
| PUT | `/api/personal-info` | Mettre à jour | ✅ |

---

### 📦 Catégories

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/categories` | Liste toutes | ❌ |
| GET | `/api/categories/:id` | Une catégorie | ❌ |
| POST | `/api/categories` | Créer | ✅ |
| PUT | `/api/categories/:id` | Modifier | ✅ |
| DELETE | `/api/categories/:id` | Supprimer | ✅ |

**Exemple création** :
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"web-dev","displayName":"Développement Web"}'
```

---

### 💼 Projets Portfolio

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/portfolio-projects` | Liste tous | ❌ |
| GET | `/api/portfolio-projects/:id` | Un projet | ❌ |
| POST | `/api/portfolio-projects` | Créer | ✅ |
| PUT | `/api/portfolio-projects/:id` | Modifier | ✅ |
| DELETE | `/api/portfolio-projects/:id` | Supprimer | ✅ |

---

### 📁 Autres Projets

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/projects` | Liste tous | ❌ |
| GET | `/api/projects/:id` | Un projet | ❌ |
| POST | `/api/projects` | Créer | ✅ |
| PUT | `/api/projects/:id` | Modifier | ✅ |
| DELETE | `/api/projects/:id` | Supprimer | ✅ |

---

### ✍️ Blog

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/blogs` | Liste tous | ❌ |
| GET | `/api/blogs/:id` | Un article | ❌ |
| GET | `/api/blogs/slug/:slug` | Par slug | ❌ |
| POST | `/api/blogs` | Créer | ✅ |
| PUT | `/api/blogs/:id` | Modifier | ✅ |
| DELETE | `/api/blogs/:id` | Supprimer | ✅ |

---

### 💼 Expérience Professionnelle

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/experience` | Liste toutes | ❌ |
| GET | `/api/experience/:id` | Une expérience | ❌ |
| POST | `/api/experience` | Créer | ✅ |
| PUT | `/api/experience/:id` | Modifier | ✅ |
| DELETE | `/api/experience/:id` | Supprimer | ✅ |

---

### 🎓 Formation

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/education` | Liste toutes | ❌ |
| GET | `/api/education/:id` | Une formation | ❌ |
| POST | `/api/education` | Créer | ✅ |
| PUT | `/api/education/:id` | Modifier | ✅ |
| DELETE | `/api/education/:id` | Supprimer | ✅ |

---

### ⚡ Compétences

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/skills` | Liste toutes | ❌ |
| GET | `/api/skills/:id` | Une compétence | ❌ |
| POST | `/api/skills` | Créer | ✅ |
| PUT | `/api/skills/:id` | Modifier | ✅ |
| DELETE | `/api/skills/:id` | Supprimer | ✅ |

---

### 🤝 Clients

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/clients` | Liste tous | ❌ |
| GET | `/api/clients/:id` | Un client | ❌ |
| POST | `/api/clients` | Créer | ✅ |
| PUT | `/api/clients/:id` | Modifier | ✅ |
| DELETE | `/api/clients/:id` | Supprimer | ✅ |

---

### 💬 Témoignages

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/testimonials` | Liste tous | ❌ |
| GET | `/api/testimonials/:id` | Un témoignage | ❌ |
| POST | `/api/testimonials` | Créer | ✅ |
| PUT | `/api/testimonials/:id` | Modifier | ✅ |
| DELETE | `/api/testimonials/:id` | Supprimer | ✅ |

---

### 🔗 Liens Sociaux

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| GET | `/api/social-links` | Liste tous | ❌ |
| GET | `/api/social-links/:id` | Un lien | ❌ |
| POST | `/api/social-links` | Créer | ✅ |
| PUT | `/api/social-links/:id` | Modifier | ✅ |
| DELETE | `/api/social-links/:id` | Supprimer | ✅ |

---

### 📤 Upload & Admin

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| POST | `/api/admin/upload` | Upload image | ✅ |
| GET | `/api/admin/account-info` | Infos compte | ✅ |
| PUT | `/api/admin/account-info` | Modifier compte | ✅ |
| PUT | `/api/admin/change-password` | Changer mdp | ✅ |

**Exemple upload** :
```bash
curl -X POST http://localhost:3000/api/admin/upload \
  -H "Authorization: Bearer TON_TOKEN" \
  -F "image=@/chemin/vers/image.jpg"
```

---

### 🌐 SEO

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Page d'accueil |
| GET | `/blog/:slug` | Article de blog |
| GET | `/project/:id` | Projet spécifique |

---

## 🎮 Controllers

### 📄 admin.controller.js

**Responsabilités** :
- Upload et optimisation d'images (WebP)
- Gestion du compte admin
- Changement de mot de passe
- Informations du compte

**Fonctions principales** :
```javascript
exports.uploadImage      // Upload + optimisation WebP
exports.getAccountInfo   // Récupérer infos admin
exports.updateAccountInfo // Modifier infos admin
exports.changePassword   // Changer mot de passe
```

---

### 🔐 auth.controller.js

**Responsabilités** :
- Authentification des admins
- Génération de tokens JWT
- Vérification des tokens

**Fonctions principales** :
```javascript
exports.login    // Connexion admin
exports.verify   // Vérifier token JWT
```

**Sécurité** :
- Mots de passe hachés avec bcrypt
- Tokens JWT avec expiration
- Rate limiting sur les tentatives de connexion

---

### ✍️ blogs.controller.js

**Responsabilités** :
- CRUD complet des articles
- Génération automatique de slugs
- Gestion des images
- Pagination

**Fonctions principales** :
```javascript
exports.getAll       // Liste tous les articles
exports.getById      // Article par ID
exports.getBySlug    // Article par slug (SEO)
exports.create       // Créer un article
exports.update       // Modifier un article
exports.delete       // Supprimer un article
```

**Particularités** :
- Slugs auto-générés : "Mon Article" → "mon-article"
- Support images
- Ordre chronologique DESC

---

### 📦 categories.controller.js

**Responsabilités** :
- Gestion des catégories de projets
- Validation unicité des noms

**Fonctions principales** :
```javascript
exports.getAll    // Liste toutes
exports.getById   // Une catégorie
exports.create    // Créer
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### 🤝 clients.controller.js

**Responsabilités** :
- Gestion des clients/partenaires
- Gestion des logos

**Fonctions principales** :
```javascript
exports.getAll    // Liste tous
exports.create    // Créer
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### 🎓 education.controller.js

**Responsabilités** :
- Gestion du parcours académique

**Fonctions principales** :
```javascript
exports.getAll    // Liste toutes
exports.create    // Ajouter formation
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### 💼 experience.controller.js

**Responsabilités** :
- Gestion des expériences professionnelles

**Fonctions principales** :
```javascript
exports.getAll    // Liste toutes
exports.create    // Ajouter expérience
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### 👤 personalInfo.controller.js

**Responsabilités** :
- Informations personnelles du portfolio
- Avatar, CV, coordonnées

**Fonctions principales** :
```javascript
exports.get       // Récupérer infos
exports.update    // Mettre à jour
```

**Note** : Une seule entrée (ID = 1)

---

### 💼 portfolio.controller.js

**Responsabilités** :
- Projets principaux du portfolio
- Filtrage par catégorie

**Fonctions principales** :
```javascript
exports.getAll    // Tous les projets
exports.getById   // Un projet
exports.create    // Créer
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### 📁 projects.controller.js

**Responsabilités** :
- Autres projets (secondaires)

**Fonctions principales** :
```javascript
exports.getAll    // Liste tous
exports.create    // Créer
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### ⚡ skills.controller.js

**Responsabilités** :
- Compétences techniques
- Pourcentages de maîtrise

**Fonctions principales** :
```javascript
exports.getAll    // Liste toutes
exports.create    // Ajouter compétence
exports.update    // Modifier
exports.delete    // Supprimer
```

---

### 💬 testimonials.controller.js

**Responsabilités** :
- Témoignages clients
- Avatars

**Fonctions principales** :
```javascript
exports.getAll    // Liste tous
exports.create    // Ajouter témoignage
exports.update    // Modifier
exports.delete    // Supprimer
```

---

## 🛡️ Middlewares

### 🔐 auth.js

**Rôle** : Vérifier l'authentification JWT

```javascript
// Utilisation
router.post('/api/resource', authenticateToken, controller.create);
```

**Fonctionnement** :
1. Extrait le token du header `Authorization: Bearer TOKEN`
2. Vérifie la signature JWT
3. Attache l'utilisateur à `req.user`
4. Rejette si invalide/expiré

---

### ⏱️ rateLimiter.js

**Rôle** : Limiter le nombre de requêtes

**Limites** :
- **Login** : 5 tentatives / 15 min
- **Upload** : 10 requêtes / 15 min
- **API générale** : 100 requêtes / 15 min

```javascript
// Utilisation
router.post('/api/auth/login', loginLimiter, controller.login);
```

---

### 🤖 recaptcha.js

**Rôle** : Valider Google reCAPTCHA

```javascript
// Utilisation
router.post('/api/contact', verifyRecaptcha, controller.sendMessage);
```

**Configuration** : Nécessite `RECAPTCHA_SECRET_KEY` dans `.env`

---

### 🖼️ imageOptimizer.js

**Rôle** : Optimiser les images uploadées

**Fonctionnalités** :
- Conversion automatique en WebP
- Compression intelligente
- Redimensionnement si nécessaire
- Suppression des métadonnées EXIF

```javascript
// Automatique dans les routes d'upload
multer().single('image'), imageOptimizer, controller.upload
```

---

## 💾 Base de données

### Structure

**12 Tables principales** :

1. **personal_info** : Informations personnelles (1 seule entrée)
2. **categories** : Catégories de projets
3. **portfolio_projects** : Projets principaux du portfolio
4. **projects** : Autres projets
5. **blogs** : Articles de blog
6. **experience** : Expériences professionnelles
7. **education** : Formations académiques
8. **skills** : Compétences techniques
9. **clients** : Clients/Partenaires
10. **testimonials** : Témoignages
11. **social_links** : Liens réseaux sociaux
12. **admin_users** : Comptes administrateurs

### Schéma complet

Voir le fichier `mysql-db.js` pour le schéma détaillé avec :
- Types de colonnes
- Contraintes
- Index
- Relations

---

## 🚀 Déploiement

### Sur serveur VPS (avec PM2)

```bash
# 1. Cloner le projet
git clone https://github.com/Fullann/Portfolio-V4.git
cd Portfolio-V4

# 2. Installer les dépendances
npm install --production

# 3. Configurer l'environnement
cp .env.example .env
nano .env

# 4. Importer la BDD
mysql -u root -p portfolio_db < mysql-db.sql

# 5. Démarrer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Sur O2Switch (hébergement mutualisé)

**Prérequis** :
- Node.js v18 activé via cPanel
- CloudLinux Passenger configuré

**Configuration** :

1. **Uploader les fichiers** via FTP/SSH
2. **Configurer via cPanel** → Setup Node.js App
   - Version : 18.x
   - Root : `repositories/Portfolio-V4`
   - Startup file : `server.js`
3. **Variables d'environnement** :
   ```
   NODE_ENV=production
   NODE_OPTIONS=--max-old-space-size=512
   ```
4. **`.htaccess` dans `public_html/`** :
   ```apache
   PassengerAppRoot "/home/user/repositories/Portfolio-V4"
   PassengerNodejs "/home/user/nodevenv/.../18/bin/node"
   PassengerStartupFile server.js
   PassengerEnabled on
   ```
5. **Redémarrer** :
   ```bash
   touch ~/repositories/Portfolio-V4/tmp/restart.txt
   ```

---

## 🧰 Scripts utiles

### Test API complet

```bash
node scripts/test-api.js
```

**Teste automatiquement** :
- Authentification
- CRUD sur toutes les routes
- Création/modification/suppression
- Nettoyage des données de test

---

### Nettoyage des images non utilisées

```bash
# Simulation (dry run)
node scripts/cleanup-images.js

# Suppression réelle
node scripts/cleanup-images.js --delete --force
```

**Fonctionnalités** :
- Scan des dossiers d'images
- Vérification dans la BDD
- Protection des fichiers système
- Rapport détaillé avec taille libérée

---

## 🐛 Troubleshooting

### Problème : "Cannot allocate Wasm memory"

**Cause** : Node.js v22 avec hébergement mutualisé

**Solution** :
```bash
# Utiliser Node.js v18
nvm use 18

# Ou ajouter des options
NODE_OPTIONS='--no-experimental-fetch --max-old-space-size=512' node server.js
```

---

### Problème : "ECONNREFUSED" MySQL

**Cause** : Base de données non démarrée ou mauvais credentials

**Solution** :
```bash
# Vérifier MySQL
sudo systemctl status mysql

# Tester la connexion
mysql -u root -p

# Vérifier les credentials dans .env
```

---

### Problème : Routes 404 en production

**Cause** : `.htaccess` mal configuré

**Solution** :
```apache
# Dans public_html/.htaccess
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

---

### Problème : JWT invalide

**Cause** : Token expiré ou secret différent

**Solution** :
- Reconnecter via `/admin`
- Vérifier que `JWT_SECRET` est identique partout
- Token valide 24h par défaut

---

### Problème : Upload images échoue

**Cause** : Permissions ou dossier inexistant

**Solution** :
```bash
# Créer les dossiers
mkdir -p public/assets/images
mkdir -p public/assets/documents

# Permissions
chmod 755 public/assets/images
chmod 755 public/assets/documents
```

---

## 📄 License

MIT License - Libre d'utilisation et modification

---

## 👤 Auteur

**Nathan Füllemann**
- Email : nathan@fullann.ch
- GitHub : [@Fullann](https://github.com/Fullann)
- Website : [fullann.ch](https://fullann.ch)

---

## 🙏 Remerciements

- Express.js
- MySQL2
- Sharp (optimisation images)
- Multer (upload fichiers)
- JWT
- bcrypt

---

**Dernière mise à jour** : Février 2026
```

***

## 📝 **Fichier supplémentaire : INSTALLATION.md**

Pour un guide d'installation encore plus détaillé :

```markdown
# 📦 Guide d'installation détaillé

## Installation locale (développement)

### 1. Prérequis

Vérifie que tu as installé :

```bash
node --version  # v18.x minimum
npm --version   # v8.x minimum
mysql --version # v5.7 minimum
```

### 2. Clone et installe

```bash
git clone https://github.com/Fullann/Portfolio-V4.git
cd Portfolio-V4
npm install
```

### 3. Configure MySQL

```bash
# Connexion MySQL
mysql -u root -p

# Commandes SQL
CREATE DATABASE portfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_db;
SOURCE mysql-db.sql;

# Quitter
EXIT;
```

### 4. Configure l'environnement

```bash
# Copie le template
cp .env.example .env

# Édite avec tes valeurs
nano .env
```

### 5. Lance l'application

```bash
npm start
```

### 6. Accède à l'application

- Frontend : http://localhost:3000
- Admin : http://localhost:3000/admin
- Login : `admin` / `admin123`

---

## Installation production (VPS)

### Avec PM2

```bash
# Installation globale PM2
npm install -g pm2

# Lance l'app
pm2 start ecosystem.config.js

# Auto-start au boot
pm2 startup
pm2 save
```

### Avec Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name fullann.ch;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```