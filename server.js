require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { marked } = require("marked");
const { dbOperations, initializeDatabase } = require("./mysql-db");
const compression = require("compression");
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-jwt-tres-securise";

let lastUpdate = Date.now();

// Configuration du stockage pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cv") {
      cb(null, "public/assets/documents/");
    } else {
      cb(null, "public/assets/images/");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    if (file.fieldname === "cv") {
      cb(null, "cv-" + uniqueSuffix + ".pdf");
    } else {
      // Ne pas ajouter l'extension ici, elle sera ajoutée après optimisation
      cb(null, file.fieldname + "-" + uniqueSuffix);
    }
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "cv") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Seuls les fichiers PDF sont acceptés pour le CV"));
      }
    } else {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Seules les images sont acceptées"));
      }
    }
  },
});


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/admin", express.static("admin"));
app.use(compression());
// Headers de cache pour les ressources statiques
app.use(
  "/assets",
  express.static(path.join(__dirname, "public/assets"), {
    maxAge: "30d", // 30 jours de cache
    etag: true,
    setHeaders: (res, path) => {
      if (path.endsWith(".css") || path.endsWith(".js")) {
        res.setHeader("Cache-Control", "public, max-age=2592000"); // 30 jours
      }
      if (
        path.endsWith(".jpg") ||
        path.endsWith(".png") ||
        path.endsWith(".webp")
      ) {
        res.setHeader("Cache-Control", "public, max-age=7776000"); // 90 jours
      }
    },
  })
);
// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Créer l'utilisateur admin au démarrage
async function createAdminUser() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Vérifier si l'utilisateur admin existe déjà
    const existingAdmin = await dbOperations.admin.getByUsername(adminUsername);

    if (!existingAdmin) {
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Créer l'utilisateur admin
      await dbOperations.admin.create({
        username: adminUsername,
        password: hashedPassword,
      });

      console.log(`✅ Utilisateur admin créé: ${adminUsername}`);
    } else {
      console.log(`ℹ️ Utilisateur admin existe déjà: ${adminUsername}`);
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création de l'utilisateur admin:",
      error
    );
  }
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Fonctions utilitaires pour formater les données
function formatPersonalInfo(dbData) {
  if (!dbData) return null;

  let aboutText = [];
  try {
    // Essayer de parser le JSON
    aboutText = JSON.parse(dbData.about_text || "[]");
  } catch (error) {
    // Si ce n'est pas du JSON valide, traiter comme du texte simple
    if (dbData.about_text && typeof dbData.about_text === "string") {
      // Diviser par paragraphes ou garder comme un seul élément
      aboutText = [dbData.about_text];
    } else {
      aboutText = [];
    }
  }

  return {
    name: dbData.name,
    title: dbData.title,
    email: dbData.email,
    phone: dbData.phone,
    birthday: dbData.birthday,
    location: dbData.location,
    avatar: dbData.avatar,
    cvFile: dbData.cv_file,
    aboutText: aboutText,
  };
}

// Fonction d'optimisation automatique des images
async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const {
      width = 1920,
      height = 1080,
      quality = 80,
      format = 'webp'
    } = options;

    let sharpInstance = sharp(inputPath);
    
    // Redimensionner si nécessaire (en gardant les proportions)
    sharpInstance = sharpInstance.resize(width, height, { 
      fit: 'inside', 
      withoutEnlargement: true 
    });
    
    // Optimiser selon le format
    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: Math.round(quality / 10) });
    }
    
    await sharpInstance.toFile(outputPath);
    
    // Obtenir les statistiques
    const originalStats = require('fs').statSync(inputPath);
    const optimizedStats = require('fs').statSync(outputPath);
    
    const originalSize = (originalStats.size / 1024).toFixed(2);
    const optimizedSize = (optimizedStats.size / 1024).toFixed(2);
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Image optimisée: ${path.basename(inputPath)} -> ${path.basename(outputPath)} (${originalSize}KB -> ${optimizedSize}KB, -${savings}%)`);
    
    return {
      success: true,
      originalSize,
      optimizedSize,
      savings,
      outputPath
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
    return { success: false, error: error.message };
  }
}

// Middleware d'optimisation pour multer
const optimizeUploadedImage = async (req, res, next) => {
  if (!req.file || req.file.fieldname === 'cv') {
    return next(); // Passer si pas d'image ou si c'est un CV
  }
  
  try {
    const originalPath = req.file.path;
    const fileName = path.parse(req.file.filename).name;
    const outputPath = path.join(req.file.destination, `${fileName}.webp`);
    
    // Déterminer les dimensions selon le type de contenu
    let optimizationOptions = { format: 'webp', quality: 85 };
    
    if (req.file.fieldname === 'image' || req.file.fieldname === 'logo') {
      // Images de projet/logo : dimensions moyennes
      optimizationOptions = { 
        ...optimizationOptions, 
        width: 800, 
        height: 600 
      };
    } else if (req.file.fieldname === 'avatar') {
      // Avatars : petites dimensions
      optimizationOptions = { 
        ...optimizationOptions, 
        width: 200, 
        height: 200 
      };
    }
    
    const result = await optimizeImage(originalPath, outputPath, optimizationOptions);
    
    if (result.success) {
      // Supprimer l'original et mettre à jour les informations du fichier
      require('fs').unlinkSync(originalPath);
      
      req.file.path = outputPath;
      req.file.filename = `${fileName}.webp`;
      req.file.optimized = true;
      req.file.optimizationStats = {
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savings: result.savings
      };
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de l\'upload:', error);
    next(); // Continuer même en cas d'erreur d'optimisation
  }
};

async function formatPortfolioProject(dbData) {
  let category = null;

  // Vérifier que filter_category n'est pas undefined/null
  if (dbData.filter_category && dbData.filter_category.trim()) {
    try {
      category = await dbOperations.categories.getByName(
        dbData.filter_category
      );
    } catch (error) {
      console.error("Erreur lors de la récupération de la catégorie:", error);
    }
  }

  return {
    id: dbData.id,
    title: dbData.title,
    category: category
      ? category.display_name
      : dbData.category || "Non définie",
    image: dbData.image,
    description: dbData.description,
    repoLink: dbData.repo_link,
    liveLink: dbData.live_link,
    filterCategory: dbData.filter_category || null,
  };
}

// Routes d'authentification
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await dbOperations.admin.getByUsername(username);

    if (admin && (await bcrypt.compare(password, admin.password))) {
      const token = jwt.sign(
        { username: admin.username, id: admin.id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      res.json({ token, message: "Connexion réussie" });
    } else {
      res.status(401).json({ error: "Identifiants invalides" });
    }
  } catch (error) {
    console.error("Erreur lors de l'authentification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour envoyer un email
app.post("/api/send-email", async (req, res) => {
  try {
    const { fullname, email, message } = req.body;

    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `Nouveau message de ${fullname}`,
      html: `
                <h3>Nouveau message de contact</h3>
                <p><strong>Nom:</strong> ${fullname}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email envoyé avec succès!" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
  }
});

