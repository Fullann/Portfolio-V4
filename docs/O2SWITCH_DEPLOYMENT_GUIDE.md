# Guide de Déploiement en Production sur o2switch (Node.js & cPanel)

Ce guide détaille la mise en production du **Portfolio V4** sur l'hébergement **o2switch** (CloudLinux / cPanel / Phusion Passenger / MySQL).

---

## 📋 Prérequis o2switch
- Un compte d'hébergement o2switch actif avec accès à cPanel.
- Un nom de domaine ou sous-domaine configuré (avec certificat SSL Let's Encrypt actif).
- Accès à l'outil **"Setup Node.js App"** dans cPanel.

---

## 🛠️ Étape 1 : Créer la Base de Données MySQL

Sur o2switch, les noms de base et d'utilisateur sont obligatoirement préfixés par votre identifiant cPanel (ex: `identifiant_`).

1. Connectez-vous à votre **cPanel**.
2. Rendez-vous dans **Bases de données MySQL**.
3. **Créer une nouvelle base** :
   - Nom : `identifiant_portfolio`
   - Cliquez sur **Créer une base de données**.
4. **Créer un utilisateur MySQL** :
   - Nom d'utilisateur : `identifiant_portuser`
   - Mot de passe : *générez un mot de passe robuste et notez-le*.
   - Cliquez sur **Créer un utilisateur**.
5. **Associer l'utilisateur à la base** :
   - Sélectionnez l'utilisateur et la base créés.
   - Cochez **Tous les privilèges** (ALL PRIVILEGES).
   - Cliquez sur **Apporter des modifications**.

> [!NOTE]
> La structure des tables, les migrations et les données initiales sont **automatiquement créées** par le serveur au premier démarrage (`config/initDb.js`). Aucune importation SQL manuelle n'est requise.

---

## ⚙️ Étape 2 : Configurer l'Application dans cPanel

1. Dans cPanel, cliquez sur **Setup Node.js App** (ou *Configurer une application Node.js*).
2. Cliquez sur **Create Application** :
   - **Node.js version** : Sélectionnez **Node.js 20.x** ou supérieure.
   - **Application mode** : **Production**.
   - **Application root** : Le chemin relatif de votre application (ex: `portfolio` ou `sites/portfolio`).
   - **Application URL** : Choisissez votre domaine ou sous-domaine (ex: `portfolio.votre-domaine.ch` ou racine `/`).
   - **Application startup file** : Indiquez impérativement `server.js`.
3. Cliquez sur le bouton **Create** en haut à droite.

---

## 🔐 Étape 3 : Fichier d'Environnement de Production (`.env`)

Dans le dossier racine de votre application (`/home/identifiant/portfolio/`), créez un fichier `.env` via le **Gestionnaire de fichiers cPanel** ou en SSH :

```env
# Mode & Port (Le port dynamique est géré automatiquement par Passenger)
NODE_ENV=production
PORT=3000

# Clé secrète JWT (Obligatoire : minimum 32 à 64 caractères aléatoires)
JWT_SECRET=votre_cle_jwt_tres_longue_et_securisee_aleatoire_64_chars

# Base de données o2switch (localhost car MySQL est local au serveur)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=identifiant_portfolio
DB_USER=identifiant_portuser
DB_PASSWORD=votre_mot_de_passe_mysql_o2switch

# URL du site (indispensable pour les balises SEO et le sitemap)
BASE_URL=https://votre-domaine.ch
CORS_ORIGIN=https://votre-domaine.ch

# Email de contact (utilise le serveur mail o2switch)
EMAIL_USER=contact@votre-domaine.ch
EMAIL_PASS=votre_mot_de_passe_boite_mail

# Connexion Admin Nextcloud (si configurée)
NEXTCLOUD_URL=https://votre-nextcloud.com
NEXTCLOUD_CLIENT_ID=votre_client_id
NEXTCLOUD_CLIENT_SECRET=votre_client_secret
NEXTCLOUD_ADMIN_USER=votre_identifiant_nextcloud

# Sécurité formulaire de contact (hCaptcha)
HCAPTCHA_SECRET=votre_cle_secrete_hcaptcha
```

> [!CAUTION]
> Ne committez JAMAIS le fichier `.env` sur Git. Il est strictement exclu par le fichier `.gitignore`.

---

## 📦 Étape 4 : Déploiement des Fichiers & Dépendances

### Option A : Déploiement Automatique via GitHub Actions (Recommandé)
Le projet dispose déjà du workflow `.github/workflows/deploy.yml`.
Configurez simplement les 4 secrets dans votre dépôt GitHub (**Settings > Secrets and variables > Actions**) :
- `SFTP_HOST` : L'hôte FTP d'o2switch (ex: `ftp.votre-domaine.ch` ou l'IP du serveur).
- `SFTP_USER` : Votre compte FTP o2switch.
- `SFTP_PASSWORD` : Votre mot de passe FTP.
- `SFTP_PORT` : `21` (ou port SFTP `22`).

À chaque push sur la branche `main`, le code est synchronisé sans écraser votre `.env` ni vos uploads !

### Option B : Installation des Dépendances
Dans cPanel > **Setup Node.js App** :
- Cliquez sur votre application.
- Cliquez sur le bouton **Run NPM Install**.

*Ou en SSH (si activé dans cPanel > Accès SSH) :*
```bash
# Activer l'environnement virtuel Node.js fourni par o2switch
source /home/identifiant/nodevenv/portfolio/20/bin/activate
cd /home/identifiant/portfolio
npm install --omit=dev
```

---

## 🔄 Étape 5 : Redémarrage Automatique (Phusion Passenger)

Sur o2switch, le serveur d'application est Phusion Passenger.
Pour appliquer des modifications sans redémarrer le serveur physique :

1. **Depuis cPanel** : Cliquez sur le bouton **Restart** dans l'interface de l'application Node.js.
2. **Ou via le fichier déclencheur** :
   ```bash
   mkdir -p tmp && touch tmp/restart.txt
   ```
   Dès que `tmp/restart.txt` est modifié, Passenger redémarre l'application à la prochaine requête utilisateur.

---

## 🛠️ Étape 6 : Tester & Réparer Automatiquement la Base de Données

Un script dédié d'audit et de réparation automatique est fourni avec le projet.
Il teste la connexion MySQL, inspecte les 18 tables et toutes les colonnes, et **crée automatiquement les tables et champs manquants** (via `ALTER TABLE`) sans toucher à vos données existantes.

Lancez-le en SSH sur votre serveur o2switch :
```bash
# Dans le dossier de l'application
npm run db:check
```

Ce script vérifie notamment :
- Les colonnes récentes (`technologies`, `category`, `icon`, `display_order`...).
- La table d'analytique `analytics_events` et ses index uniques.
- Les paramètres système (`availability_status`, `availability_text`, `github_username`, etc.).
- L'intégrité de la table `personal_info` et des langues.

---

## 🔍 Checklist de Vérification Pré-Mise en Production

- [x] **Pipeline DevSecOps** configuré avec SAST (Semgrep OWASP Top 10), Secret Scanning (Gitleaks, TruffleHog) et SCA (`npm audit`).
- [x] **Script de vérification DB** : `npm run db:check` pour auditer et auto-réparer le schéma en production.
- [x] **Dossiers de téléversement** (`public/assets/images`, `public/assets/documents`) configurés avec création récursive automatique dans `config/multer.js`.
- [x] **Variables d'environnement** : `process.env.JWT_SECRET` défini sans fallback faible en mémoire.
- [x] **Port Passenger** : `server.js` écoute sur `process.env.PORT || 3000` (100% compatible reverse proxy Passenger).
- [x] **Headers de sécurité** : Helmet activé avec CSP autorisant les polices Google, icônes Ionic, et formulaires hCaptcha.
- [x] **Limiteurs de débit** : `express-rate-limit` avec `app.set('trust proxy', 1)` pour éviter les blocages intempestifs derrière Apache.
