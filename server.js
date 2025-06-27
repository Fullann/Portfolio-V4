const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

    await fs.writeFile("public/index.html", htmlContent, "utf8");
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

// Mettre à jour le timestamp lors des modifications
// Ajoutez ceci dans vos routes POST/PUT/DELETE
lastUpdate = Date.now();

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