// Routes pour les projets (services)
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await dbOperations.projects.getAll();
    res.json(projects);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des projets" });
  }
});

app.post(
  "/api/projects",
  authenticateToken,
  upload.single("image"),
  optimizeUploadedImage, 
  async (req, res) => {
    try {
      const { title, category, description } = req.body;
      const image = req.file ? `/assets/images/${req.file.filename}` : null;
      
      // Log des statistiques d'optimisation
      if (req.file && req.file.optimized) {
        console.log(`📊 Optimisation: ${req.file.optimizationStats.savings}% d'économie`);
      }
      
      lastUpdate = Date.now();
      
      const newProject = await dbOperations.projects.create({
        title,
        category,
        image,
        description,
      });
      
      await updateHtmlFile();
      res.json(newProject);
    } catch (error) {
      console.error("Erreur:", error);
      res.status(500).json({ error: "Erreur lors de la création du projet" });
    }
  }
);

app.put(
  "/api/projects/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, category, description } = req.body;

      lastUpdate = Date.now();

      const updateData = { title, category, description };
      if (req.file) {
        updateData.image = `/assets/images/${req.file.filename}`;
      }

      const updatedProject = await dbOperations.projects.update(id, updateData);
      if (!updatedProject) {
        return res.status(404).json({ error: "Projet non trouvé" });
      }

      await updateHtmlFile();
      res.json(updatedProject);
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du projet" });
    }
  }
);

app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.projects.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du projet" });
  }
});

// Routes pour les témoignages
app.get("/api/testimonials", async (req, res) => {
  try {
    const testimonials = await dbOperations.testimonials.getAll();
    res.json(testimonials);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des témoignages" });
  }
});

app.post(
  "/api/testimonials",
  authenticateToken,
  upload.single("avatar"),
  optimizeUploadedImage,
  async (req, res) => {
    try {
      const { name, text, date } = req.body;
      const avatar = req.file
        ? `/assets/images/${req.file.filename}`
        : "/assets/images/avatar-default.png";

      lastUpdate = Date.now();

      const newTestimonial = await dbOperations.testimonials.create({
        name,
        text,
        avatar,
        date: date || new Date().toISOString().split("T")[0],
      });

      await updateHtmlFile();
      res.json(newTestimonial);
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la création du témoignage" });
    }
  }
);

app.put(
  "/api/testimonials/:id",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, text, date } = req.body;

      lastUpdate = Date.now();

      const updateData = { name, text, date };
      if (req.file) {
        updateData.avatar = `/assets/images/${req.file.filename}`;
      }

      const updatedTestimonial = await dbOperations.testimonials.update(
        id,
        updateData
      );
      if (!updatedTestimonial) {
        return res.status(404).json({ error: "Témoignage non trouvé" });
      }

      await updateHtmlFile();
      res.json(updatedTestimonial);
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du témoignage" });
    }
  }
);

app.delete("/api/testimonials/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.testimonials.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du témoignage" });
  }
});

// Routes pour les projets portfolio
app.get("/api/portfolio-projects", async (req, res) => {
  try {
    const projects = await dbOperations.portfolioProjects.getAll();
    const formattedProjects = await Promise.all(
      projects.map(formatPortfolioProject)
    );
    res.json(formattedProjects);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des projets portfolio" });
  }
});

app.post(
  "/api/portfolio-projects",
  authenticateToken,
  upload.single("image"),
  optimizeUploadedImage,
  async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        repoLink,
        liveLink,
        filterCategory,
      } = req.body;
      const image = req.file ? `/assets/images/${req.file.filename}` : null;

      lastUpdate = Date.now();

      const newProject = await dbOperations.portfolioProjects.create({
        title,
        category,
        image,
        description,
        repoLink: repoLink || "",
        liveLink: liveLink || "",
        filterCategory: filterCategory || category,
      });

      await updateHtmlFile();
      res.json(await formatPortfolioProject(newProject));
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la création du projet portfolio" });
    }
  }
);

app.put(
  "/api/portfolio-projects/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        category,
        description,
        repoLink,
        liveLink,
        filterCategory,
      } = req.body;

      lastUpdate = Date.now();

      const updateData = {
        title,
        category,
        description,
        repoLink,
        liveLink,
        filterCategory,
      };
      if (req.file) {
        updateData.image = `/assets/images/${req.file.filename}`;
      }

      const updatedProject = await dbOperations.portfolioProjects.update(
        id,
        updateData
      );
      if (!updatedProject) {
        return res.status(404).json({ error: "Projet portfolio non trouvé" });
      }

      await updateHtmlFile();
      res.json(await formatPortfolioProject(updatedProject));
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du projet portfolio" });
    }
  }
);

