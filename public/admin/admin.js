let token = localStorage.getItem("adminToken");
let editingProject = null;
let editingTestimonial = null;

// Gestion de la connexion
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      token = data.token;
      localStorage.setItem("adminToken", token);
      document.getElementById("login-section").style.display = "none";
      document.getElementById("admin-panel").style.display = "block";
      loadProjects();
      loadTestimonials();
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur de connexion");
  }
});


// Gestion des projets
document
  .getElementById("project-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", document.getElementById("project-title").value);
    formData.append(
      "category",
      document.getElementById("project-category").value
    );
    formData.append(
      "description",
      document.getElementById("project-description").value
    );

    const imageFile = document.getElementById("project-image").files[0];
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = editingProject
        ? `/api/projects/${editingProject}`
        : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        document.getElementById("project-form").reset();
        document.getElementById("project-submit-btn").textContent =
          "Ajouter Projet";
        editingProject = null;
        loadProjects();
        alert(
          editingProject
            ? "Projet modifié avec succès!"
            : "Projet ajouté avec succès!"
        );
      } else {
        alert("Erreur lors de l'opération");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  });

// Gestion des témoignages
document
  .getElementById("testimonial-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("testimonial-name").value);
    formData.append("text", document.getElementById("testimonial-text").value);

    const avatarFile = document.getElementById("testimonial-avatar").files[0];
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const url = editingTestimonial
        ? `/api/testimonials/${editingTestimonial}`
        : "/api/testimonials";
      const method = editingTestimonial ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        document.getElementById("testimonial-form").reset();
        document.getElementById("testimonial-submit-btn").textContent =
          "Ajouter Témoignage";
        editingTestimonial = null;
        loadTestimonials();
        alert(
          editingTestimonial
            ? "Témoignage modifié avec succès!"
            : "Témoignage ajouté avec succès!"
        );
      } else {
        alert("Erreur lors de l'opération");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  });

