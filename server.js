const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { marked } = require("marked");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-jwt-tres-securise";

let lastUpdate = Date.now();

// Configuration du stockage pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/assets/images/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/admin", express.static("admin"));

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // ou votre service email
  auth: {
    user: process.env.EMAIL_USER || "votre-email@gmail.com",
    pass: process.env.EMAIL_PASS || "votre-mot-de-passe-app",
  },
});

// Données en mémoire
let portfolioData = {
  projects: [
    {
      id: 1,
      title: "Finance",
      category: "web development",
      image: "./assets/images/project-1.jpg",
      description: "Projet de développement web financier",
    },
  ],
  testimonials: [
    {
      id: 1,
      name: "Daniel Lewis",
      text: "Richard was hired to create a corporate identity. We were very pleased with the work done.",
      avatar: "./assets/images/avatar-1.png",
      date: "2021-06-14",
    },
  ],
};
let portfolioProjects = [
  {
    id: 1,
    title: "Finance",
    category: "web development",
    image: "./assets/images/project-1.jpg",
    description: "Application de gestion financière moderne",
    repoLink: "https://github.com/username/finance-app",
    liveLink: "https://finance-app.netlify.app",
    filterCategory: "web development",
  },
];
let clientsData = [
  {
    id: 1,
    name: "Client 1",
    logo: "./assets/images/logo-1-color.png",
    website: "https://client1.com",
    description: "Description du client 1",
  },
];
let categoriesData = [
  { id: 1, name: "web development", displayName: "Web Development" },
  { id: 2, name: "applications", displayName: "Applications" },
  { id: 3, name: "web design", displayName: "Web Design" },
  { id: 4, name: "mobile apps", displayName: "Mobile Apps" },
];
let blogsData = [
  {
    id: 1,
    title: "Design conferences in 2022",
    category: "Design",
    excerpt:
      "Veritatis et quasi architecto beatae vitae dicta sunt, explicabo.",
    content: `# Design Conferences 2022\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. **Sed do eiusmod** tempor incididunt ut labore.\n\n## Les principales conférences\n\n- UX Design Summit\n- Creative Conference\n- Design Week\n\n### Conclusion\n\nCes conférences sont essentielles pour rester à jour.`,
    image: "./assets/images/blog-1.jpg",
    date: "2022-02-23",
    author: "Admin",
    slug: "design-conferences-2022",
  },
];
// Utilisateur admin par défaut
const adminUser = {
  username: "admin",
  password: "$2a$12$YIuOrmXTivZ54PH2JZrsfOjWO46YnA6DfDE92OwP3xZUBJxSG83C.",
};

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

// Route pour vérifier les mises à jour
app.get("/api/last-update", (req, res) => {
  res.json({
    updated: false, // Logique pour détecter les changements
    timestamp: lastUpdate,
  });
});

// Routes d'authentification
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === adminUser.username &&
    (await bcrypt.compare(password, adminUser.password))
  ) {
    const token = jwt.sign({ username: adminUser.username }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Identifiants invalides" });
  }
});

