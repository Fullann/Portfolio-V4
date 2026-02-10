"use strict";

// Element toggle function
const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

// Sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// Sidebar toggle functionality for mobile
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

// Add click event to all modal items (témoignages)
for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    const avatar = this.querySelector("[data-testimonials-avatar]");
    const title = this.querySelector("[data-testimonials-title]");
    const text = this.querySelector("[data-testimonials-text]");

    if (avatar && title && text && modalImg && modalTitle && modalText) {
      modalImg.src = avatar.src;
      modalImg.alt = avatar.alt;
      modalTitle.innerHTML = title.innerHTML;
      modalText.innerHTML = text.innerHTML;

      testimonialsModalFunc();
    }
  });
}

// Add click event to modal close button
if (modalCloseBtn)
  modalCloseBtn.addEventListener("click", testimonialsModalFunc);
if (overlay) overlay.addEventListener("click", testimonialsModalFunc);

// Custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

if (select) {
  select.addEventListener("click", function () {
    elementToggleFunc(this);
  });
}

// Add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);
  });
}

// Filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {
  filterItems.forEach((item) => {
    const cleanSelectedValue = selectedValue.toLowerCase().trim();

    if (
      cleanSelectedValue === "all" ||
      cleanSelectedValue === "tout" ||
      cleanSelectedValue === "tous"
    ) {
      item.classList.add("active");
      item.style.display = "block";
    } else if (
      item.dataset.category &&
      item.dataset.category.toLowerCase() === cleanSelectedValue
    ) {
      item.classList.add("active");
      item.style.display = "block";
    } else {
      item.classList.remove("active");
      item.style.display = "none";
    }
  });

  const visibleItems = document.querySelectorAll("[data-filter-item].active");
  console.log(`${visibleItems.length} projets visibles`);
};

// Add event in all filter button items for large screen
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

// Afficher tous les projets dès le chargement de la page
window.addEventListener("load", function () {
  console.log("🔄 Initialisation du filtre portfolio...");

  setTimeout(() => {
    filterFunc("all");
    console.log("✅ Tous les projets affichés");
  }, 100);
});

// CONTACT FORM
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// Add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}

// ============================================
// PAGE NAVIGATION
// ============================================

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navigationLinks.forEach((link) => {
  link.addEventListener("click", function () {
    const linkText = this.innerHTML.toLowerCase().trim();

    pages.forEach((page) => {
      const pageData = page.dataset.page.toLowerCase();

      const matches = {
        "à propos": "à propos",
        parcours: "parcours",
        portfolio: "portfolio",
        blog: "blog",
        contact: "contact",
      };

      if (matches[linkText] === pageData) {
        page.classList.add("active");
        link.classList.add("active");
        window.scrollTo(0, 0);

        // Réinitialiser le filtre quand on arrive sur Portfolio
        if (pageData === "portfolio") {
          console.log(
            "📂 Page Portfolio ouverte, affichage de tous les projets...",
          );
          setTimeout(() => {
            filterFunc("all");

            if (filterBtn.length > 0) {
              filterBtn.forEach((btn) => btn.classList.remove("active"));
              filterBtn[0].classList.add("active");
            }
          }, 50);
        }

        // 🔥 NOUVEAU : Réattacher les événements de clic sur les projets
        if (pageData === "à propos" || pageData === "portfolio") {
          setTimeout(attachProjectClickEvents, 100);
        }
      } else {
        page.classList.remove("active");
      }
    });

    navigationLinks.forEach((navLink) => {
      if (navLink !== link) {
        navLink.classList.remove("active");
      }
    });
  });
});

// ============================================
// THEME MANAGER
// ============================================

class ThemeManager {
  constructor() {
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.currentTheme = localStorage.getItem("theme") || "dark";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

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
        "(prefers-color-scheme: dark)",
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
  location.reload();
}

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

// ============================================
// GESTION DU FORMULAIRE DE CONTACT
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("[data-form]");
  const formBtn = document.querySelector("[data-form-btn]");
  const formInputs = document.querySelectorAll("[data-form-input]");

  if (!form || !formBtn || formInputs.length === 0) {
    console.warn("Formulaire de contact non trouvé");
    return;
  }