app.delete(
  "/api/portfolio-projects/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      lastUpdate = Date.now();

      await dbOperations.portfolioProjects.delete(id);
      await updateHtmlFile();
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du projet portfolio" });
    }
  }
);

// Routes pour les clients
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await dbOperations.clients.getAll();
    res.json(clients);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des clients" });
  }
});

app.post(
  "/api/clients",
  authenticateToken,
  upload.single("logo"),
  optimizeUploadedImage,
  async (req, res) => {
    try {
      const { name, website, description } = req.body;
      const logo = req.file ? `/assets/images/${req.file.filename}` : null;

      lastUpdate = Date.now();

      const newClient = await dbOperations.clients.create({
        name,
        logo,
        website: website || "",
        description: description || "",
      });

      await updateHtmlFile();
      res.json(newClient);
    } catch (error) {
      console.error("Erreur:", error);
      res.status(500).json({ error: "Erreur lors de la création du client" });
    }
  }
);

app.put(
  "/api/clients/:id",
  authenticateToken,
  upload.single("logo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, website, description } = req.body;

      lastUpdate = Date.now();

      const updateData = { name, website, description };
      if (req.file) {
        updateData.logo = `/assets/images/${req.file.filename}`;
      }

      const updatedClient = await dbOperations.clients.update(id, updateData);
      if (!updatedClient) {
        return res.status(404).json({ error: "Client non trouvé" });
      }

      await updateHtmlFile();
      res.json(updatedClient);
    } catch (error) {
      console.error("Erreur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du client" });
    }
  }
);

app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.clients.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du client" });
  }
});

// Routes pour les catégories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await dbOperations.categories.getAll();
    res.json(categories);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des catégories" });
  }
});

app.post("/api/categories", authenticateToken, async (req, res) => {
  try {
    const { name, displayName } = req.body;

    const existingCategory = await dbOperations.categories.getByName(
      name.toLowerCase()
    );
    if (existingCategory) {
      return res.status(400).json({ error: "Cette catégorie existe déjà" });
    }

    lastUpdate = Date.now();

    const newCategory = await dbOperations.categories.create({
      name: name.toLowerCase().replace(/\s+/g, " ").trim(),
      displayName: displayName || name,
    });

    await updateHtmlFile();
    res.json(newCategory);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la catégorie" });
  }
});

app.put("/api/categories/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName } = req.body;

    lastUpdate = Date.now();

    const category = await dbOperations.categories.getById(id);
    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    const oldName = category.name;
    const newName = name
      ? name.toLowerCase().replace(/\s+/g, " ").trim()
      : category.name;
    const newDisplayName = displayName || category.display_name;

    const updatedCategory = await dbOperations.categories.update(id, {
      name: newName,
      displayName: newDisplayName,
    });

    // Mettre à jour les références dans les projets portfolio
    if (oldName !== newName) {
      await dbOperations.portfolioProjects.updateCategoryReferences(
        oldName,
        newName,
        newDisplayName
      );
    }

    await updateHtmlFile();
    res.json(updatedCategory);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la catégorie" });
  }
});

app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await dbOperations.categories.getById(id);
    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    // Vérifier si des projets utilisent cette catégorie
    const projectsUsingCategory = (
      await dbOperations.portfolioProjects.getAll()
    ).filter((p) => p.filter_category === category.name);

    if (projectsUsingCategory.length > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer cette catégorie. ${projectsUsingCategory.length} projet(s) l'utilisent encore.`,
        projects: projectsUsingCategory.map((p) => p.title),
      });
    }

    lastUpdate = Date.now();
    await dbOperations.categories.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la catégorie" });
  }
});

// Routes pour les blogs
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await dbOperations.blogs.getAll();
    res.json(blogs);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des blogs" });
  }
});

app.get("/api/blogs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await dbOperations.blogs.getBySlug(slug);

    if (!blog) {
      return res.status(404).json({ error: "Blog non trouvé" });
    }

    const blogWithHtml = {
      ...blog,
      contentHtml: marked(blog.content),
    };

    res.json(blogWithHtml);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du blog" });
  }
});

app.post(
  "/api/blogs",
  authenticateToken,
  upload.single("image"),
  optimizeUploadedImage,
  async (req, res) => {
    try {
      const { title, category, excerpt, content, author } = req.body;
      const image = req.file ? `/assets/images/${req.file.filename}` : null;

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      lastUpdate = Date.now();

      const newBlog = await dbOperations.blogs.create({
        title,
        category,
        excerpt,
        content,
        image,
        date: new Date().toISOString().split("T")[0],
        author: author || "Admin",
        slug,
      });

      await updateHtmlFile();
      res.json(newBlog);
    } catch (error) {
      console.error("Erreur:", error);
      res.status(500).json({ error: "Erreur lors de la création du blog" });
    }
  }
);

app.put(
  "/api/blogs/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, category, excerpt, content, author } = req.body;

      lastUpdate = Date.now();

      const updateData = { title, category, excerpt, content, author };

      if (title) {
        updateData.slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }

      if (req.file) {
        updateData.image = `/assets/images/${req.file.filename}`;
      }

      const updatedBlog = await dbOperations.blogs.update(id, updateData);
      if (!updatedBlog) {
        return res.status(404).json({ error: "Blog non trouvé" });
      }

      await updateHtmlFile();
      res.json(updatedBlog);
    } catch (error) {
      console.error("Erreur:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du blog" });
    }
  }
);