// Route pour envoyer un email
app.post("/api/send-email", async (req, res) => {
  const { fullname, email, message } = req.body;

  try {
    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL || "votre-email@gmail.com",
      subject: `Nouveau message de ${fullname}`,
      html: `
        <h3>Nouveau message depuis votre portfolio</h3>
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

// Routes pour les projets
app.get("/api/projects", (req, res) => {
  res.json(portfolioData.projects);
});

app.post(
  "/api/projects",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { title, category, description } = req.body;
    const image = req.file ? `./assets/images/${req.file.filename}` : null;
    lastUpdate = Date.now();
    const newProject = {
      id: Date.now(),
      title,
      category,
      image,
      description,
    };

    portfolioData.projects.push(newProject);
    await updateHtmlFile();
    res.json(newProject);
  }
);

app.put(
  "/api/projects/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { title, category, description } = req.body;
    lastUpdate = Date.now();

    const projectIndex = portfolioData.projects.findIndex((p) => p.id == id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    const project = portfolioData.projects[projectIndex];
    project.title = title || project.title;
    project.category = category || project.category;
    project.description = description || project.description;

    if (req.file) {
      project.image = `./assets/images/${req.file.filename}`;
    }

    await updateHtmlFile();
    res.json(project);
  }
);

app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  lastUpdate = Date.now();
  portfolioData.projects = portfolioData.projects.filter((p) => p.id != id);
  await updateHtmlFile();
  res.json({ success: true });
});

// Routes pour les témoignages
app.get("/api/testimonials", (req, res) => {
  res.json(portfolioData.testimonials);
});

app.post(
  "/api/testimonials",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    const { name, text, date } = req.body;
    const avatar = req.file
      ? `./assets/images/${req.file.filename}`
      : "./assets/images/avatar-default.png";
    lastUpdate = Date.now();
    const newTestimonial = {
      id: Date.now(),
      name,
      text,
      avatar,
      date: date || new Date().toISOString().split("T")[0],
    };

    portfolioData.testimonials.push(newTestimonial);
    await updateHtmlFile();
    res.json(newTestimonial);
  }
);

app.put(
  "/api/testimonials/:id",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    const { id } = req.params;
    const { name, text, date } = req.body;
    lastUpdate = Date.now();
    const testimonialIndex = portfolioData.testimonials.findIndex(
      (t) => t.id == id
    );
    if (testimonialIndex === -1) {
      return res.status(404).json({ error: "Témoignage non trouvé" });
    }

    const testimonial = portfolioData.testimonials[testimonialIndex];
    testimonial.name = name || testimonial.name;
    testimonial.text = text || testimonial.text;
    testimonial.date = date || testimonial.date;

    if (req.file) {
      testimonial.avatar = `./assets/images/${req.file.filename}`;
    }

    await updateHtmlFile();
    res.json(testimonial);
  }
);

app.delete("/api/testimonials/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  lastUpdate = Date.now();
  portfolioData.testimonials = portfolioData.testimonials.filter(
    (t) => t.id != id
  );
  await updateHtmlFile();
  res.json({ success: true });
});
// Routes pour les projets portfolio
app.get("/api/portfolio-projects", (req, res) => {
  res.json(portfolioProjects);
});

app.post(
  "/api/portfolio-projects",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { title, category, description, repoLink, liveLink, filterCategory } =
      req.body;
    const image = req.file ? `./assets/images/${req.file.filename}` : null;

    lastUpdate = Date.now();

    const newProject = {
      id: Date.now(),
      title,
      category,
      image,
      description,
      repoLink: repoLink || "",
      liveLink: liveLink || "",
      filterCategory: filterCategory || category,
    };

    portfolioProjects.push(newProject);
    await updateHtmlFile();
    res.json(newProject);
  }
);

app.put(
  "/api/portfolio-projects/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { title, category, description, repoLink, liveLink, filterCategory } =
      req.body;

    lastUpdate = Date.now();

    const projectIndex = portfolioProjects.findIndex((p) => p.id == id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: "Projet portfolio non trouvé" });
    }

    const project = portfolioProjects[projectIndex];
    project.title = title || project.title;
    project.category = category || project.category;
    project.description = description || project.description;
    project.repoLink = repoLink || project.repoLink;
    project.liveLink = liveLink || project.liveLink;
    project.filterCategory = filterCategory || project.filterCategory;

    if (req.file) {
      project.image = `./assets/images/${req.file.filename}`;
    }

    await updateHtmlFile();
    res.json(project);
  }
);

app.delete(
  "/api/portfolio-projects/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    lastUpdate = Date.now();

    portfolioProjects = portfolioProjects.filter((p) => p.id != id);
    await updateHtmlFile();
    res.json({ success: true });
  }
);
// Routes pour les clients
app.get("/api/clients", (req, res) => {
  res.json(clientsData);
});

app.post(
  "/api/clients",
  authenticateToken,
  upload.single("logo"),
  async (req, res) => {
    const { name, website, description } = req.body;
    const logo = req.file ? `./assets/images/${req.file.filename}` : null;

    lastUpdate = Date.now();

    const newClient = {
      id: Date.now(),
      name,
      logo,
      website: website || "",
      description: description || "",
    };

    clientsData.push(newClient);
    await updateHtmlFile();
    res.json(newClient);
  }
);

app.put(
  "/api/clients/:id",
  authenticateToken,
  upload.single("logo"),
  async (req, res) => {
    const { id } = req.params;
    const { name, website, description } = req.body;

    lastUpdate = Date.now();

    const clientIndex = clientsData.findIndex((c) => c.id == id);
    if (clientIndex === -1) {
      return res.status(404).json({ error: "Client non trouvé" });
    }

    const client = clientsData[clientIndex];
    client.name = name || client.name;
    client.website = website !== undefined ? website : client.website;
    client.description =
      description !== undefined ? description : client.description;

    // Ne mettre à jour l'image que si une nouvelle est fournie
    if (req.file) {
      client.logo = `./assets/images/${req.file.filename}`;
    }

    await updateHtmlFile();
    res.json(client);
  }
);

app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  clientsData = clientsData.filter((c) => c.id != id);
  await updateHtmlFile();
  res.json({ success: true });
});
// Routes pour les catégories
app.get("/api/categories", (req, res) => {
  res.json(categoriesData);
});

app.post("/api/categories", authenticateToken, async (req, res) => {
  const { name, displayName } = req.body;

  // Vérifier si la catégorie existe déjà
  const existingCategory = categoriesData.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (existingCategory) {
    return res.status(400).json({ error: "Cette catégorie existe déjà" });
  }

  lastUpdate = Date.now();

  const newCategory = {
    id: Date.now(),
    name: name.toLowerCase().replace(/\s+/g, " ").trim(),
    displayName: displayName || name,
  };

  categoriesData.push(newCategory);
  await updateHtmlFile();
  res.json(newCategory);
});

app.put("/api/categories/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, displayName } = req.body;

  lastUpdate = Date.now();

  const categoryIndex = categoriesData.findIndex((c) => c.id == id);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: "Catégorie non trouvée" });
  }

  const category = categoriesData[categoryIndex];
  const oldName = category.name;

  category.name = name
    ? name.toLowerCase().replace(/\s+/g, " ").trim()
    : category.name;
  category.displayName = displayName || category.displayName;

  // Mettre à jour tous les projets qui utilisent cette catégorie
  portfolioProjects.forEach((project) => {
    if (project.filterCategory === oldName) {
      project.filterCategory = category.name;
      project.category = category.displayName;
    }
  });

  await updateHtmlFile();
  res.json(category);
});

app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const category = categoriesData.find((c) => c.id == id);
  if (!category) {
    return res.status(404).json({ error: "Catégorie non trouvée" });
  }

  // Vérifier si des projets utilisent cette catégorie
  const projectsUsingCategory = portfolioProjects.filter(
    (p) => p.filterCategory === category.name
  );
  if (projectsUsingCategory.length > 0) {
    return res.status(400).json({
      error: `Impossible de supprimer cette catégorie. ${projectsUsingCategory.length} projet(s) l'utilisent encore.`,
      projects: projectsUsingCategory.map((p) => p.title),
    });
  }

  lastUpdate = Date.now();
  categoriesData = categoriesData.filter((c) => c.id != id);
  await updateHtmlFile();
  res.json({ success: true });
});
// Routes pour les blogs
app.get("/api/blogs", (req, res) => {
  res.json(blogsData);
});

