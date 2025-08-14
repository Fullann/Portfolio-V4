"use strict";

// element toggle function
const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () {
  elementToggleFunc(sidebar);
});

// Testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// Modal variables
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// Modal toggle function
const testimonialsModalFunc = function () {
  if (modalContainer && overlay) {
    modalContainer.classList.toggle("active");
    overlay.classList.toggle("active");
  }
};

// Add click event to all modal items (témoignages ET projets)
for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    console.log('Clic détecté sur élément:', i); // Debug
    
    const avatar = this.querySelector("[data-testimonials-avatar]");
    const title = this.querySelector("[data-testimonials-title]");
    const text = this.querySelector("[data-testimonials-text]");
    
    console.log('Éléments trouvés:', { avatar, title, text }); // Debug
    
    if (avatar && title && text && modalImg && modalTitle && modalText) {
      modalImg.src = avatar.src;
      modalImg.alt = avatar.alt;
      modalTitle.innerHTML = title.innerHTML;
      modalText.innerHTML = text.innerHTML;
      testimonialsModalFunc();
      
      console.log('Modal ouverte'); // Debug
    } else {
      console.log('Éléments manquants pour la modal'); // Debug
    }
  });
}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);

// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () {
  elementToggleFunc(this);
});

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);
  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {
  filterItems.forEach((item) => {
    // Nettoyer la valeur sélectionnée
    const cleanSelectedValue = selectedValue.toLowerCase().trim();
    
    if (cleanSelectedValue === "all" || cleanSelectedValue === "tout" || cleanSelectedValue === "tous") {
      // Afficher tous les éléments
      item.classList.add("active");
      item.style.display = "block";
    } else if (item.dataset.category && item.dataset.category.toLowerCase() === cleanSelectedValue) {
      // Afficher les éléments de la catégorie sélectionnée
      item.classList.add("active");
      item.style.display = "block";
    } else {
      // Masquer les autres éléments
      item.classList.remove("active");
      item.style.display = "none";
    }
  });
  
  // Debug : compter les éléments visibles
  const visibleItems = document.querySelectorAll('[data-filter-item].active');
};


// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {
  filterBtn[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;
  });
}

// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// Add event to all nav links
navigationLinks.forEach((link) => {
  link.addEventListener("click", function () {
    const linkText = this.innerHTML.toLowerCase().trim();
    
    pages.forEach((page) => {
      const pageData = page.dataset.page.toLowerCase();
      
      // Correspondance des noms français
      const matches = {
        'à propos': 'à propos',
        'parcours': 'parcours', 
        'portfolio': 'portfolio',
        'blog': 'blog',
        'contact': 'contact'
      };
      
      if (matches[linkText] === pageData) {
        page.classList.add("active");
        link.classList.add("active");
        window.scrollTo(0, 0);
      } else {
        page.classList.remove("active");
        navigationLinks.forEach((navLink) => {
          if (navLink !== link) {
            navLink.classList.remove("active");
          }
        });
      }
    });
  });
});
class ThemeManager {
  constructor() {
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.currentTheme = localStorage.getItem("theme") || "dark";

    this.init();
  }

  init() {
    // Appliquer le thème sauvegardé
    this.applyTheme(this.currentTheme);

    // Écouter les clics sur le bouton
    this.themeToggleBtn.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Écouter les changements de préférence système
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (this.currentTheme === "auto") {
          this.applyTheme("auto");
        }
      });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(this.currentTheme);
    this.saveTheme();
  }

  applyTheme(theme) {
    const html = document.documentElement;

    if (theme === "light") {
      html.setAttribute("data-theme", "light");
    } else if (theme === "dark") {
      html.removeAttribute("data-theme");
    } else if (theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        html.removeAttribute("data-theme");
      } else {
        html.setAttribute("data-theme", "light");
      }
    }

    this.currentTheme = theme;
  }

  saveTheme() {
    localStorage.setItem("theme", this.currentTheme);
  }
}
function refreshSections() {
  // Recharger seulement les sections modifiées
  location.reload();
}

// Vérifier les mises à jour toutes les 30 secondes (optionnel)
setInterval(() => {
  fetch("/api/last-update")
    .then((response) => response.json())
    .then((data) => {
      if (data.updated) {
        refreshSections();
      }
    })
    .catch((error) => console.log("Pas de mise à jour"));
}, 30000);
// Gestion du formulaire de contact
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("[data-form]");
  const formBtn = document.querySelector("[data-form-btn]");
  const formInputs = document.querySelectorAll("[data-form-input]");

  new ThemeManager();
  const themeBtn = document.getElementById("theme-toggle-btn");

  themeBtn.addEventListener("mouseenter", () => {
    themeBtn.style.transform = "scale(1.1) rotate(10deg)";
  });

  themeBtn.addEventListener("mouseleave", () => {
    themeBtn.style.transform = "scale(1) rotate(0deg)";
  });
  // Activer/désactiver le bouton selon la validation
  formInputs.forEach((input) => {
    input.addEventListener("input", function () {
      let allValid = true;
      formInputs.forEach((inp) => {
        if (!inp.value.trim()) allValid = false;
      });
      formBtn.disabled = !allValid;
    });
  });

  // Gestion de l'envoi du formulaire
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      fullname: formData.get("fullname"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    formBtn.disabled = true;
    formBtn.innerHTML =
      '<ion-icon name="hourglass-outline"></ion-icon><span>Envoi...</span>';

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Message envoyé avec succès !");
        form.reset();
        formBtn.disabled = true;
      } else {
        alert("Erreur : " + result.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      formBtn.innerHTML =
        '<ion-icon name="paper-plane"></ion-icon><span>Send Message</span>';
    }
  });
});