app.delete("/api/blogs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.blogs.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du blog" });
  }
});

// Route pour afficher un blog complet
app.get("/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await dbOperations.blogs.getBySlug(slug);

    if (!blog) {
      return res.status(404).send("Blog non trouvé");
    }

    const contentHtml = marked(blog.content);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    const blogPageHtml = `
               <!DOCTYPE html>
        <html lang="fr">
        <head>
            ${metaTags}
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/assets/css/style.css">
            <style>
                .blog-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .back-link {
                    color: var(--orange-yellow-crayola);
                    text-decoration: none;
                    margin-bottom: 20px;
                    display: inline-block;
                }
                .blog-header {
                    margin-bottom: 30px;
                }
                .blog-title {
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                }
                .blog-meta {
                    color: var(--light-gray-70);
                    margin-bottom: 20px;
                }
                .blog-image {
                    width: 100%;
                    height: 400px;
                    object-fit: cover;
                    border-radius: 15px;
                    margin-bottom: 30px;
                }
                .blog-content {
                    line-height: 1.8;
                    font-size: 1.1rem;
                }
            </style>
        </head>
        <body>
            <div class="blog-container">
                <a href="/" class="back-link">← Retour au portfolio</a>
                <article class="blog-header">
                    <h1 class="blog-title">${blog.title}</h1>
                    <div class="blog-meta">
                        Par ${blog.author} • ${blog.date} • ${blog.category}
                    </div>
                    ${
                      blog.image
                        ? `<img src="${blog.image}" alt="${blog.title}" class="blog-image">`
                        : ""
                    }
                </article>
                <div class="blog-content">
                    ${contentHtml}
                </div>
            </div>
        </body>
        </html>
    `;

    res.send(blogPageHtml);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur lors de l'affichage du blog");
  }
});

// Routes pour les informations personnelles
app.get("/api/personal-info", async (req, res) => {
  try {
    const personalInfo = await dbOperations.personalInfo.get();
    res.json(formatPersonalInfo(personalInfo));
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des informations personnelles",
    });
  }
});

app.put(
  "/api/personal-info",
  authenticateToken,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, title, email, phone, birthday, location, aboutText } =
        req.body;

      lastUpdate = Date.now();

      const updateData = { name, title, email, phone, birthday, location };

      if (aboutText) {
        updateData.aboutText = aboutText;
      }

      if (req.files?.avatar) {
        updateData.avatar = `/assets/images/${req.files.avatar[0].filename}`;
      }
      if (req.files?.cv) {
        updateData.cvFile = `/assets/documents/${req.files.cv[0].filename}`;
      }

      const updatedInfo = await dbOperations.personalInfo.update(updateData);
      await updateHtmlFile();
      res.json(formatPersonalInfo(updatedInfo));
    } catch (error) {
      console.error("Erreur:", error);
      res.status(500).json({
        error: "Erreur lors de la mise à jour des informations personnelles",
      });
    }
  }
);
app.use("/assets/documents", express.static("public/assets/documents"));

// Route pour télécharger le CV
app.get("/download-cv", (req, res) => {
  try {
    const personalInfo = dbOperations.personalInfo.get();
    if (personalInfo && personalInfo.cv_file) {
      const filePath = path.join(__dirname, "public", personalInfo.cv_file);
      res.download(filePath, "CV.pdf");
    } else {
      res.status(404).json({ error: "CV non trouvé" });
    }
  } catch (error) {
    console.error("Erreur téléchargement CV:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Routes pour les liens sociaux
app.get("/api/social-links", async (req, res) => {
  try {
    const socialLinks = await dbOperations.socialLinks.getAll();
    res.json(socialLinks);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des liens sociaux" });
  }
});

app.post("/api/social-links", authenticateToken, async (req, res) => {
  try {
    const { name, icon, url } = req.body;
    lastUpdate = Date.now();

    const newSocialLink = await dbOperations.socialLinks.create({
      name,
      icon,
      url,
    });

    await updateHtmlFile();
    res.json(newSocialLink);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création du lien social" });
  }
});

app.put("/api/social-links/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, url } = req.body;
    lastUpdate = Date.now();

    const updatedSocialLink = await dbOperations.socialLinks.update(id, {
      name,
      icon,
      url,
    });

    if (!updatedSocialLink) {
      return res.status(404).json({ error: "Lien social non trouvé" });
    }

    await updateHtmlFile();
    res.json(updatedSocialLink);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du lien social" });
  }
});

app.delete("/api/social-links/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.socialLinks.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du lien social" });
  }
});

// Routes pour l'éducation
app.get("/api/education", async (req, res) => {
  try {
    const education = await dbOperations.education.getAll();
    res.json(education);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'éducation" });
  }
});

app.post("/api/education", authenticateToken, async (req, res) => {
  try {
    const { institution, period, description } = req.body;
    lastUpdate = Date.now();

    const newEducation = await dbOperations.education.create({
      institution,
      period,
      description,
    });

    await updateHtmlFile();
    res.json(newEducation);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'éducation" });
  }
});

app.put("/api/education/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { institution, period, description } = req.body;
    lastUpdate = Date.now();

    const updatedEducation = await dbOperations.education.update(id, {
      institution,
      period,
      description,
    });

    if (!updatedEducation) {
      return res.status(404).json({ error: "Éducation non trouvée" });
    }

    await updateHtmlFile();
    res.json(updatedEducation);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'éducation" });
  }
});

app.delete("/api/education/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.education.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'éducation" });
  }
});

// Routes pour l'expérience
app.get("/api/experience", async (req, res) => {
  try {
    const experience = await dbOperations.experience.getAll();
    res.json(experience);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'expérience" });
  }
});