app.get("/api/blogs/:slug", (req, res) => {
  const { slug } = req.params;
  const blog = blogsData.find((b) => b.slug === slug);
  if (!blog) {
    return res.status(404).json({ error: "Blog non trouvé" });
  }

  // Convertir le markdown en HTML
  const blogWithHtml = {
    ...blog,
    contentHtml: marked(blog.content),
  };

  res.json(blogWithHtml);
});

app.post(
  "/api/blogs",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { title, category, excerpt, content, author } = req.body;
    const image = req.file ? `./assets/images/${req.file.filename}` : null;

    // Générer un slug à partir du titre
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    lastUpdate = Date.now();

    const newBlog = {
      id: Date.now(),
      title,
      category,
      excerpt,
      content,
      image,
      date: new Date().toISOString().split("T")[0],
      author: author || "Admin",
      slug,
    };

    blogsData.push(newBlog);
    await updateHtmlFile();
    res.json(newBlog);
  }
);

app.put(
  "/api/blogs/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { title, category, excerpt, content, author } = req.body;

    lastUpdate = Date.now();

    const blogIndex = blogsData.findIndex((b) => b.id == id);
    if (blogIndex === -1) {
      return res.status(404).json({ error: "Blog non trouvé" });
    }

    const blog = blogsData[blogIndex];
    blog.title = title || blog.title;
    blog.category = category || blog.category;
    blog.excerpt = excerpt || blog.excerpt;
    blog.content = content || blog.content;
    blog.author = author || blog.author;

    // Régénérer le slug si le titre change
    if (title) {
      blog.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (req.file) {
      blog.image = `./assets/images/${req.file.filename}`;
    }

    await updateHtmlFile();
    res.json(blog);
  }
);