function viewCVInline() {
  const viewer = document.getElementById("cv-viewer");
  if (viewer.style.display === "none") {
    viewer.style.display = "block";
    document.querySelector(".cv-view-btn span").textContent = "Masquer";
  } else {
    viewer.style.display = "none";
    document.querySelector(".cv-view-btn span").textContent = "Aperçu";
  }
}

// ========================================
// MODAL PROJETS PORTFOLIO
// ========================================

// Variables de la modal projets
const projectItems = document.querySelectorAll("[data-project-item]");
const projectModalContainer = document.querySelector("[data-project-modal-container]");
const projectModalCloseBtn = document.querySelector("[data-project-modal-close-btn]");
const projectOverlay = document.querySelector("[data-project-overlay]");

// Éléments de contenu de la modal
const projectModalImg = document.querySelector("[data-project-modal-img]");
const projectModalTitle = document.querySelector("[data-project-modal-title]");
const projectModalCategory = document.querySelector("[data-project-modal-category]");
const projectModalDescription = document.querySelector("[data-project-modal-description]");
const projectModalActions = document.querySelector("[data-project-modal-actions]");

// Fonction pour ouvrir/fermer la modal projets
const projectModalFunc = function () {
  if (projectModalContainer && projectOverlay) {
    projectModalContainer.classList.toggle("active");
    projectOverlay.classList.toggle("active");
  }
};

// Événements de clic sur les projets
if (projectItems) {
  projectItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      
      // Empêcher l'ouverture si on clique sur les boutons d'action
      if (e.target.closest('.project-action-btn')) {
        return;
      }
      
      // Récupérer les données du projet
      const image = this.querySelector("[data-project-image]");
      const title = this.querySelector("[data-project-title]");
      const category = this.querySelector("[data-project-category]");
      const description = this.querySelector("[data-project-description]");
      const repoLink = this.querySelector("[data-project-repo-link]");
      const liveLink = this.querySelector("[data-project-live-link]");
      
      if (image && title && category && description) {
        // Mettre à jour l'image
        if (projectModalImg) {
          projectModalImg.src = image.src;
          projectModalImg.alt = image.alt;
        }
        
        // Mettre à jour le titre
        if (projectModalTitle) {
          projectModalTitle.textContent = title.textContent;
        }
        
        // Mettre à jour la catégorie
        if (projectModalCategory) {
          projectModalCategory.textContent = category.textContent;
        }
        
        // Mettre à jour la description
        if (projectModalDescription) {
          projectModalDescription.innerHTML = `<p>${description.textContent}</p>`;
        }
        
        // Générer les boutons d'action
        if (projectModalActions) {
          let actionsHTML = '';
          
          if (repoLink && repoLink.textContent.trim()) {
            actionsHTML += `
              <a href="${repoLink.textContent}" target="_blank" class="project-modal-btn">
                <ion-icon name="logo-github"></ion-icon>
                <span>Voir le code</span>
              </a>`;
          }
          
          if (liveLink && liveLink.textContent.trim()) {
            actionsHTML += `
              <a href="${liveLink.textContent}" target="_blank" class="project-modal-btn secondary">
                <ion-icon name="eye-outline"></ion-icon>
                <span>Voir le site</span>
              </a>`;
          }
          
          projectModalActions.innerHTML = actionsHTML;
        }
        
        // Ouvrir la modal
        projectModalFunc();
      }
    });
  });
}

// Fermer la modal avec le bouton X
if (projectModalCloseBtn) {
  projectModalCloseBtn.addEventListener("click", projectModalFunc);
}

// Fermer la modal en cliquant sur l'overlay
if (projectOverlay) {
  projectOverlay.addEventListener("click", projectModalFunc);
}

// Fermer la modal avec la touche Escape
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && projectModalContainer && projectModalContainer.classList.contains("active")) {
    projectModalFunc();
  }
});

console.log('Modal projets initialisée:', {
  projectItems: projectItems.length,
  modalContainer: !!projectModalContainer,
  modalImg: !!projectModalImg,
  modalTitle: !!projectModalTitle
});