app.post("/api/experience", authenticateToken, async (req, res) => {
  try {
    const { position, period, description } = req.body;
    lastUpdate = Date.now();

    const newExperience = await dbOperations.experience.create({
      position,
      period,
      description,
    });

    await updateHtmlFile();
    res.json(newExperience);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'expérience" });
  }
});

app.put("/api/experience/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { position, period, description } = req.body;
    lastUpdate = Date.now();

    const updatedExperience = await dbOperations.experience.update(id, {
      position,
      period,
      description,
    });

    if (!updatedExperience) {
      return res.status(404).json({ error: "Expérience non trouvée" });
    }

    await updateHtmlFile();
    res.json(updatedExperience);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'expérience" });
  }
});

app.delete("/api/experience/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.experience.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'expérience" });
  }
});

// Routes pour les compétences
app.get("/api/skills", async (req, res) => {
  try {
    const skills = await dbOperations.skills.getAll();
    res.json(skills);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des compétences" });
  }
});

app.post("/api/skills", authenticateToken, async (req, res) => {
  try {
    const { name, percentage } = req.body;
    if (percentage < 0 || percentage > 100) {
      return res
        .status(400)
        .json({ error: "Le pourcentage doit être entre 0 et 100" });
    }
    lastUpdate = Date.now();

    const newSkill = await dbOperations.skills.create({
      name,
      percentage: parseInt(percentage),
    });

    await updateHtmlFile();
    res.json(newSkill);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la compétence" });
  }
});

app.put("/api/skills/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, percentage } = req.body;
    lastUpdate = Date.now();

    const updatedSkill = await dbOperations.skills.update(id, {
      name,
      percentage: parseInt(percentage),
    });

    if (!updatedSkill) {
      return res.status(404).json({ error: "Compétence non trouvée" });
    }

    await updateHtmlFile();
    res.json(updatedSkill);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la compétence" });
  }
});