app.delete("/api/blogs/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  lastUpdate = Date.now();

  blogsData = blogsData.filter((b) => b.id != id);
  await updateHtmlFile();
  res.json({ success: true });
});
// Route pour afficher un blog complet
app.get("/blog/:slug", async (req, res) => {
  const { slug } = req.params;
  const blog = blogsData.find((b) => b.slug === slug);

  if (!blog) {
    return res.status(404).send("Blog non trouvé");
  }

  const contentHtml = marked(blog.content);

  const blogPageHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${blog.title}</title>
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
                <img src="${blog.image}" alt="${blog.title}" class="blog-image">
                <h1>${blog.title}</h1>
                <div class="blog-meta">
                    <span>Par ${blog.author}</span> • 
                    <span>${blog.category}</span> • 
                    <time>${new Date(blog.date).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</time>
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
});

// Route pour supprimer TOUT
app.delete("/api/delete-all", authenticateToken, async (req, res) => {
  try {
    // Vider toutes les données
    portfolioData.projects = [];
    portfolioData.testimonials = [];
    portfolioProjects = [];
    clientsData = [];
    blogsData = [];

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

// Fonction pour mettre à jour le fichier HTML
async function updateHtmlFile() {
  try {
    let htmlContent = await fs.readFile("public/index.html", "utf8");

    // Générer le HTML pour les projets (section "What i'm doing")
    const projectsHtml = portfolioData.projects
      .map(
        (project) => `
                <li class="service-item">
                    <div class="service-icon-box">
                        <img src="${project.image}" alt="${project.title}" width="40">
                    </div>
                    <div class="service-content-box">
                        <h4 class="h4 service-item-title">${project.title}</h4>
                        <p class="service-item-text">
                            ${project.description}
                        </p>
                    </div>
                </li>`
      )
      .join("\n");

    // Générer le HTML pour les témoignages
    const testimonialsHtml = portfolioData.testimonials
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
    const clientsHtml = clientsData
      .map(
        (client) => `
                <li class="clients-item">
                    <a href="${client.website}" target="_blank" title="${client.name}">
                        <img src="${client.logo}" alt="${client.name} logo" />
                    </a>
                </li>`
      )
      .join("\n");

    // Générer les filtres de catégories
    const categoryFiltersHtml = categoriesData
      .map(
        (category) => `
                <li class="filter-item">
                    <button data-filter-btn>${category.displayName}</button>
                </li>`
      )
      .join("\n");

    const categorySelectHtml = categoriesData
      .map(
        (category) => `
                <li class="select-item">
                    <button data-select-item>${category.displayName}</button>
                </li>`
      )
      .join("\n");
    // Générer le HTML pour les blogs
    const blogsHtml = blogsData
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
    // Remplacer les sections
    const projectsRegex =
      /(<!-- PROJECTS_START -->)([\s\S]*?)(<!-- PROJECTS_END -->)/;
    if (projectsRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        projectsRegex,
        `$1\n${projectsHtml}\n$3`
      );
    }

    const testimonialsRegex =
      /(<!-- TESTIMONIALS_START -->)([\s\S]*?)(<!-- TESTIMONIALS_END -->)/;
    if (testimonialsRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        testimonialsRegex,
        `$1\n${testimonialsHtml}\n$3`
      );
    }

    const portfolioRegex =
      /(<!-- PORTFOLIO_START -->)([\s\S]*?)(<!-- PORTFOLIO_END -->)/;
    if (portfolioRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        portfolioRegex,
        `$1\n${portfolioProjectsHtml}\n$3`
      );
    }

    const clientsRegex =
      /(<!-- CLIENTS_START -->)([\s\S]*?)(<!-- CLIENTS_END -->)/;
    if (clientsRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(clientsRegex, `$1\n${clientsHtml}\n$3`);
    }

    // Remplacer les filtres de catégories
    const categoryFiltersRegex =
      /(<!-- CATEGORY_FILTERS_START -->)([\s\S]*?)(<!-- CATEGORY_FILTERS_END -->)/;
    if (categoryFiltersRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        categoryFiltersRegex,
        `$1\n${categoryFiltersHtml}\n$3`
      );
    }

    const categorySelectRegex =
      /(<!-- CATEGORY_SELECT_START -->)([\s\S]*?)(<!-- CATEGORY_SELECT_END -->)/;
    if (categorySelectRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(
        categorySelectRegex,
        `$1\n${categorySelectHtml}\n$3`
      );
    }

    const blogsRegex = /(<!-- BLOGS_START -->)([\s\S]*?)(<!-- BLOGS_END -->)/;
    if (blogsRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(blogsRegex, `$1\n${blogsHtml}\n$3`);
    }

    await fs.writeFile("public/index.html", htmlContent, "utf8");
    console.log("Fichier HTML mis à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du fichier HTML:", error);
  }
}

// Route pour vérifier les mises à jour
app.get("/api/last-update", (req, res) => {
  res.json({
    updated: false, // Logique pour détecter les changements
    timestamp: lastUpdate,
  });
});

// Route pour servir la page d'administration
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// Route pour servir la page principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Portfolio: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});

module.exports = app;
