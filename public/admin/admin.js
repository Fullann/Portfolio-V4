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
        alert(
          "Erreur lors de l'opération. Regarder la console pour plus d'informations."
        );
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

let editingCategory = null;

// Gestion des catégories
document
  .getElementById("category-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("category-name").value;
    const displayName = document.getElementById("category-display").value;

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, displayName }),
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById("category-form").reset();
        document.getElementById("category-submit-btn").textContent =
          "Ajouter Catégorie";
        editingCategory = null;
        loadCategories();
        loadCategoryOptions();
        alert(
          "Catégorie " +
            (editingCategory ? "modifiée" : "ajoutée") +
            " avec succès!"
        );
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'opération");
    }
  });

// Charger les catégories
async function loadCategories() {
  try {
    const response = await fetch("/api/categories");
    const categories = await response.json();

    const categoriesList = document.getElementById("categories-list");
    categoriesList.innerHTML = "<h3>Catégories existantes</h3>";
    categories.forEach((category) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "project-item";
      categoryDiv.innerHTML = `
                <h4>${category.display_name}</h4>
                <p><strong>Nom technique:</strong> ${category.name}</p>
                <div style="margin-top: 10px;">
                    <button onclick="editCategory(${category.id})" class="btn-edit">Modifier</button>
                    <button onclick="deleteCategory(${category.id})" class="btn-delete">Supprimer</button>
                </div>
            `;
      categoriesList.appendChild(categoryDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Charger les options de catégories dans le select
async function loadCategoryOptions() {
  try {
    const response = await fetch("/api/categories");
    const categories = await response.json();

    const categorySelect = document.getElementById("portfolio-category");
    categorySelect.innerHTML =
      '<option value="">Sélectionner une catégorie</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.name;
      option.textContent = category.display_name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier une catégorie
async function editCategory(id) {
  try {
    const response = await fetch("/api/categories");
    const categories = await response.json();
    const category = categories.find((c) => c.id === id);

    if (category) {
      document.getElementById("category-name").value = category.name;
      document.getElementById("category-display").value = category.display_name;
      document.getElementById("category-submit-btn").textContent =
        "Modifier Catégorie";
      editingCategory = id;

      document
        .getElementById("category-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer une catégorie
async function deleteCategory(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie?")) {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        loadCategories();
        loadCategoryOptions();
        alert("Catégorie supprimée avec succès!");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler la modification d'une catégorie
function cancelEditCategory() {
  document.getElementById("category-form").reset();
  document.getElementById("category-submit-btn").textContent =
    "Ajouter Catégorie";
  editingCategory = null;
}

let editingBlog = null;

// Gestion des blogs
document.getElementById("blog-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", document.getElementById("blog-title").value);
  formData.append("category", document.getElementById("blog-category").value);
  formData.append("excerpt", document.getElementById("blog-excerpt").value);
  formData.append("content", document.getElementById("blog-content").value);
  formData.append("author", document.getElementById("blog-author").value);

  const imageFile = document.getElementById("blog-image").files[0];
  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {
    const url = editingBlog ? `/api/blogs/${editingBlog}` : "/api/blogs";
    const method = editingBlog ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      document.getElementById("blog-form").reset();
      document.getElementById("blog-submit-btn").textContent = "Ajouter Blog";
      editingBlog = null;
      loadBlogs();
      alert("Blog " + (editingBlog ? "modifié" : "ajouté") + " avec succès!");
    } else {
      alert("Erreur lors de l'opération");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
});

// Charger les blogs
async function loadBlogs() {
  try {
    const response = await fetch("/api/blogs");
    const blogs = await response.json();

    const blogsList = document.getElementById("blogs-list");
    blogsList.innerHTML = "<h3>Blogs existants</h3>";

    blogs.forEach((blog) => {
      const blogDiv = document.createElement("div");
      blogDiv.className = "project-item";
      blogDiv.innerHTML = `
                <h4>${blog.title}</h4>
                <p><strong>Catégorie:</strong> ${blog.category}</p>
                <p><strong>Auteur:</strong> ${blog.author}</p>
                <p><strong>Date:</strong> ${blog.date}</p>
                <p><strong>Extrait:</strong> ${blog.excerpt}</p>
                <p><strong>Lien:</strong> <a href="/blog/${
                  blog.slug
                }" target="_blank">Voir le blog</a></p>
                ${
                  blog.image
                    ? `<img src="${blog.image}" alt="${blog.title}" style="max-width: 100px; margin: 10px 0;">`
                    : ""
                }
                <div style="margin-top: 10px;">
                    <button onclick="editBlog(${
                      blog.id
                    })" class="btn-edit">Modifier</button>
                    <button onclick="deleteBlog(${
                      blog.id
                    })" class="btn-delete">Supprimer</button>
                </div>
            `;
      blogsList.appendChild(blogDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier un blog
async function editBlog(id) {
  try {
    const response = await fetch("/api/blogs");
    const blogs = await response.json();
    const blog = blogs.find((b) => b.id === id);

    if (blog) {
      document.getElementById("blog-title").value = blog.title;
      document.getElementById("blog-category").value = blog.category;
      document.getElementById("blog-excerpt").value = blog.excerpt;
      document.getElementById("blog-content").value = blog.content;
      document.getElementById("blog-author").value = blog.author;
      document.getElementById("blog-submit-btn").textContent = "Modifier Blog";
      editingBlog = id;

      document
        .getElementById("blog-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer un blog
async function deleteBlog(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce blog?")) {
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadBlogs();
        alert("Blog supprimé avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler la modification d'un blog
function cancelEditBlog() {
  document.getElementById("blog-form").reset();
  document.getElementById("blog-submit-btn").textContent = "Ajouter Blog";
  editingBlog = null;
}

// Supprimer toutes les données
async function deleteAllData() {
  const confirmation = prompt(
    'ATTENTION! Cette action supprimera TOUTES vos données.\nTapez "SUPPRIMER TOUT" pour confirmer:'
  );

  if (confirmation === "SUPPRIMER TOUT") {
    try {
      const response = await fetch("/api/delete-all", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert("Toutes les données ont été supprimées avec succès!");
        // Recharger toutes les listes
        loadProjects();
        loadTestimonials();
        loadPortfolioProjects();
        loadClients();
        loadCategories();
        loadBlogs();
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    }
  } else {
    alert("Suppression annulée");
  }
}

let editingSocial = null;

// Gestion des informations personnelles
// Modifiez la gestion des informations personnelles
document
  .getElementById("personal-info-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("personal-name").value);
    formData.append("title", document.getElementById("personal-title").value);
    formData.append("email", document.getElementById("personal-email").value);
    formData.append("phone", document.getElementById("personal-phone").value);
    formData.append(
      "birthday",
      document.getElementById("personal-birthday").value
    );
    formData.append(
      "location",
      document.getElementById("personal-location").value
    );
    formData.append(
      "aboutText",
      document.getElementById("personal-about").value
    );

    const avatarFile = document.getElementById("personal-avatar").files[0];
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const cvFile = document.getElementById("personal-cv").files[0];
    if (cvFile) {
      formData.append("cv", cvFile);
    }

    try {
      const response = await fetch("/api/personal-info", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Informations personnelles mises à jour avec succès!");
        loadPersonalInfo();
      } else {
        const errorData = await response.json();
        alert("Erreur: " + errorData.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    }
  });

// Modifiez loadPersonalInfo pour inclure le CV
async function loadPersonalInfo() {
  try {
    const response = await fetch("/api/personal-info");
    const info = await response.json();

    document.getElementById("personal-name").value = info.name;
    document.getElementById("personal-title").value = info.title;
    document.getElementById("personal-email").value = info.email;
    document.getElementById("personal-phone").value = info.phone;
    document.getElementById("personal-birthday").value = info.birthday;
    document.getElementById("personal-location").value = info.location;
    document.getElementById("personal-about").value = info.aboutText.join("\n");

    // Afficher l'avatar actuel
    if (info.avatar) {
      const avatarInput = document.getElementById("personal-avatar");
      avatarInput.parentNode.querySelector(
        "small"
      ).textContent = `Avatar actuel : ${info.avatar
        .split("/")
        .pop()}. Sélectionnez un nouveau fichier pour le remplacer.`;
    }

    // Afficher le CV actuel
    const cvInfo = document.getElementById("current-cv-info");
    if (info.cvFile) {
      cvInfo.style.display = "block";
    } else {
      cvInfo.style.display = "none";
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Fonction pour voir le CV actuel
function viewCurrentCV() {
  window.open("/documents", "_blank");
}

// Gestion des liens sociaux
document.getElementById("social-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const socialData = {
    name: document.getElementById("social-name").value,
    icon: document.getElementById("social-icon").value,
    url: document.getElementById("social-url").value,
  };

  try {
    const url = editingSocial
      ? `/api/social-links/${editingSocial}`
      : "/api/social-links";
    const method = editingSocial ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(socialData),
    });

    if (response.ok) {
      document.getElementById("social-form").reset();
      document.getElementById("social-submit-btn").textContent =
        "Ajouter Lien Social";
      editingSocial = null;
      loadSocialLinks();
      alert(
        "Lien social " +
          (editingSocial ? "modifié" : "ajouté") +
          " avec succès!"
      );
    } else {
      alert("Erreur lors de l'opération");
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
});

// Charger les liens sociaux
async function loadSocialLinks() {
  try {
    const response = await fetch("/api/social-links");
    const socialLinks = await response.json();

    const socialList = document.getElementById("social-links-list");
    socialList.innerHTML = "<h3>Liens Sociaux existants</h3>";

    socialLinks.forEach((social) => {
      const socialDiv = document.createElement("div");
      socialDiv.className = "project-item";
      socialDiv.innerHTML = `
                <h4>${social.name}</h4>
                <p><strong>Icône:</strong> <ion-icon name="${social.icon}"></ion-icon> ${social.icon}</p>
                <p><strong>URL:</strong> <a href="${social.url}" target="_blank">Visiter</a></p>
                <div style="margin-top: 10px;">
                    <button onclick="editSocial(${social.id})" class="btn-edit">Modifier</button>
                    <button onclick="deleteSocial(${social.id})" class="btn-delete">Supprimer</button>
                </div>
            `;
      socialList.appendChild(socialDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier un lien social
async function editSocial(id) {
  try {
    const response = await fetch("/api/social-links");
    const socialLinks = await response.json();
    const social = socialLinks.find((s) => s.id === id);

    if (social) {
      document.getElementById("social-name").value = social.name;
      document.getElementById("social-icon").value = social.icon;
      document.getElementById("social-url").value = social.url;
      document.getElementById("social-submit-btn").textContent =
        "Modifier Lien Social";
      editingSocial = id;

      document
        .getElementById("social-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer un lien social
async function deleteSocial(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce lien social?")) {
    try {
      const response = await fetch(`/api/social-links/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadSocialLinks();
        alert("Lien social supprimé avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler la modification d'un lien social
function cancelEditSocial() {
  document.getElementById("social-form").reset();
  document.getElementById("social-submit-btn").textContent =
    "Ajouter Lien Social";
  editingSocial = null;
}
let editingEducation = null;
let editingExperience = null;

// Gestion de l'éducation
document
  .getElementById("education-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const educationData = {
      institution: document.getElementById("education-institution").value,
      period: document.getElementById("education-period").value,
      description: document.getElementById("education-description").value,
    };

    try {
      const url = editingEducation
        ? `/api/education/${editingEducation}`
        : "/api/education";
      const method = editingEducation ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(educationData),
      });

      if (response.ok) {
        document.getElementById("education-form").reset();
        document.getElementById("education-submit-btn").textContent =
          "Ajouter Formation";
        editingEducation = null;
        loadEducation();
        alert(
          "Formation " +
            (editingEducation ? "modifiée" : "ajoutée") +
            " avec succès!"
        );
      } else {
        alert("Erreur lors de l'opération");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  });

// Gestion de l'expérience
document
  .getElementById("experience-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const experienceData = {
      position: document.getElementById("experience-position").value,
      period: document.getElementById("experience-period").value,
      description: document.getElementById("experience-description").value,
    };

    try {
      const url = editingExperience
        ? `/api/experience/${editingExperience}`
        : "/api/experience";
      const method = editingExperience ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(experienceData),
      });

      if (response.ok) {
        document.getElementById("experience-form").reset();
        document.getElementById("experience-submit-btn").textContent =
          "Ajouter Expérience";
        editingExperience = null;
        loadExperience();
        alert(
          "Expérience " +
            (editingExperience ? "modifiée" : "ajoutée") +
            " avec succès!"
        );
      } else {
        alert("Erreur lors de l'opération");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  });

// Charger l'éducation
async function loadEducation() {
  try {
    const response = await fetch("/api/education");
    const education = await response.json();

    const educationList = document.getElementById("education-list");
    educationList.innerHTML = "<h3>Formations existantes</h3>";

    education.forEach((edu) => {
      const eduDiv = document.createElement("div");
      eduDiv.className = "project-item";
      eduDiv.innerHTML = `
                <h4>${edu.institution}</h4>
                <p><strong>Période:</strong> ${edu.period}</p>
                <p><strong>Description:</strong> ${edu.description}</p>
                <div style="margin-top: 10px;">
                    <button onclick="editEducation(${edu.id})" class="btn-edit">Modifier</button>
                    <button onclick="deleteEducation(${edu.id})" class="btn-delete">Supprimer</button>
                </div>
            `;
      educationList.appendChild(eduDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Charger l'expérience
async function loadExperience() {
  try {
    const response = await fetch("/api/experience");
    const experience = await response.json();

    const experienceList = document.getElementById("experience-list");
    experienceList.innerHTML = "<h3>Expériences existantes</h3>";

    experience.forEach((exp) => {
      const expDiv = document.createElement("div");
      expDiv.className = "project-item";
      expDiv.innerHTML = `
                <h4>${exp.position}</h4>
                <p><strong>Période:</strong> ${exp.period}</p>
                <p><strong>Description:</strong> ${exp.description}</p>
                <div style="margin-top: 10px;">
                    <button onclick="editExperience(${exp.id})" class="btn-edit">Modifier</button>
                    <button onclick="deleteExperience(${exp.id})" class="btn-delete">Supprimer</button>
                </div>
            `;
      experienceList.appendChild(expDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier une formation
async function editEducation(id) {
  try {
    const response = await fetch("/api/education");
    const education = await response.json();
    const edu = education.find((e) => e.id === id);

    if (edu) {
      document.getElementById("education-institution").value = edu.institution;
      document.getElementById("education-period").value = edu.period;
      document.getElementById("education-description").value = edu.description;
      document.getElementById("education-submit-btn").textContent =
        "Modifier Formation";
      editingEducation = id;

      document
        .getElementById("education-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier une expérience
async function editExperience(id) {
  try {
    const response = await fetch("/api/experience");
    const experience = await response.json();
    const exp = experience.find((e) => e.id === id);

    if (exp) {
      document.getElementById("experience-position").value = exp.position;
      document.getElementById("experience-period").value = exp.period;
      document.getElementById("experience-description").value = exp.description;
      document.getElementById("experience-submit-btn").textContent =
        "Modifier Expérience";
      editingExperience = id;

      document
        .getElementById("experience-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer une formation
async function deleteEducation(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette formation?")) {
    try {
      const response = await fetch(`/api/education/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadEducation();
        alert("Formation supprimée avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Supprimer une expérience
async function deleteExperience(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette expérience?")) {
    try {
      const response = await fetch(`/api/experience/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadExperience();
        alert("Expérience supprimée avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler les modifications
function cancelEditEducation() {
  document.getElementById("education-form").reset();
  document.getElementById("education-submit-btn").textContent =
    "Ajouter Formation";
  editingEducation = null;
}

function cancelEditExperience() {
  document.getElementById("experience-form").reset();
  document.getElementById("experience-submit-btn").textContent =
    "Ajouter Expérience";
  editingExperience = null;
}

let editingSkill = null;

// Fonction de déconnexion
function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter?")) {
    localStorage.removeItem("adminToken");
    token = null;
    document.getElementById("login-section").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";

    // Réinitialiser les formulaires
    document.getElementById("login-form").reset();
    alert("Déconnexion réussie!");
  }
}

// Gestion des compétences
document.getElementById("skill-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const skillData = {
    name: document.getElementById("skill-name").value,
    percentage: document.getElementById("skill-percentage").value,
  };

  try {
    const url = editingSkill ? `/api/skills/${editingSkill}` : "/api/skills";
    const method = editingSkill ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(skillData),
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("skill-form").reset();
      document.getElementById("skill-submit-btn").textContent =
        "Ajouter Compétence";
      editingSkill = null;
      loadSkills();
      alert(
        "Compétence " +
          (editingSkill ? "modifiée" : "ajoutée") +
          " avec succès!"
      );
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur lors de l'opération");
  }
});

// Charger les compétences
async function loadSkills() {
  try {
    const response = await fetch("/api/skills");
    const skills = await response.json();

    const skillsList = document.getElementById("skills-list");
    skillsList.innerHTML = "<h3>Compétences existantes</h3>";

    skills.forEach((skill) => {
      const skillDiv = document.createElement("div");
      skillDiv.className = "project-item";
      skillDiv.innerHTML = `
                <h4>${skill.name}</h4>
                <div style="margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><strong>Niveau:</strong> ${skill.percentage}%</span>
                    </div>
                    <div style="background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: #007bff; height: 100%; width: ${skill.percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="editSkill(${skill.id})" class="btn-edit">Modifier</button>
                    <button onclick="deleteSkill(${skill.id})" class="btn-delete">Supprimer</button>
                </div>
            `;
      skillsList.appendChild(skillDiv);
    });
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Modifier une compétence
async function editSkill(id) {
  try {
    const response = await fetch("/api/skills");
    const skills = await response.json();
    const skill = skills.find((s) => s.id === id);

    if (skill) {
      document.getElementById("skill-name").value = skill.name;
      document.getElementById("skill-percentage").value = skill.percentage;
      document.getElementById("skill-submit-btn").textContent =
        "Modifier Compétence";
      editingSkill = id;

      document
        .getElementById("skill-form")
        .scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer une compétence
async function deleteSkill(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette compétence?")) {
    try {
      const response = await fetch(`/api/skills/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadSkills();
        alert("Compétence supprimée avec succès!");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
}

// Annuler la modification d'une compétence
function cancelEditSkill() {
  document.getElementById("skill-form").reset();
  document.getElementById("skill-submit-btn").textContent =
    "Ajouter Compétence";
  editingSkill = null;
}

// Charger les informations du compte admin
async function loadAccountInfo() {
  try {
    const response = await fetch("/api/admin/account-info", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const accountInfo = await response.json();
      document.getElementById("current-username").textContent =
        accountInfo.username;

      if (accountInfo.created_at) {
        const created = new Date(accountInfo.created_at).toLocaleDateString(
          "fr-FR"
        );
        document.getElementById("account-created").textContent = created;
      } else {
        document.getElementById("account-created").textContent = "Inconnue";
      }

      // Pré-remplir le formulaire
      document.getElementById("new-username").value = accountInfo.username;
    }
  } catch (error) {
    console.error(
      "Erreur lors du chargement des informations du compte:",
      error
    );
  }
}

// Gestion du formulaire de mise à jour du nom d'utilisateur
document
  .getElementById("account-update-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const newUsername = document.getElementById("new-username").value.trim();

    if (!newUsername) {
      alert("Le nom d'utilisateur ne peut pas être vide");
      return;
    }

    try {
      const response = await fetch("/api/admin/update-account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newUsername,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Nom d'utilisateur mis à jour avec succès !");

        // Mettre à jour le token si fourni
        if (data.newToken) {
          token = data.newToken;
          localStorage.setItem("adminToken", token);
        }

        // Recharger les informations
        await loadAccountInfo();
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    }
  });

// Gestion du formulaire de changement de mot de passe
document
  .getElementById("password-change-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      alert("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Mot de passe changé avec succès !");
        document.getElementById("password-change-form").reset();
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du changement de mot de passe");
    }
  });

// Mettre à jour la fonction de chargement initial
if (token) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-panel").style.display = "block";
  loadProjects();
  loadTestimonials();
  loadPortfolioProjects();
  loadClients();
  loadCategories();
  loadCategoryOptions();
  loadBlogs();
  loadPersonalInfo();
  loadSocialLinks();
  loadEducation();
  loadExperience();
  loadSkills();
  loadAccountInfo();
}