  new ThemeManager();

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("mouseenter", () => {
      themeBtn.style.transform = "scale(1.1) rotate(10deg)";
    });
    themeBtn.addEventListener("mouseleave", () => {
      themeBtn.style.transform = "scale(1) rotate(0deg)";
    });
  }

  formInputs.forEach((input) => {
    input.addEventListener("input", function () {
      let allValid = true;
      formInputs.forEach((inp) => {
        if (!inp.value.trim()) {
          allValid = false;
        }
      });
      formBtn.disabled = !allValid;
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const originalButtonHTML = formBtn.innerHTML;
    formBtn.disabled = true;
    formBtn.innerHTML =
      '<ion-icon name="hourglass-outline"></ion-icon><span>Envoi en cours...</span>';

    try {
      if (typeof grecaptcha === "undefined") {
        throw new Error("reCAPTCHA non chargé. Veuillez recharger la page.");
      }

      console.log("Obtention du token reCAPTCHA...");

      const recaptchaToken = await grecaptcha.execute(
        "6LcQAmMsAAAAAEoyH4PTxuPChxiAaaAzDBuNByyE",
        { action: "contact" },
      );

      console.log(
        "Token reCAPTCHA obtenu:",
        recaptchaToken.substring(0, 20) + "...",
      );

      const formData = new FormData(form);
      const data = {
        fullname: formData.get("fullname"),
        email: formData.get("email"),
        message: formData.get("message"),
        "g-recaptcha-response": recaptchaToken,
      };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "✅ Message envoyé avec succès ! Je vous répondrai dans les plus brefs délais.",
        );
        form.reset();
        formBtn.disabled = true;
      } else {
        console.error("Erreur serveur:", result);
        if (response.status === 429) {
          alert(
            "⚠️ Trop de tentatives d'envoi. Veuillez ressayer dans quelques minutes.",
          );
        } else if (response.status === 403) {
          alert("⚠️ Activité suspecte détectée. Veuillez ressayer.");
        } else {
          alert("❌ Erreur: " + result.error);
        }
      }
    } catch (error) {
      console.error("Erreur complète:", error);

      if (error.message && error.message.includes("reCAPTCHA")) {
        alert("❌ Erreur de sécurité. Veuillez recharger la page et ressayer.");
      } else {
        alert(
          "❌ Erreur lors de l'envoi du message. Veuillez vérifier votre connexion et ressayer.",
        );
      }
    } finally {
      formBtn.innerHTML = originalButtonHTML;

      let allValid = true;
      formInputs.forEach((inp) => {
        if (!inp.value.trim()) {
          allValid = false;
        }
      });
      formBtn.disabled = !allValid;
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

// ============================================
// 📁 MODAL PROJETS PORTFOLIO (UNIFIÉ)
// ============================================

// Variables de la modal projets
const projectModalContainer = document.querySelector("[data-project-modal-container]");
const projectModalCloseBtn = document.querySelector("[data-project-modal-close-btn]");
const projectOverlay = document.querySelector("[data-project-overlay]");

// Éléments de contenu de la modal
const projectModalImg = document.querySelector("[data-project-modal-img]");
const projectModalTitle = document.querySelector("[data-project-modal-title]");
const projectModalCategory = document.querySelector("[data-project-modal-category]");
const projectModalDescription = document.querySelector("[data-project-modal-description]");
const projectModalActions = document.querySelector("[data-project-modal-actions]");

console.log('🔍 Éléments de la modal trouvés:', {
  container: !!projectModalContainer,
  img: !!projectModalImg,
  title: !!projectModalTitle,
  category: !!projectModalCategory,
  description: !!projectModalDescription,
  actions: !!projectModalActions,
  overlay: !!projectOverlay
});

// Fonction pour ouvrir/fermer la modal projets
const projectModalFunc = function () {
  if (projectModalContainer && projectOverlay) {
    const wasActive = projectModalContainer.classList.contains("active");
    
    projectModalContainer.classList.toggle("active");
    projectOverlay.classList.toggle("active");
    
    console.log(`📱 Modal ${wasActive ? 'fermée' : 'ouverte'}`);
    
    // Force l'affichage
    if (!wasActive) {
      projectModalContainer.style.display = 'flex';
      projectOverlay.style.display = 'block';
    } else {
      setTimeout(() => {
        projectModalContainer.style.display = 'none';
        projectOverlay.style.display = 'none';
      }, 300);
    }
  } else {
    console.error('❌ Éléments de modal manquants:', {
      container: !!projectModalContainer,
      overlay: !!projectOverlay
    });
  }
};

// 🔥 FONCTION POUR ATTACHER LES ÉVÉNEMENTS DE CLIC SUR TOUS LES PROJETS
function attachProjectClickEvents() {
  // Sélectionner TOUS les projets (À propos + Portfolio)
  const allProjectItems = document.querySelectorAll("[data-project-item]");
  
  console.log(`🎯 ${allProjectItems.length} projets trouvés pour la modal`);
  
  allProjectItems.forEach((item, index) => {
    // Supprimer l'ancien événement pour éviter les doublons
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    newItem.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`🖱️ Clic sur projet #${index}`);
      
      // Empêcher l'ouverture si on clique sur les boutons d'action
      if (e.target.closest('.project-action-btn')) {
        console.log('⏭️ Clic sur bouton d\'action, ignorer');
        return;
      }

      // Récupérer les données du projet
      const image = this.querySelector("[data-project-image]");
      const title = this.querySelector("[data-project-title]");
      const category = this.querySelector("[data-project-category]");
      const description = this.querySelector("[data-project-description]");
      const repoLink = this.querySelector("[data-project-repo-link]");
      const liveLink = this.querySelector("[data-project-live-link]");

      console.log('📦 Données récupérées:', {
        image: !!image,
        imageSrc: image?.src,
        title: title?.textContent,
        category: category?.textContent,
        description: description?.textContent,
        repoLink: repoLink?.textContent,
        liveLink: liveLink?.textContent
      });

      if (image && title && category) {
        // Mettre à jour l'image
        if (projectModalImg) {
          projectModalImg.src = image.src;
          projectModalImg.alt = image.alt || title.textContent;
          console.log('🖼️ Image mise à jour:', projectModalImg.src);
        } else {
          console.warn('⚠️ projectModalImg introuvable');
        }

        // Mettre à jour le titre
        if (projectModalTitle) {
          projectModalTitle.textContent = title.textContent;
          console.log('📝 Titre mis à jour:', projectModalTitle.textContent);
        } else {
          console.warn('⚠️ projectModalTitle introuvable');
        }

        // Mettre à jour la catégorie
        if (projectModalCategory) {
          projectModalCategory.textContent = category.textContent;
          console.log('🏷️ Catégorie mise à jour:', projectModalCategory.textContent);
        } else {
          console.warn('⚠️ projectModalCategory introuvable');
        }

        // Mettre à jour la description
        if (projectModalDescription) {
          const descriptionText = description?.textContent || 'Aucune description disponible';
          projectModalDescription.innerHTML = `<p>${descriptionText}</p>`;
          console.log('📄 Description mise à jour');
        } else {
          console.warn('⚠️ projectModalDescription introuvable');
        }

        // Générer les boutons d'action
        if (projectModalActions) {
          let actionsHTML = "";

          if (repoLink && repoLink.textContent.trim()) {
            actionsHTML += `<a href="${repoLink.textContent}" target="_blank" class="project-modal-btn">
              <ion-icon name="logo-github"></ion-icon>
              <span>Voir le code</span>
            </a>`;
          }

          if (liveLink && liveLink.textContent.trim()) {
            actionsHTML += `<a href="${liveLink.textContent}" target="_blank" class="project-modal-btn secondary">
              <ion-icon name="eye-outline"></ion-icon>
              <span>Voir le site</span>
            </a>`;
          }

          if (!actionsHTML) {
            actionsHTML = '<p style="color: #888; font-size: 14px;">Aucun lien disponible</p>';
          }

          projectModalActions.innerHTML = actionsHTML;
          console.log('🔗 Actions mises à jour');
        } else {
          console.warn('⚠️ projectModalActions introuvable');
        }

        // Ouvrir la modal
        projectModalFunc();
        console.log('✅ Modal ouverte avec succès');
      } else {
        console.error('⚠️ Données manquantes pour ouvrir la modal:', {
          image: !!image,
          title: !!title,
          category: !!category
        });
      }
    });
  });
}

// Attacher les événements au chargement initial
window.addEventListener('load', function() {
  console.log('🚀 Initialisation de la modal projets...');
  setTimeout(() => {
    attachProjectClickEvents();
  }, 200);
});

// Fermer la modal avec le bouton X
if (projectModalCloseBtn) {
  projectModalCloseBtn.addEventListener("click", function(e) {
    e.preventDefault();
    console.log('❌ Fermeture via bouton');
    projectModalFunc();
  });
}

// Fermer la modal en cliquant sur l'overlay
if (projectOverlay) {
  projectOverlay.addEventListener("click", function(e) {
    if (e.target === projectOverlay) {
      console.log('❌ Fermeture via overlay');
      projectModalFunc();
    }
  });
}

// Fermer la modal avec la touche Escape
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (projectModalContainer && projectModalContainer.classList.contains("active")) {
      console.log('❌ Fermeture via Escape');
      projectModalFunc();
    }
  }
});

console.log("✅ Script initialisé avec support modal unifié");
