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
const { dbOperations } = require("./database");

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
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    }
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "cv") {
      // Accepter seulement les PDFs pour le CV
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Seuls les fichiers PDF sont acceptés pour le CV"));
      }
    } else {
      // Accepter les images pour les autres champs
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
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Vérifier si l'utilisateur admin existe déjà
    const existingAdmin = dbOperations.admin.getByUsername(adminUsername);

    if (!existingAdmin) {
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Créer l'utilisateur admin
      dbOperations.admin.create({
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
  return {
    name: dbData.name,
    title: dbData.title,
    email: dbData.email,
    phone: dbData.phone,
    birthday: dbData.birthday,
    location: dbData.location,
    avatar: dbData.avatar,
    cvFile: dbData.cv_file,
    aboutText: JSON.parse(dbData.about_text || "[]"),
  };
}

function formatPortfolioProject(dbData) {
  const category = dbOperations.categories.getByName(dbData.filter_category);

  return {
    id: dbData.id,
    title: dbData.title,
    category: category ? category.display_name : dbData.category,
    image: dbData.image,
    description: dbData.description,
    repoLink: dbData.repo_link,
    liveLink: dbData.live_link,
    filterCategory: dbData.filter_category,
  };
}

// Routes d'authentification
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = dbOperations.admin.getByUsername(username);

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
app.get("/api/projects", (req, res) => {
  try {
    const projects = dbOperations.projects.getAll();
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
  async (req, res) => {
    try {
      const { title, category, description } = req.body;
      const image = req.file ? `/assets/images/${req.file.filename}` : null;

      lastUpdate = Date.now();

      const newProject = dbOperations.projects.create({
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

      const updatedProject = dbOperations.projects.update(id, updateData);
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

    dbOperations.projects.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du projet" });
  }
});

// Routes pour les témoignages
app.get("/api/testimonials", (req, res) => {
  try {
    const testimonials = dbOperations.testimonials.getAll();
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
  async (req, res) => {
    try {
      const { name, text, date } = req.body;
      const avatar = req.file
        ? `/assets/images/${req.file.filename}`
        : "/assets/images/avatar-default.png";

      lastUpdate = Date.now();

      const newTestimonial = dbOperations.testimonials.create({
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

      const updatedTestimonial = dbOperations.testimonials.update(
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

    dbOperations.testimonials.delete(id);
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
app.get("/api/portfolio-projects", (req, res) => {
  try {
    const projects = dbOperations.portfolioProjects
      .getAll()
      .map(formatPortfolioProject);
    res.json(projects);
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

      const newProject = dbOperations.portfolioProjects.create({
        title,
        category,
        image,
        description,
        repoLink: repoLink || "",
        liveLink: liveLink || "",
        filterCategory: filterCategory || category,
      });

      await updateHtmlFile();
      res.json(formatPortfolioProject(newProject));
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

      const updatedProject = dbOperations.portfolioProjects.update(
        id,
        updateData
      );
      if (!updatedProject) {
        return res.status(404).json({ error: "Projet portfolio non trouvé" });
      }

      await updateHtmlFile();
      res.json(formatPortfolioProject(updatedProject));
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

      dbOperations.portfolioProjects.delete(id);
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
app.get("/api/clients", (req, res) => {
  try {
    const clients = dbOperations.clients.getAll();
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
  async (req, res) => {
    try {
      const { name, website, description } = req.body;
      const logo = req.file ? `/assets/images/${req.file.filename}` : null;

      lastUpdate = Date.now();

      const newClient = dbOperations.clients.create({
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

      const updatedClient = dbOperations.clients.update(id, updateData);
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

    dbOperations.clients.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du client" });
  }
});

// Routes pour les catégories
app.get("/api/categories", (req, res) => {
  try {
    const categories = dbOperations.categories.getAll();
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

    const existingCategory = dbOperations.categories.getByName(
      name.toLowerCase()
    );
    if (existingCategory) {
      return res.status(400).json({ error: "Cette catégorie existe déjà" });
    }

    lastUpdate = Date.now();

    const newCategory = dbOperations.categories.create({
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

    const category = dbOperations.categories.getById(id);
    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    const oldName = category.name;
    const newName = name
      ? name.toLowerCase().replace(/\s+/g, " ").trim()
      : category.name;
    const newDisplayName = displayName || category.display_name;

    const updatedCategory = dbOperations.categories.update(id, {
      name: newName,
      displayName: newDisplayName,
    });

    // Mettre à jour les références dans les projets portfolio
    if (oldName !== newName) {
      dbOperations.portfolioProjects.updateCategoryReferences(
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

    const category = dbOperations.categories.getById(id);
    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    // Vérifier si des projets utilisent cette catégorie
    const projectsUsingCategory = dbOperations.portfolioProjects
      .getAll()
      .filter((p) => p.filter_category === category.name);

    if (projectsUsingCategory.length > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer cette catégorie. ${projectsUsingCategory.length} projet(s) l'utilisent encore.`,
        projects: projectsUsingCategory.map((p) => p.title),
      });
    }

    lastUpdate = Date.now();
    dbOperations.categories.delete(id);
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
app.get("/api/blogs", (req, res) => {
  try {
    const blogs = dbOperations.blogs.getAll();
    res.json(blogs);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des blogs" });
  }
});

app.get("/api/blogs/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const blog = dbOperations.blogs.getBySlug(slug);

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
  async (req, res) => {
    try {
      const { title, category, excerpt, content, author } = req.body;
      const image = req.file ? `/assets/images/${req.file.filename}` : null;

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      lastUpdate = Date.now();

      const newBlog = dbOperations.blogs.create({
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

      const updatedBlog = dbOperations.blogs.update(id, updateData);
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

    dbOperations.blogs.delete(id);
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
    const blog = dbOperations.blogs.getBySlug(slug);

    if (!blog) {
      return res.status(404).send("Blog non trouvé");
    }

    const contentHtml = marked(blog.content);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    const metaTags = generateMetaTags({
      title: `${blog.title} - Portfolio Blog`,
      description: blog.excerpt,
      image: `${baseUrl}${blog.image}`,
      url: `${baseUrl}/blog/${blog.slug}`,
      type: "article",
      author: blog.author,
    });

    const blogPageHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            ${metaTags}
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                .blog-header { text-align: center; margin-bottom: 30px; }
                .blog-image { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; }
                .blog-meta { color: #666; margin: 20px 0; text-align: center; }
                .blog-content { margin-top: 30px; }
                .blog-content h1, .blog-content h2, .blog-content h3 { color: #333; }
                .blog-content p { margin-bottom: 15px; }
                .blog-content ul, .blog-content ol { margin-bottom: 15px; padding-left: 30px; }
                .back-button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-bottom: 20px; }
                .back-button:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <a href="/" class="back-button">← Retour au portfolio</a>
            
            <article class="blog-article">
                <header class="blog-header">
                    <img src="${blog.image}" alt="${
      blog.title
    }" class="blog-image">
                    <h1>${blog.title}</h1>
                    <div class="blog-meta">
                        <span>Par ${blog.author}</span> • 
                        <span>${blog.category}</span> • 
                        <time>${new Date(blog.date).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}</time>
                    </div>
                </header>
                
                <div class="blog-content">
                    ${contentHtml}
                </div>
            </article>
        </body>
        </html>
        `;

    res.send(blogPageHtml);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur serveur");
  }
});

// Routes pour les informations personnelles
app.get("/api/personal-info", (req, res) => {
  try {
    const personalInfo = dbOperations.personalInfo.get();
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

      // Gestion de l'avatar
      if (req.files && req.files.avatar) {
        updateData.avatar = `/assets/images/${req.files.avatar[0].filename}`;
      }

      // Gestion du CV
      if (req.files && req.files.cv) {
        updateData.cvFile = `/assets/documents/${req.files.cv[0].filename}`;
      }

      if (aboutText) {
        if (Array.isArray(aboutText)) {
          updateData.aboutText = JSON.stringify(aboutText);
        } else {
          updateData.aboutText = JSON.stringify(
            aboutText.split("\n").filter((p) => p.trim() !== "")
          );
        }
      }

      const updatedInfo = dbOperations.personalInfo.update(updateData);
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
// Route pour servir les documents (CV)
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
app.get("/api/social-links", (req, res) => {
  try {
    const socialLinks = dbOperations.socialLinks.getAll();
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

    const newSocialLink = dbOperations.socialLinks.create({
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

    const updatedSocialLink = dbOperations.socialLinks.update(id, {
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

    dbOperations.socialLinks.delete(id);
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
app.get("/api/education", (req, res) => {
  try {
    const education = dbOperations.education.getAll();
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

    const newEducation = dbOperations.education.create({
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
      .json({ error: "Erreur lors de la création de la formation" });
  }
});

app.put("/api/education/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { institution, period, description } = req.body;

    lastUpdate = Date.now();

    const updatedEducation = dbOperations.education.update(id, {
      institution,
      period,
      description,
    });
    if (!updatedEducation) {
      return res.status(404).json({ error: "Formation non trouvée" });
    }

    await updateHtmlFile();
    res.json(updatedEducation);
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la formation" });
  }
});

app.delete("/api/education/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    dbOperations.education.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la formation" });
  }
});

// Routes pour l'expérience
app.get("/api/experience", (req, res) => {
  try {
    const experience = dbOperations.experience.getAll();
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

    const newExperience = dbOperations.experience.create({
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

    const updatedExperience = dbOperations.experience.update(id, {
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

    dbOperations.experience.delete(id);
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
app.get("/api/skills", (req, res) => {
  try {
    const skills = dbOperations.skills.getAll();
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

    const newSkill = dbOperations.skills.create({
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

    if (percentage && (percentage < 0 || percentage > 100)) {
      return res
        .status(400)
        .json({ error: "Le pourcentage doit être entre 0 et 100" });
    }

    lastUpdate = Date.now();

    const updatedSkill = dbOperations.skills.update(id, {
      name,
      percentage: percentage !== undefined ? parseInt(percentage) : undefined,
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

    dbOperations.skills.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la compétence" });
  }
});

// Route pour supprimer TOUT
app.delete("/api/delete-all", authenticateToken, async (req, res) => {
  try {
    dbOperations.deleteAll();
    lastUpdate = Date.now();
    await updateHtmlFile();

    res.json({
      success: true,
      message: "Toutes les données ont été supprimées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// Route pour vérifier les mises à jour
app.get("/api/last-update", (req, res) => {
  res.json({
    updated: false,
    timestamp: lastUpdate,
  });
});

// Route pour générer le sitemap.xml
app.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const currentDate = new Date().toISOString();

    // Récupérer toutes les données
    const blogs = dbOperations.blogs.getAll();
    const portfolioProjects = dbOperations.portfolioProjects.getAll();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Page d'accueil -->
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    
    <!-- Pages statiques -->
    <url>
        <loc>${baseUrl}/#about</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    
    <url>
        <loc>${baseUrl}/#resume</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    
    <url>
        <loc>${baseUrl}/#portfolio</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    
    <url>
        <loc>${baseUrl}/#contact</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;

    // Ajouter les blogs
    blogs.forEach((blog) => {
      sitemap += `
    <url>
        <loc>${baseUrl}/blog/${blog.slug}</loc>
        <lastmod>${blog.created_at || currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
    });

    sitemap += `
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Erreur génération sitemap:", error);
    res.status(500).send("Erreur lors de la génération du sitemap");
  }
});

// Route pour robots.txt
app.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  res.set("Content-Type", "text/plain");
  res.send(robots);
});

async function updateHtmlFile() {
  try {
    let htmlContent = await fs.readFile("public/index.html", "utf8");

    // Récupérer les données depuis la base
    const projects = dbOperations.projects.getAll();
    const testimonials = dbOperations.testimonials.getAll();
    const portfolioProjects = dbOperations.portfolioProjects
      .getAll()
      .map(formatPortfolioProject);
    const clients = dbOperations.clients.getAll();
    const blogs = dbOperations.blogs.getAll();
    const categories = dbOperations.categories.getAll();
    const socialLinks = dbOperations.socialLinks.getAll();
    const education = dbOperations.education.getAll();
    const experience = dbOperations.experience.getAll();
    const skills = dbOperations.skills.getAll();
    const personalInfo = formatPersonalInfo(dbOperations.personalInfo.get());

    // Générer le HTML pour les projets (section "What i'm doing")
    const projectsHtml = projects
      .map(
        (project) => `
                <li class="service-item">
                    <div class="service-icon-box">
                        <img src="${project.image}" alt="${project.title}" width="40">
                    </div>
                    <div class="service-content-box">
                        <h4 class="h4 service-item-title">${project.title}</h4>
                        <p class="service-item-text">${project.description}</p>
                    </div>
                </li>`
      )
      .join("\n");

    // Générer le HTML pour les témoignages
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

    // Générer le HTML pour les projets portfolio
    const portfolioProjectsHtml = portfolioProjects
      .map(
        (project) => `
                <li class="project-item active" data-filter-item data-category="${
                  project.filterCategory
                }">
                    <div class="project-links">
                        ${
                          project.repoLink
                            ? `<a href="${project.repoLink}" target="_blank" class="project-link repo-link" title="Voir le code">
                            <ion-icon name="logo-github"></ion-icon>
                        </a>`
                            : ""
                        }
                        ${
                          project.liveLink
                            ? `<a href="${project.liveLink}" target="_blank" class="project-link live-link" title="Voir le site">
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

    // Générer le HTML pour les clients
    const clientsHtml = clients
      .map(
        (client) => `
                <li class="clients-item">
                    <a href="${client.website}" target="_blank" title="${client.name}">
                        <img src="${client.logo}" alt="${client.name} logo" />
                    </a>
                </li>`
      )
      .join("\n");

    // Générer le HTML pour les blogs
    const blogsHtml = blogs
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

    // Générer les filtres de catégories
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

    // Générer le HTML pour les liens sociaux
    const socialLinksHtml = socialLinks
      .map(
        (social) => `
                <li class="social-item">
                    <a href="${social.url}" class="social-link" target="_blank" title="${social.name}">
                        <ion-icon name="${social.icon}"></ion-icon>
                    </a>
                </li>`
      )
      .join("\n");

    // Générer le HTML pour l'éducation
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

    // Générer le HTML pour l'expérience
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

    // Générer le HTML pour les compétences
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

    // Générer le texte de présentation
    const aboutTextHtml = personalInfo
      ? personalInfo.aboutText
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join("\n")
      : "";

    // Remplacer les sections
    const replacements = [
      {
        regex: /(<!-- PROJECTS_START -->)([\s\S]*?)(<!-- PROJECTS_END -->)/,
        content: projectsHtml,
      },
      {
        regex:
          /(<!-- TESTIMONIALS_START -->)([\s\S]*?)(<!-- TESTIMONIALS_END -->)/,
        content: testimonialsHtml,
      },
      {
        regex: /(<!-- PORTFOLIO_START -->)([\s\S]*?)(<!-- PORTFOLIO_END -->)/,
        content: portfolioProjectsHtml,
      },
      {
        regex: /(<!-- CLIENTS_START -->)([\s\S]*?)(<!-- CLIENTS_END -->)/,
        content: clientsHtml,
      },
      {
        regex: /(<!-- BLOGS_START -->)([\s\S]*?)(<!-- BLOGS_END -->)/,
        content: blogsHtml,
      },
      {
        regex:
          /(<!-- CATEGORY_FILTERS_START -->)([\s\S]*?)(<!-- CATEGORY_FILTERS_END -->)/,
        content: categoryFiltersHtml,
      },
      {
        regex:
          /(<!-- CATEGORY_SELECT_START -->)([\s\S]*?)(<!-- CATEGORY_SELECT_END -->)/,
        content: categorySelectHtml,
      },
      {
        regex:
          /(<!-- SOCIAL_LINKS_START -->)([\s\S]*?)(<!-- SOCIAL_LINKS_END -->)/,
        content: socialLinksHtml,
      },
      {
        regex: /(<!-- EDUCATION_START -->)([\s\S]*?)(<!-- EDUCATION_END -->)/,
        content: educationHtml,
      },
      {
        regex: /(<!-- EXPERIENCE_START -->)([\s\S]*?)(<!-- EXPERIENCE_END -->)/,
        content: experienceHtml,
      },
      {
        regex: /(<!-- SKILLS_START -->)([\s\S]*?)(<!-- SKILLS_END -->)/,
        content: skillsHtml,
      },
      {
        regex: /(<!-- ABOUT_TEXT_START -->)([\s\S]*?)(<!-- ABOUT_TEXT_END -->)/,
        content: aboutTextHtml,
      },
    ];

    replacements.forEach(({ regex, content }) => {
      if (regex.test(htmlContent)) {
        htmlContent = htmlContent.replace(regex, `$1\n${content}\n$3`);
      }
    });

    // Remplacer les informations personnelles si elles existent
    if (personalInfo) {
      const personalInfoRegex =
        /(<!-- PERSONAL_INFO_START -->)([\s\S]*?)(<!-- PERSONAL_INFO_END -->)/;
      if (personalInfoRegex.test(htmlContent)) {
        const personalInfoHtml = `
                    <h1 class="name" title="${personalInfo.name}">${personalInfo.name}</h1>
                    <p class="title">${personalInfo.title}</p>
                `;
        htmlContent = htmlContent.replace(
          personalInfoRegex,
          `$1\n${personalInfoHtml}\n$3`
        );
      }

      const contactInfoRegex =
        /(<!-- CONTACT_INFO_START -->)([\s\S]*?)(<!-- CONTACT_INFO_END -->)/;
      if (contactInfoRegex.test(htmlContent)) {
        const contactInfoHtml = `
                    <li class="contact-item">
                        <div class="icon-box">
                            <ion-icon name="mail-outline"></ion-icon>
                        </div>
                        <div class="contact-info">
                            <p class="contact-title">Email</p>
                            <a href="mailto:${
                              personalInfo.email
                            }" class="contact-link">${personalInfo.email}</a>
                        </div>
                    </li>

                    <li class="contact-item">
                        <div class="icon-box">
                            <ion-icon name="phone-portrait-outline"></ion-icon>
                        </div>
                        <div class="contact-info">
                            <p class="contact-title">Phone</p>
                            <a href="tel:${personalInfo.phone.replace(
                              /\s/g,
                              ""
                            )}" class="contact-link">${personalInfo.phone}</a>
                        </div>
                    </li>

                    <li class="contact-item">
                        <div class="icon-box">
                            <ion-icon name="calendar-outline"></ion-icon>
                        </div>
                        <div class="contact-info">
                            <p class="contact-title">Birthday</p>
                            <time datetime="${
                              personalInfo.birthday
                            }">${new Date(
          personalInfo.birthday
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</time>
                        </div>
                    </li>

                    <li class="contact-item">
                        <div class="icon-box">
                            <ion-icon name="location-outline"></ion-icon>
                        </div>
                        <div class="contact-info">
                            <p class="contact-title">Location</p>
                            <address>${personalInfo.location}</address>
                        </div>
                    </li>
                `;
        htmlContent = htmlContent.replace(
          contactInfoRegex,
          `$1\n${contactInfoHtml}\n$3`
        );
      }

      const avatarRegex =
        /(<!-- AVATAR_START -->)([\s\S]*?)(<!-- AVATAR_END -->)/;
      if (avatarRegex.test(htmlContent)) {
        const avatarHtml = `
                    <figure class="avatar-box">
                        <img src="${personalInfo.avatar}" alt="${personalInfo.name}" width="80" />
                    </figure>
                `;
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
    if (personalInfo && personalInfo.cvFile) {
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
                    <iframe src="${personalInfo.cvFile}" width="100%" height="600px"></iframe>
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
    await fs.writeFile("public/index.html", htmlContent, "utf8");
    console.log("✅ Fichier HTML mis à jour avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du fichier HTML:", error);
  }
}

function generateMetaTags(data) {
  const {
    title = process.env.NAME_SITE,
    description = process.env.DESCRIPTION_SITE,
    image = "/assets/images/og-image.jpg",
    url = "/",
    type = "website",
    author = process.env.AUTHOR,
  } = data;

  return `
    <!-- Meta tags essentiels -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="author" content="${author}">
    <meta name="keywords" content="développeur web, portfolio, Node.js, React, JavaScript, développement">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="Portfolio - ${author}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">
    
    <!-- Meta tags techniques -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    <link rel="canonical" href="${url}">`;
}
// Démarrer le serveur
app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Interface d'administration: http://localhost:${PORT}/admin`);
  console.log(`🌐 Portfolio: http://localhost:${PORT}`);

  // Créer l'utilisateur admin au démarrage
  await createAdminUser();

  // Mettre à jour le HTML au démarrage
  await updateHtmlFile();
});