// Charger les projets
async function loadProjects() {
  try {
    const response = await fetch("/api/projects");
    const projects = await response.json();

    const projectsList = document.getElementById("projects-list");
    projectsList.innerHTML = "<h3>Projets existants</h3>";

    projects.forEach((project) => {
      const projectDiv = document.createElement("div");
      projectDiv.className = "project-item";
      projectDiv.innerHTML = `
                <h4>${project.title}</h4>
                <p><strong>Catégorie:</strong> ${project.category}</p>
                <p><strong>Description:</strong> ${project.description}</p>
                ${
                  project.image
                    ? `<img src="${project.image}" alt="${project.title}" style="max-width: 100px; margin: 10px 0;">`
                    : ""
                }
                <div style="margin-top: 10px;">
                    <button onclick="editProject(${
                      project.id
                    })" class="btn-edit">Modifier</button>
                    <button onclick="deleteProject(${
                      project.id
                    })" class="btn-delete">Supprimer</button>
                </div>
            `;
      projectsList.appendChild(projectDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Charger les témoignages
async function loadTestimonials() {
  try {
    const response = await fetch("/api/testimonials");
    const testimonials = await response.json();

    const testimonialsList = document.getElementById("testimonials-list");
    testimonialsList.innerHTML = "<h3>Témoignages existants</h3>";

    testimonials.forEach((testimonial) => {
      const testimonialDiv = document.createElement("div");
      testimonialDiv.className = "testimonial-item";
      testimonialDiv.innerHTML = `
                <h4>${testimonial.name}</h4>
                <p>${testimonial.text}</p>
                ${
                  testimonial.avatar
                    ? `<img src="${testimonial.avatar}" alt="${testimonial.name}" style="max-width: 50px; border-radius: 50%; margin: 10px 0;">`
                    : ""
                }
                <div style="margin-top: 10px;">
                    <button onclick="editTestimonial(${
                      testimonial.id
                    })" class="btn-edit">Modifier</button>
                    <button onclick="deleteTestimonial(${
                      testimonial.id
                    })" class="btn-delete">Supprimer</button>
                </div>
            `;
      testimonialsList.appendChild(testimonialDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier un projet
async function editProject(id) {
  try {
    const response = await fetch("/api/projects");
    const projects = await response.json();
    const project = projects.find((p) => p.id === id);

    if (project) {
      document.getElementById("project-title").value = project.title;
      document.getElementById("project-category").value = project.category;
      document.getElementById("project-description").value =
        project.description;
      document.getElementById("project-submit-btn").textContent =
        "Modifier Projet";
      editingProject = id;

      // Scroll vers le formulaire
      document
        .getElementById("project-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier un témoignage
async function editTestimonial(id) {
  try {
    const response = await fetch("/api/testimonials");
    const testimonials = await response.json();
    const testimonial = testimonials.find((t) => t.id === id);

    if (testimonial) {
      document.getElementById("testimonial-name").value = testimonial.name;
      document.getElementById("testimonial-text").value = testimonial.text;
      document.getElementById("testimonial-submit-btn").textContent =
        "Modifier Témoignage";
      editingTestimonial = id;

      // Scroll vers le formulaire
      document
        .getElementById("testimonial-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Annuler la modification d'un projet
function cancelEditProject() {
  document.getElementById("project-form").reset();
  document.getElementById("project-submit-btn").textContent = "Ajouter Projet";
  editingProject = null;
}

// Annuler la modification d'un témoignage
function cancelEditTestimonial() {
  document.getElementById("testimonial-form").reset();
  document.getElementById("testimonial-submit-btn").textContent =
    "Ajouter Témoignage";
  editingTestimonial = null;
}

// Supprimer un projet
async function deleteProject(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce projet?")) {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadProjects();
        alert("Projet supprimé avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Supprimer un témoignage
async function deleteTestimonial(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce témoignage?")) {
    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadTestimonials();
        alert("Témoignage supprimé avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

let editingPortfolioProject = null;

// Gestion du portfolio
document
  .getElementById("portfolio-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", document.getElementById("portfolio-title").value);
    formData.append(
      "category",
      document.getElementById("portfolio-category").value
    );
    formData.append(
      "description",
      document.getElementById("portfolio-description").value
    );
    formData.append(
      "repoLink",
      document.getElementById("portfolio-repo").value
    );
    formData.append(
      "liveLink",
      document.getElementById("portfolio-live").value
    );
    formData.append(
      "filterCategory",
      document.getElementById("portfolio-category").value
    );

    const imageFile = document.getElementById("portfolio-image").files[0];
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = editingPortfolioProject
        ? `/api/portfolio-projects/${editingPortfolioProject}`
        : "/api/portfolio-projects";
      const method = editingPortfolioProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        document.getElementById("portfolio-form").reset();
        document.getElementById("portfolio-submit-btn").textContent =
          "Ajouter au Portfolio";
        editingPortfolioProject = null;
        loadPortfolioProjects();
        alert(
          "Projet portfolio " +
            (editingPortfolioProject ? "modifié" : "ajouté") +
            " avec succès!"
        );
      } else {
        alert("Erreur lors de l'opération");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  });

// Charger les projets portfolio
async function loadPortfolioProjects() {
  try {
    const response = await fetch("/api/portfolio-projects");
    const projects = await response.json();

    const portfolioList = document.getElementById("portfolio-list");
    portfolioList.innerHTML = "<h3>Projets Portfolio</h3>";

    projects.forEach((project) => {
      const projectDiv = document.createElement("div");
      projectDiv.className = "project-item";
      projectDiv.innerHTML = `
                <h4>${project.title}</h4>
                <p><strong>Catégorie:</strong> ${project.category}</p>
                <p><strong>Description:</strong> ${project.description}</p>
                <p><strong>Repo:</strong> ${
                  project.repoLink
                    ? `<a href="${project.repoLink}" target="_blank">Voir le code</a>`
                    : "Non défini"
                }</p>
                <p><strong>Site:</strong> ${
                  project.liveLink
                    ? `<a href="${project.liveLink}" target="_blank">Voir le site</a>`
                    : "Non défini"
                }</p>
                ${
                  project.image
                    ? `<img src="${project.image}" alt="${project.title}" style="max-width: 100px; margin: 10px 0;">`
                    : ""
                }
                <div style="margin-top: 10px;">
                    <button onclick="editPortfolioProject(${
                      project.id
                    })" class="btn-edit">Modifier</button>
                    <button onclick="deletePortfolioProject(${
                      project.id
                    })" class="btn-delete">Supprimer</button>
                </div>
            `;
      portfolioList.appendChild(projectDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier un projet portfolio
async function editPortfolioProject(id) {
  try {
    const response = await fetch("/api/portfolio-projects");
    const projects = await response.json();
    const project = projects.find((p) => p.id === id);

    if (project) {
      document.getElementById("portfolio-title").value = project.title;
      document.getElementById("portfolio-category").value = project.category;
      document.getElementById("portfolio-description").value =
        project.description;
      document.getElementById("portfolio-repo").value = project.repoLink || "";
      document.getElementById("portfolio-live").value = project.liveLink || "";
      document.getElementById("portfolio-submit-btn").textContent =
        "Modifier Projet Portfolio";
      editingPortfolioProject = id;

      document
        .getElementById("portfolio-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer un projet portfolio
async function deletePortfolioProject(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce projet du portfolio?")) {
    try {
      const response = await fetch(`/api/portfolio-projects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadPortfolioProjects();
        alert("Projet portfolio supprimé avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler la modification d'un projet portfolio
function cancelEditPortfolio() {
  document.getElementById("portfolio-form").reset();
  document.getElementById("portfolio-submit-btn").textContent =
    "Ajouter au Portfolio";
  editingPortfolioProject = null;
}

let editingClient = null;

// Gestion des clients
document.getElementById("client-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", document.getElementById("client-name").value);
  formData.append("website", document.getElementById("client-website").value);
  formData.append(
    "description",
    document.getElementById("client-description").value
  );

  const logoFile = document.getElementById("client-logo").files[0];
  if (logoFile) {
    formData.append("logo", logoFile);
  }

  try {
    const url = editingClient
      ? `/api/clients/${editingClient}`
      : "/api/clients";
    const method = editingClient ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      document.getElementById("client-form").reset();
      document.getElementById("client-submit-btn").textContent =
        "Ajouter Client";
      editingClient = null;
      loadClients();
      alert(
        "Client " + (editingClient ? "modifié" : "ajouté") + " avec succès!"
      );
    } else {
      alert("Erreur lors de l'opération");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
});

// Charger les clients
async function loadClients() {
  try {
    const response = await fetch("/api/clients");
    const clients = await response.json();

    const clientsList = document.getElementById("clients-list");
    clientsList.innerHTML = "<h3>Clients existants</h3>";

    clients.forEach((client) => {
      const clientDiv = document.createElement("div");
      clientDiv.className = "project-item";
      clientDiv.innerHTML = `
                <h4>${client.name}</h4>
                <p><strong>Site web:</strong> ${
                  client.website
                    ? `<a href="${client.website}" target="_blank">Visiter</a>`
                    : "Non défini"
                }</p>
                <p><strong>Description:</strong> ${
                  client.description || "Non définie"
                }</p>
                ${
                  client.logo
                    ? `<img src="${client.logo}" alt="${client.name}" style="max-width: 100px; margin: 10px 0;">`
                    : ""
                }
                <div style="margin-top: 10px;">
                    <button onclick="editClient(${
                      client.id
                    })" class="btn-edit">Modifier</button>
                    <button onclick="deleteClient(${
                      client.id
                    })" class="btn-delete">Supprimer</button>
                </div>
            `;
      clientsList.appendChild(clientDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier un client
async function editClient(id) {
  try {
    const response = await fetch("/api/clients");
    const clients = await response.json();
    const client = clients.find((c) => c.id === id);

    if (client) {
      document.getElementById("client-name").value = client.name;
      document.getElementById("client-website").value = client.website || "";
      document.getElementById("client-description").value =
        client.description || "";
      document.getElementById("client-submit-btn").textContent =
        "Modifier Client";
      editingClient = id;

      // Afficher un message pour l'image
      const logoInput = document.getElementById("client-logo");
      logoInput.parentNode.querySelector("small").textContent =
        "Logo actuel conservé. Sélectionnez un nouveau fichier pour le remplacer.";

      document
        .getElementById("client-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer un client
async function deleteClient(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce client?")) {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadClients();
        alert("Client supprimé avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler la modification d'un client
function cancelEditClient() {
  document.getElementById("client-form").reset();
  document.getElementById("client-submit-btn").textContent = "Ajouter Client";
  editingClient = null;

  // Remettre le message par défaut
  const logoInput = document.getElementById("client-logo");
  logoInput.parentNode.querySelector("small").textContent =
    "Laissez vide lors de la modification pour conserver le logo actuel";
}

// Mettre à jour la fonction de chargement initial
if (token) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-panel").style.display = "block";
  loadProjects();
  loadTestimonials();
  loadPortfolioProjects();
  loadClients(); // Ajoutez cette ligne
}