app.delete("/api/skills/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.skills.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la compétence" });
  }
});
// Route pour changer le mot de passe admin
app.put("/api/admin/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "Les nouveaux mots de passe ne correspondent pas" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({
          error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
    }

    // Récupérer le compte admin actuel
    const currentAdmin = await dbOperations.admin.getByUsername(
      req.user.username
    );
    if (!currentAdmin) {
      return res.status(404).json({ error: "Compte admin non trouvé" });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      currentAdmin.password
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe (utilise votre table admin_users existante)
    const updated = await dbOperations.admin.updatePassword(
      req.user.username,
      hashedNewPassword
    );

    if (updated) {
      res.json({ message: "Mot de passe mis à jour avec succès" });
    } else {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du mot de passe" });
    }
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour changer le nom d'utilisateur admin
app.put("/api/admin/update-account", authenticateToken, async (req, res) => {
  try {
    const { newUsername } = req.body;

    // Validation
    if (!newUsername || newUsername.trim().length < 3) {
      return res
        .status(400)
        .json({
          error: "Le nom d'utilisateur doit contenir au moins 3 caractères",
        });
    }

    const currentUsername = req.user.username;

    // Vérifier si le nouveau nom d'utilisateur existe déjà (sauf si c'est le même)
    if (newUsername !== currentUsername) {
      const existingUser = await dbOperations.admin.getByUsername(newUsername);
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "Ce nom d'utilisateur existe déjà" });
      }
    }

    // Récupérer les infos actuelles
    const currentAdmin = await dbOperations.admin.getByUsername(
      currentUsername
    );
    if (!currentAdmin) {
      return res.status(404).json({ error: "Compte admin non trouvé" });
    }

    // Mettre à jour le nom d'utilisateur (utilise votre table admin_users existante)
    const updated = await dbOperations.admin.update(currentAdmin.id, {
      username: newUsername.trim(),
      password: currentAdmin.password, // Garder le même mot de passe
    });

    if (updated) {
      // Générer un nouveau token avec le nouveau nom d'utilisateur
      const newToken = jwt.sign(
        { username: newUsername.trim(), id: currentAdmin.id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Nom d'utilisateur mis à jour avec succès",
        newToken: newToken,
        newUsername: newUsername.trim(),
      });
    } else {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du nom d'utilisateur" });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du compte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour récupérer les informations du compte admin actuel
app.get("/api/admin/account-info", authenticateToken, async (req, res) => {
  try {
    const admin = await dbOperations.admin.getByUsername(req.user.username);
    if (!admin) {
      return res.status(404).json({ error: "Compte admin non trouvé" });
    }

    // Ne pas renvoyer le mot de passe hashé
    const { password, ...adminInfo } = admin;

    res.json({
      id: adminInfo.id,
      username: adminInfo.username,
      created_at: adminInfo.created_at,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des informations admin:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour réinitialiser toutes les données
app.post("/api/reset-all", authenticateToken, async (req, res) => {
  try {
    await dbOperations.deleteAll();
    lastUpdate = Date.now();
    await updateHtmlFile();
    res.json({
      success: true,
      message: "Toutes les données ont été réinitialisées",
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la réinitialisation" });
  }
});
// Route pour les statistiques d'optimisation
app.get('/api/optimization-stats', authenticateToken, async (req, res) => {
  try {
    const imageDir = path.join(__dirname, 'public/assets/images');
    const files = await fs.readdir(imageDir);
    
    let totalFiles = 0;
    let webpFiles = 0;
    let totalSize = 0;
    
    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
        totalFiles++;
        if (file.endsWith('.webp')) {
          webpFiles++;
        }
        
        const filePath = path.join(imageDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
    
    const optimizationRate = totalFiles > 0 ? (webpFiles / totalFiles * 100).toFixed(1) : 0;
    const averageSize = totalFiles > 0 ? (totalSize / totalFiles / 1024).toFixed(2) : 0;
    
    res.json({
      totalImages: totalFiles,
      optimizedImages: webpFiles,
      optimizationRate: `${optimizationRate}%`,
      averageImageSize: `${averageSize} KB`,
      totalDiskUsage: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    });
  } catch (error) {
    console.error('Erreur stats optimisation:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Route pour vérifier les mises à jour
app.get("/api/last-update", (req, res) => {
  res.json({ lastUpdate });
});
// Route pour générer le sitemap.xml
app.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const today = new Date().toISOString().split("T")[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}#about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}#parcours</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}#portfolio</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}#contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Erreur génération sitemap:", error);
    res.status(500).send("Erreur génération sitemap");
  }
});
// Route pour robots.txt
app.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.BASE_URL;
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Désindexer les fichiers admin
Disallow: /admin
Disallow: /api
Disallow: /assets/documents/

# Permettre l'indexation des images
Allow: /assets/images/`;

  res.type("text/plain");
  res.send(robotsTxt);
});

// Fonction pour générer les méta tags
function generateMetaTags(page = "home", data = {}) {
  const baseUrl = process.env.BASE_URL;

  const metaTags = {
    home: {
      title: "Nathan - Développeur Full Stack | Vufflens-la-Ville, VD",
      description:
        "Portfolio de Nathan, développeur Full Stack spécialisé en JavaScript, Node.js et React. Basé à Vufflens-la-Ville, Canton de Vaud, Suisse.",
      keywords:
        "développeur full stack, JavaScript, Node.js, React, Vufflens-la-Ville, Canton de Vaud, Suisse, freelance, développement web",
      image: `${baseUrl}/assets/images/nathan-avatar.jpg`,
      url: baseUrl,
    },
    portfolio: {
      title: "Portfolio - Mes Projets Web | Nathan Développeur",
      description:
        "Découvrez mes projets de développement web, applications JavaScript, sites vitrine et solutions e-commerce réalisés en Suisse.",
      keywords:
        "portfolio développeur, projets web, JavaScript, applications, sites web, e-commerce",
      image: `${baseUrl}/assets/images/portfolio-preview.jpg`,
      url: `${baseUrl}#portfolio`,
    },
    contact: {
      title: "Contact - Nathan Développeur Full Stack | Vufflens-la-Ville",
      description:
        "Contactez Nathan, développeur Full Stack à Vufflens-la-Ville. Disponible pour vos projets web en Suisse romande.",
      keywords:
        "contact développeur, Vufflens-la-Ville, développement web Suisse, freelance Canton de Vaud",
      image: `${baseUrl}/assets/images/contact-preview.jpg`,
      url: `${baseUrl}#contact`,
    },
  };

  return metaTags[page] || metaTags.home;
}

// Fonction pour mettre à jour le fichier HTML
async function updateHtmlFile() {
  try {
    const templatePath = path.join(__dirname, "public", "index-template.html");

    let htmlContent = await fs.readFile(templatePath, "utf-8");

    // Récupérer toutes les données de la base de données
    const [
      projects,
      testimonials,
      portfolioProjects,
      clients,
      blogs,
      categories,
      personalInfo,
      socialLinks,
      education,
      experience,
      skills,
    ] = await Promise.all([
      dbOperations.projects.getAll(),
      dbOperations.testimonials.getAll(),
      dbOperations.portfolioProjects.getAll(),
      dbOperations.clients.getAll(),
      dbOperations.blogs.getAll(),
      dbOperations.categories.getAll(),
      dbOperations.personalInfo.get(),
      dbOperations.socialLinks.getAll(),
      dbOperations.education.getAll(),
      dbOperations.experience.getAll(),
      dbOperations.skills.getAll(),
    ]);

    // Formater les données
    const formattedPersonalInfo = formatPersonalInfo(personalInfo);

    // Générer le HTML pour chaque section
    const projectsHtml = projects
      .map(
        (project) => `
        <li class="service-item">
          <div class="service-icon-box">
            <img src="${
              project.image || "./assets/images/icon-dev.svg"
            }" alt="${project.title}" width="40">
          </div>
          <div class="service-content-box">
            <h4 class="h4 service-item-title">${project.title}</h4>
            <p class="service-item-text">${project.description}</p>
          </div>
        </li>`
      )
      .join("\n");

    const testimonialsHtml = testimonials
      .map(
        (testimonial) => `
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
        </li>`
      )
      .join("\n");

 const portfolioProjectsHtml = portfolioProjects
      .map(
        (project) =>`
                <li class="project-item active" data-filter-item data-category="${
                  project.filter_category
                }">
                    <div class="project-links">
                        ${
                          project.repo_link
                            ? `<a href="${project.repo_link}" target="_blank" class="project-link repo-link" title="Voir le code">
                            <ion-icon name="logo-github"></ion-icon>
                        </a>`
                            : ""
                        }
                        ${
                          project.live_link
                            ? `<a href="${project.live_link}" target="_blank" class="project-link live-link" title="Voir le site">
                            <ion-icon name="eye-outline"></ion-icon>
                        </a>`
                            : ""
                        }
                    </div>
                    <figure class="project-img">
                        <div class="project-item-icon-box">
                            <ion-icon name="eye-outline"></ion-icon>
                        </div>
                        <img src="${project.image}" alt="${
          project.title
        }" loading="lazy" />
                    </figure>
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-category">${project.category}</p>
                </li>`
      )
      .join("\n");

    const clientsHtml = clients
      .map(
        (client) => `
    <li class="clients-item">
      <div class="client-card">
        <div class="client-image-container">
          <img 
            src="${client.logo || "./assets/images/client-default.png"}" 
            alt="${client.name}" 
            class="client-logo"
            loading="lazy">
          <div class="client-overlay">
            <div class="client-description">
              <h4>${client.name}</h4>
              <p>${client.description || "Client important"}</p>
              ${
                client.website
                  ? `
                <a href="${client.website}" target="_blank">
                  <ion-icon name="link-outline"></ion-icon>
                  <span>Site</span>
                </a>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    </li>`
      )
      .join("");

    const blogsHtml = blogs
      .slice(0, 6)
      .map(
        (blog) => `
         <li class="blog-post-item">
                    <a href="/blog/${blog.slug}">
                        <figure class="blog-banner-box">
                            <img src="${blog.image}" alt="${
          blog.title
        }" loading="lazy" />
                        </figure>
                        <div class="blog-content">
                            <div class="blog-meta">
                                <p class="blog-category">${blog.category}</p>
                                <span class="dot"></span>
                                <time datetime="${blog.date}">${new Date(
          blog.date
        ).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}</time>
                            </div>
                            <h3 class="h3 blog-item-title">${blog.title}</h3>
                            <p class="blog-text">${blog.excerpt}</p>
                        </div>
                    </a>
                </li>`
      )
      .join("\n");

    const categoryFiltersHtml = categories
      .map(
        (category) => `
        <li class="filter-item">
          <button data-filter-btn>${category.display_name}</button>
        </li>`
      )
      .join("\n");

    const categorySelectHtml = categories
      .map(
        (category) => `
        <li class="select-item">
                    <button data-select-item>${category.display_name}</button>
                </li>`
      )
      .join("\n");

    const socialLinksHtml = socialLinks
      .map(
        (link) => `
        <li class="social-item">
          <a href="${link.url}" class="social-link">
            <ion-icon name="${link.icon}"></ion-icon>
          </a>
        </li>`
      )
      .join("\n");

    const educationHtml = education
      .map(
        (edu) => `
        <li class="timeline-item">
          <h4 class="h4 timeline-item-title">${edu.institution}</h4>
          <span>${edu.period}</span>
          <p class="timeline-text">${edu.description}</p>
        </li>`
      )
      .join("\n");

    const experienceHtml = experience
      .map(
        (exp) => `
        <li class="timeline-item">
          <h4 class="h4 timeline-item-title">${exp.position}</h4>
          <span>${exp.period}</span>
          <p class="timeline-text">${exp.description}</p>
        </li>`
      )
      .join("\n");

    const skillsHtml = skills
      .map(
        (skill) => `
        <li class="skills-item">
          <div class="title-wrapper">
            <h5 class="h5">${skill.name}</h5>
            <data value="${skill.percentage}">${skill.percentage}%</data>
          </div>
          <div class="skill-progress-bg">
            <div class="skill-progress-fill" style="width: ${skill.percentage}%"></div>
          </div>
        </li>`
      )
      .join("\n");

    const aboutTextHtml = formattedPersonalInfo?.aboutText
      ? formattedPersonalInfo.aboutText
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join("\n")
      : "";

    // Remplacer les sections dans le HTML
    const replacements = [
      {
        regex:
          /(<!--\s*PROJECTS_START\s*-->)([\s\S]*?)(<!--\s*PROJECTS_END\s*-->)/,
        content: projectsHtml,
      },
      {
        regex:
          /(<!--\s*TESTIMONIALS_START\s*-->)([\s\S]*?)(<!--\s*TESTIMONIALS_END\s*-->)/,
        content: testimonialsHtml,
      },
      {
        regex:
          /(<!--\s*PORTFOLIO_PROJECTS_START\s*-->)([\s\S]*?)(<!--\s*PORTFOLIO_PROJECTS_END\s*-->)/,
        content: portfolioProjectsHtml,
      },
      {
        regex:
          /(<!--\s*CLIENTS_START\s*-->)([\s\S]*?)(<!--\s*CLIENTS_END\s*-->)/,
        content: clientsHtml,
      },
      {
        regex: /(<!--\s*BLOGS_START\s*-->)([\s\S]*?)(<!--\s*BLOGS_END\s*-->)/,
        content: blogsHtml,
      },
      {
        regex:
          /(<!--\s*CATEGORY_FILTERS_START\s*-->)([\s\S]*?)(<!--\s*CATEGORY_FILTERS_END\s*-->)/,
        content: categoryFiltersHtml,
      },
      {
        regex:
          /(<!--\s*CATEGORY_SELECT_START\s*-->)([\s\S]*?)(<!--\s*CATEGORY_SELECT_END\s*-->)/,
        content: categorySelectHtml,
      },
      {
        regex:
          /(<!--\s*SOCIAL_LINKS_START\s*-->)([\s\S]*?)(<!--\s*SOCIAL_LINKS_END\s*-->)/,
        content: socialLinksHtml,
      },
      {
        regex:
          /(<!--\s*EDUCATION_START\s*-->)([\s\S]*?)(<!--\s*EDUCATION_END\s*-->)/,
        content: educationHtml,
      },
      {
        regex:
          /(<!--\s*EXPERIENCE_START\s*-->)([\s\S]*?)(<!--\s*EXPERIENCE_END\s*-->)/,
        content: experienceHtml,
      },
      {
        regex: /(<!--\s*SKILLS_START\s*-->)([\s\S]*?)(<!--\s*SKILLS_END\s*-->)/,
        content: skillsHtml,
      },
      {
        regex:
          /(<!--\s*ABOUT_TEXT_START\s*-->)([\s\S]*?)(<!--\s*ABOUT_TEXT_END\s*-->)/,
        content: aboutTextHtml,
      },
    ];

    replacements.forEach(({ regex, content }) => {
      if (regex.test(htmlContent)) {
        htmlContent = htmlContent.replace(regex, `$1\n${content}\n$3`);
      }
    });

    // Remplacer les informations personnelles si elles existent
    if (formattedPersonalInfo) {
      const personalInfoRegex =
        /(<!--\s*PERSONAL_INFO_START\s*-->)([\s\S]*?)(<!--\s*PERSONAL_INFO_END\s*-->)/;
      if (personalInfoRegex.test(htmlContent)) {
        const personalInfoHtml = `
          <h1 class="name" title="${formattedPersonalInfo.name}">${formattedPersonalInfo.name}</h1>
          <p class="title">${formattedPersonalInfo.title}</p>`;

        htmlContent = htmlContent.replace(
          personalInfoRegex,
          `$1\n${personalInfoHtml}\n$3`
        );
      }

      const contactInfoRegex =
        /(<!--\s*CONTACT_INFO_START\s*-->)([\s\S]*?)(<!--\s*CONTACT_INFO_END\s*-->)/;
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
          </li>`;

        htmlContent = htmlContent.replace(
          contactInfoRegex,
          `$1\n${contactInfoHtml}\n$3`
        );
      }

      // Remplacer l'avatar
      const avatarRegex =
        /(<!--\s*AVATAR_START\s*-->)([\s\S]*?)(<!--\s*AVATAR_END\s*-->)/;
      if (avatarRegex.test(htmlContent)) {
        const avatarHtml = `<img src="${formattedPersonalInfo.avatar}" alt="${formattedPersonalInfo.name}" width="80">`;
        htmlContent = htmlContent.replace(avatarRegex, `$1\n${avatarHtml}\n$3`);
      }

      const mapRegex = /(<!-- MAP_START -->)([\s\S]*?)(<!-- MAP_END -->)/;
      if (mapRegex.test(htmlContent)) {
        const encodedLocation = encodeURIComponent(personalInfo.location);
        const mapHtml = `
                    <iframe
                        src="https://maps.google.com/maps?q=${encodedLocation}&t=&z=13&ie=UTF8&iwloc=&output=embed"
                        width="400"
                        height="300"
                        loading="lazy"
                        style="border:0;"
                        allowfullscreen="">
                    </iframe>
                `;
        htmlContent = htmlContent.replace(mapRegex, `$1\n${mapHtml}\n$3`);
      }
    }
    if (personalInfo && personalInfo.cv_file) {
      const cvRegex =
        /(<!-- CV_SECTION_START -->)([\s\S]*?)(<!-- CV_SECTION_END -->)/;
      if (cvRegex.test(htmlContent)) {
        const cvHtml = `
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
                    <iframe src="${personalInfo.cv_file}" width="100%" height="600px"></iframe>
                </div>
            </div>
        `;
        htmlContent = htmlContent.replace(cvRegex, `$1\n${cvHtml}\n$3`);
      }
    } else {
      const cvRegex =
        /(<!-- CV_SECTION_START -->)([\s\S]*?)(<!-- CV_SECTION_END -->)/;
      if (cvRegex.test(htmlContent)) {
        const cvHtml = `
            <div class="cv-container">
                <p class="cv-not-available">CV non disponible pour le moment</p>
            </div>
        `;
        htmlContent = htmlContent.replace(cvRegex, `$1\n${cvHtml}\n$3`);
      }
    }

    // Générer les méta-tags dynamiques
    const metaTags = generateMetaTags("home", personalInfo);

    // Remplacer les méta-tags dans le HTML
    htmlContent = htmlContent.replace(
      /<title>.*?<\/title>/i,
      `<title>${metaTags.title}</title>`
    );

    htmlContent = htmlContent.replace(
      /<meta name="description".*?>/i,
      `<meta name="description" content="${metaTags.description}">`
    );

    // Ajouter/remplacer les méta-tags SEO complets
    const seoMetaTags = `
    <meta name="description" content="${metaTags.description}">
    <meta name="keywords" content="${metaTags.keywords}">
    <meta name="author" content="Nathan">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${metaTags.url}">
    <meta property="og:title" content="${metaTags.title}">
    <meta property="og:description" content="${metaTags.description}">
    <meta property="og:image" content="${metaTags.image}">
    <meta property="og:locale" content="fr_CH">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${metaTags.url}">
    <meta property="twitter:title" content="${metaTags.title}">
    <meta property="twitter:description" content="${metaTags.description}">
    <meta property="twitter:image" content="${metaTags.image}">
    
    <!-- LinkedIn -->
    <meta property="linkedin:owner" content="Nathan">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${metaTags.url}">
    
    <!-- Structured Data JSON-LD -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "${personalInfo?.name || "Nathan"}",
      "jobTitle": "${personalInfo?.title || "Développeur Full Stack"}",
      "url": "${metaTags.url}",
      "image": "${metaTags.image}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Vufflens-la-Ville",
        "addressRegion": "Canton de Vaud",
        "addressCountry": "CH"
      },
      "email": "${personalInfo?.email || ""}",
      "telephone": "${personalInfo?.phone || ""}",
      "sameAs": [
        "https://github.com/votre-github",
        "https://linkedin.com/in/votre-profil"
      ]
    }
    </script>`;

    // Insérer les méta-tags dans le <head>
    htmlContent = htmlContent.replace("</head>", `${seoMetaTags}\n</head>`);
    await fs.writeFile("public/index.html", htmlContent, "utf8");

    console.log("✅ Fichier HTML mis à jour avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du fichier HTML:", error);
  }
}

// Initialiser la base de données et démarrer le serveur
async function startServer() {
  try {
    await initializeDatabase();
    await createAdminUser();
    await updateHtmlFile();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(
        `📊 Interface d'administration: http://localhost:${PORT}/admin`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
}

startServer();
