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

// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
};

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector(
      "[data-testimonials-title]"
    ).innerHTML;
    modalText.innerHTML = this.querySelector(
      "[data-testimonials-text]"
    ).innerHTML;

    testimonialsModalFunc();
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
  for (let i = 0; i < filterItems.length; i++) {
    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }
  }
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

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }
  });
}
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
