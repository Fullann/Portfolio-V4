"use strict";

function escapeHtmlClient(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

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
  // Update toggle button label based on state
  const isActive = sidebar.classList.contains("active");
  const textKey = isActive ? "sidebar.contacts_hide" : "sidebar.contacts_show";
  const span = this.querySelector("span[data-i18n]");
  if (span) {
    span.setAttribute("data-i18n", textKey);
    if (translations && translations[textKey]) {
      span.textContent = translations[textKey];
    }
  }
});

// 🔔 FONCTION NOTIFICATION TOAST ANIMÉE
function showToast(message, type = 'success', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  toast.innerHTML = `
    <span class="custom-toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="custom-toast-message">${message}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }, duration);
}

// ✨ SCROLL REVEAL ANIMATION
function initScrollReveal() {
  const revealElements = document.querySelectorAll(
    ".service-item, .testimonials-item, .project-item, .timeline-item, .skills-item, .clients-item, [data-reveal]"
  );

  revealElements.forEach((el) => {
    el.setAttribute("data-reveal", "");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
  );

  revealElements.forEach((el) => observer.observe(el));
}

// 📊 SCROLL PROGRESS BAR
function initScrollProgressBar() {
  let bar = document.getElementById("scroll-progress-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "scroll-progress-bar";
    bar.className = "scroll-progress-bar";
    document.body.appendChild(bar);
  }

  window.addEventListener("scroll", () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    bar.style.width = scrolled + "%";
  });
}

// 🌐 SYSTÈME I18N PUBLIC
let activeLanguages = [];
let currentLang = localStorage.getItem("portfolio_lang") || "fr";
let translations = {};

async function initI18n() {
  try {
    const resLangs = await fetch("/api/i18n/languages");
    if (resLangs.ok) {
      activeLanguages = await resLangs.json();
    }
    await loadTranslations(currentLang);
    renderLangSelector();
  } catch (error) {
    console.error("Erreur init i18n:", error);
  }
}

async function loadTranslations(langCode) {
  try {
    const resTrans = await fetch(`/api/i18n/translations/${langCode}`);
    if (resTrans.ok) {
      translations = await resTrans.json();
      currentLang = langCode;
      localStorage.setItem("portfolio_lang", langCode);
      applyTranslations();
      renderLangSelector();
    }
  } catch (error) {
    console.error("Erreur chargement traductions:", error);
  }
}

function applyTranslations() {
  // 1. Textes (textContent)
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[key] !== undefined) {
      el.textContent = translations[key];
    }
  });

  // 1.5 HTML (innerHTML) — échappement XSS par paragraphe tout en conservant les éléments enfants (CTA / badges)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (translations[key] !== undefined && translations[key] !== null) {
      const val = String(translations[key]);
      const paragraphs = val.split('\n\n').filter(Boolean);
      // Préserver le badge de disponibilité et les boutons CTA s'ils sont présents dans .about-text
      const availabilityBadge = el.querySelector(".availability-badge");
      const ctaGroup = el.querySelector(".cta-group");
      const formattedHTML = paragraphs.map(p => `<p>${escapeHtmlClient(p)}</p>`).join('');
      el.innerHTML = formattedHTML;
      if (availabilityBadge) el.appendChild(availabilityBadge);
      if (ctaGroup) el.appendChild(ctaGroup);
    }
  });
  
  // 1.6 Sources (src)
  document.querySelectorAll("[data-i18n-src]").forEach((el) => {
    const key = el.getAttribute("data-i18n-src");
    if (translations[key] !== undefined && translations[key] !== "") {
      el.src = translations[key];
    }
  });

  // 1.7 Href (links)
  document.querySelectorAll("[data-i18n-href]").forEach((el) => {
    const key = el.getAttribute("data-i18n-href");
    if (translations[key] !== undefined && translations[key] !== "") {
      el.href = translations[key];
    }
  });

  // 2. Placeholders (inputs, textareas)
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[key] !== undefined) {
      el.placeholder = translations[key];
    }
  });

  // 3. Aria-labels
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (translations[key] !== undefined) {
      el.setAttribute("aria-label", translations[key]);
    }
  });

  // 4. Update blog links with ?lang parameter
  document.querySelectorAll('a[href^="/blog/"]').forEach((el) => {
    try {
      const url = new URL(el.href);
      url.searchParams.set("lang", currentLang);
      el.href = url.pathname + url.search;
    } catch (e) {
      console.error(e);
    }
  });

  // 5. Mettre à jour l'attribut lang du document
  document.documentElement.lang = currentLang;
}

function renderLangSelector() {
  const container = document.getElementById("lang-selector");
  if (!container) return;

  const listToRender = activeLanguages && activeLanguages.length > 0
    ? activeLanguages
    : [{ code: 'fr', name: 'Français' }, { code: 'en', name: 'English' }];

  container.innerHTML = listToRender
    .map(
      (l) => `
      <button
        type="button"
        onclick="switchLanguage('${l.code}')"
        class="lang-btn ${l.code === currentLang ? "active" : ""}"
        title="${l.name || l.code.toUpperCase()}"
      >
        ${l.code.toUpperCase()}
      </button>
    `
    )
    .join("");
}

function switchLanguage(code) {
  if (code !== currentLang) {
    loadTranslations(code);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initScrollProgressBar();
  initI18n();
  if (document.getElementById("theme-toggle-btn")) {
    new ThemeManager();
  }
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

// Filter variables (cibler uniquement la liste du Portfolio pour ne pas masquer les projets de l'onglet À propos)
const filterItems = document.querySelectorAll("#portfolio-project-list [data-filter-item]");

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
  setTimeout(() => {
    filterFunc("all");
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
// PAGE NAVIGATION & ROUTAGE PAR HASH URL
// ============================================

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

const HASH_TO_PAGE = {
  about: "à propos",
  "a-propos": "à propos",
  "à propos": "à propos",
  parcours: "parcours",
  resume: "parcours",
  portfolio: "portfolio",
  blog: "blog",
  contact: "contact",
};

const PAGE_TO_HASH = {
  "à propos": "",
  parcours: "#parcours",
  portfolio: "#portfolio",
  blog: "#blog",
  contact: "#contact",
};

function activatePage(target, updateHistory = true) {
  const normalizedTarget = (target || "").toLowerCase().trim();
  let matched = false;

  pages.forEach((page) => {
    const pageData = page.dataset.page.toLowerCase();

    if (normalizedTarget === pageData) {
      matched = true;
      page.classList.add("active");
      window.scrollTo(0, 0);

      // Réinitialiser le filtre quand on arrive sur Portfolio
      if (pageData === "portfolio") {
        setTimeout(() => {
          filterFunc("all");

          if (filterBtn.length > 0) {
            filterBtn.forEach((btn) => btn.classList.remove("active"));
            filterBtn[0].classList.add("active");
          }
        }, 50);
      }

      // S'assurer que les événements de clic sur les projets sont attachés
      if (pageData === "à propos" || pageData === "portfolio") {
        setTimeout(attachProjectClickEvents, 100);
      }
    } else {
      page.classList.remove("active");
    }
  });

  if (!matched) return;

  navigationLinks.forEach((navLink) => {
    const linkTarget = (navLink.dataset.navTarget || navLink.innerHTML).toLowerCase().trim();
    if (linkTarget === normalizedTarget) {
      navLink.classList.add("active");
    } else {
      navLink.classList.remove("active");
    }
  });

  if (updateHistory && window.history && window.history.replaceState) {
    const newHash = PAGE_TO_HASH[normalizedTarget] ?? "";
    const newUrl = window.location.pathname + window.location.search + newHash;
    window.history.replaceState(null, "", newUrl);
  }
}

navigationLinks.forEach((link) => {
  link.addEventListener("click", function () {
    const target = this.dataset.navTarget || this.innerHTML.toLowerCase().trim();
    activatePage(target, true);
  });
});

function handleInitialHashNavigation() {
  const rawHash = decodeURIComponent(window.location.hash || "")
    .replace(/^#/, "")
    .toLowerCase()
    .trim();
  if (rawHash && HASH_TO_PAGE[rawHash]) {
    activatePage(HASH_TO_PAGE[rawHash], false);
  }
}

window.addEventListener("DOMContentLoaded", handleInitialHashNavigation);
window.addEventListener("hashchange", handleInitialHashNavigation);

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

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  setInterval(() => {
    fetch("/api/admin/last-update")
      .then((response) => response.json())
      .then((data) => {
        if (data.updated) {
          refreshSections();
        }
      })
      .catch(() => console.debug("Pas de mise à jour"));
  }, 30000);
}

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

  const trackEvent = (eventName, params = {}) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
      } else {
        const key = "portfolio_events";
        const previous = JSON.parse(localStorage.getItem(key) || "[]");
        previous.push({
          event: eventName,
          params,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(key, JSON.stringify(previous.slice(-50)));
      }
    } catch (e) {
      console.debug("Tracking non disponible");
    }
  };

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("mouseenter", () => {
      themeBtn.style.transform = "scale(1.1) rotate(10deg)";
    });
    themeBtn.addEventListener("mouseleave", () => {
      themeBtn.style.transform = "scale(1) rotate(0deg)";
    });
  }

  // Initialiser la sitekey hCaptcha depuis le backend ou l'attribut data-sitekey
  const hcaptchaWidget = document.getElementById("hcaptcha-widget") || document.querySelector(".h-captcha");
  if (hcaptchaWidget) {
    const renderWidget = (sitekey) => {
      if (!sitekey || !sitekey.trim()) return;
      hcaptchaWidget.setAttribute("data-sitekey", sitekey.trim());

      let attempts = 0;
      const tryRender = () => {
        if (typeof hcaptcha !== "undefined" && typeof hcaptcha.render === "function") {
          try {
            if (!hcaptchaWidget.hasChildNodes()) {
              hcaptcha.render(hcaptchaWidget, { sitekey: sitekey.trim() });
            }
          } catch (e) {
            // Déjà rendu
          }
        } else if (attempts < 50) {
          attempts++;
          setTimeout(tryRender, 100);
        }
      };
      tryRender();
    };

    const initialKey = hcaptchaWidget.getAttribute("data-sitekey");
    if (initialKey && initialKey.trim()) {
      renderWidget(initialKey);
    } else {
      fetch("/api/settings/public/hcaptcha-sitekey")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sitekey) {
            renderWidget(data.sitekey);
          }
        })
        .catch((err) =>
          console.warn("Impossible de charger la sitekey hCaptcha:", err)
        );
    }
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
      let hcaptchaToken = "";
      if (typeof hcaptcha !== "undefined") {
        hcaptchaToken = hcaptcha.getResponse();
      }
      if (!hcaptchaToken) {
        const formDataObj = new FormData(form);
        hcaptchaToken = formDataObj.get("h-captcha-response") || "";
      }

      const formData = new FormData(form);
      const data = {
        fullname: formData.get("fullname"),
        email: formData.get("email"),
        message: formData.get("message"),
        "h-captcha-response": hcaptchaToken,
      };

      const response = await fetch("/api/auth/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        trackEvent("contact_form_submit_success", { source: "contact_form" });
        showToast(
          "Message envoyé avec succès ! Je vous répondrai dans les plus brefs délais.",
          "success"
        );
        form.reset();
        if (typeof hcaptcha !== "undefined") {
          hcaptcha.reset();
        }
        formBtn.disabled = true;
      } else {
        trackEvent("contact_form_submit_error", {
          source: "contact_form",
          status: response.status,
        });
        console.error("Erreur serveur:", result);
        if (typeof hcaptcha !== "undefined") {
          hcaptcha.reset();
        }
        if (response.status === 429) {
          showToast(
            "Trop de tentatives d'envoi. Veuillez réessayer dans quelques minutes.",
            "warning"
          );
        } else if (response.status === 403) {
          showToast("Activité suspecte détectée. Veuillez réessayer.", "warning");
        } else {
          let serverMessage = result?.message || result?.error || "Erreur serveur";
          if (Array.isArray(result?.details)) {
            serverMessage = result.details.map(d => d.message || d.field).join(", ");
          } else if (typeof result?.details === "string") {
            serverMessage = result.details;
          }
          showToast(
            "L'envoi du message a échoué : " + serverMessage,
            "error"
          );
        }
      }
    } catch (error) {
      trackEvent("contact_form_submit_exception", { source: "contact_form" });
      console.error("Erreur complète:", error);

      if (typeof hcaptcha !== "undefined") {
        hcaptcha.reset();
      }

      if (error.message && error.message.includes("CAPTCHA")) {
        showToast("Erreur de sécurité CAPTCHA. Veuillez recharger la page et réessayer.", "error");
      } else {
        showToast(
          "Erreur lors de l'envoi du message. Veuillez vérifier votre connexion et réessayer.",
          "error"
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

document.addEventListener("DOMContentLoaded", function () {
  const trackEvent = (eventName, params = {}) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
      }
    } catch (e) {
      console.debug("Tracking CTA non disponible");
    }
  };

  const revealTargets = document.querySelectorAll(
    ".about-text, .service, .testimonials, .clients, .timeline, .skill, .projects, .blog-posts, .mapbox, .contact-form",
  );

  revealTargets.forEach((element) => {
    element.setAttribute("data-reveal", "");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  revealTargets.forEach((element) => observer.observe(element));

  // Naviguer vers une page par data-nav-target (invariant selon la langue)
  const goToPage = (targetPage) => {
    // Chercher par data-nav-target d'abord (insensible à la langue)
    let navLink = Array.from(document.querySelectorAll("[data-nav-link]")).find(
      (button) => button.dataset.navTarget === targetPage
    );
    // Fallback : chercher par texte (compatibilité si data-nav-target absent)
    if (!navLink) {
      navLink = Array.from(document.querySelectorAll("[data-nav-link]")).find(
        (button) =>
          button.textContent.trim().toLowerCase() === targetPage.toLowerCase()
      );
    }
    if (navLink) navLink.click();
  };

  const contactCta = document.querySelector("[data-contact-cta]");
  if (contactCta) {
    contactCta.addEventListener("click", () => {
      trackEvent("cta_click_contact", { location: "about_section" });
      goToPage("contact");
    });
  }

  const portfolioCta = document.querySelector("[data-portfolio-cta]");
  if (portfolioCta) {
    portfolioCta.addEventListener("click", () => {
      trackEvent("cta_click_portfolio", { location: "about_section" });
      goToPage("portfolio");
    });
  }
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
const projectModalContainer = document.querySelector(
  "[data-project-modal-container]",
);
const projectModalCloseBtn = document.querySelector(
  "[data-project-modal-close-btn]",
);
const projectOverlay = document.querySelector("[data-project-overlay]");

// Éléments de contenu de la modal
const projectModalImg = document.querySelector("[data-project-modal-img]");
const projectModalTitle = document.querySelector("[data-project-modal-title]");
const projectModalCategory = document.querySelector(
  "[data-project-modal-category]",
);
const projectModalDescription = document.querySelector(
  "[data-project-modal-description]",
);
const projectModalActions = document.querySelector(
  "[data-project-modal-actions]",
);

// Fonction pour ouvrir/fermer la modal projets
const projectModalFunc = function () {
  if (projectModalContainer && projectOverlay) {
    const wasActive = projectModalContainer.classList.contains("active");

    projectModalContainer.classList.toggle("active");
    projectOverlay.classList.toggle("active");

    // Force l'affichage
    if (!wasActive) {
      projectModalContainer.style.display = "flex";
      projectOverlay.style.display = "block";
    } else {
      setTimeout(() => {
        projectModalContainer.style.display = "none";
        projectOverlay.style.display = "none";
      }, 300);
    }
  } else {
    console.error("❌ Éléments de modal manquants:", {
      container: !!projectModalContainer,
      overlay: !!projectOverlay,
    });
  }
};

// 🔥 FONCTION POUR ATTACHER LES ÉVÉNEMENTS DE CLIC SUR TOUS LES PROJETS
function attachProjectClickEvents() {
  // Sélectionner TOUS les projets (À propos + Portfolio)
  const allProjectItems = document.querySelectorAll("[data-project-item]");

  allProjectItems.forEach((item) => {
    // Éviter d'attacher l'événement plusieurs fois sans cloner le nœud (préserve les écouteurs Analytics)
    if (item.dataset.modalBound === "1") return;
    item.dataset.modalBound = "1";

    item.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Empêcher l'ouverture si on clique sur les boutons d'action
      if (e.target.closest(".project-action-btn")) {
        return;
      }

      // Récupérer les données du projet
      const image = this.querySelector("[data-project-image]");
      const title = this.querySelector("[data-project-title]");
      const category = this.querySelector("[data-project-category]");
      const description = this.querySelector("[data-project-description]");
      const repoLink = this.querySelector("[data-project-repo-link]");
      const liveLink = this.querySelector("[data-project-live-link]");

      if (image && title && category) {
        // Mettre à jour l'image
        if (projectModalImg) {
          projectModalImg.src = image.src;
          projectModalImg.alt = image.alt || title.textContent;
        } else {
          console.warn("⚠️ projectModalImg introuvable");
        }

        // Mettre à jour le titre
        if (projectModalTitle) {
          projectModalTitle.textContent = title.textContent;
        } else {
          console.warn("⚠️ projectModalTitle introuvable");
        }

        // Mettre à jour la catégorie
        if (projectModalCategory) {
          projectModalCategory.textContent = category.textContent;
        } else {
          console.warn("⚠️ projectModalCategory introuvable");
        }

        // Mettre à jour la description (échappée contre les injections XSS)
        if (projectModalDescription) {
          const descriptionText =
            description?.textContent || "Aucune description disponible";
          projectModalDescription.innerHTML = `<p>${escapeHtmlClient(descriptionText)}</p>`;
        } else {
          console.warn("⚠️ projectModalDescription introuvable");
        }

        // Générer les boutons d'action
        if (projectModalActions) {
          let actionsHTML = "";

          if (repoLink && repoLink.textContent.trim()) {
            actionsHTML += `<a href="${escapeHtmlClient(repoLink.textContent.trim())}" target="_blank" rel="noopener noreferrer" class="project-modal-btn">
              <ion-icon name="logo-github"></ion-icon>
              <span>Voir le code</span>
            </a>`;
          }

          if (liveLink && liveLink.textContent.trim()) {
            actionsHTML += `<a href="${escapeHtmlClient(liveLink.textContent.trim())}" target="_blank" rel="noopener noreferrer" class="project-modal-btn secondary">
              <ion-icon name="eye-outline"></ion-icon>
              <span>Voir le site</span>
            </a>`;
          }

          if (!actionsHTML) {
            actionsHTML =
              '<p style="color: #888; font-size: 14px;">Aucun lien disponible</p>';
          }

          projectModalActions.innerHTML = actionsHTML;
        } else {
          console.warn("⚠️ projectModalActions introuvable");
        }

        // Ouvrir la modal
        projectModalFunc();
      } else {
        console.error("⚠️ Données manquantes pour ouvrir la modal:", {
          image: !!image,
          title: !!title,
          category: !!category,
        });
      }
    });
  });
}

// Attacher les événements au chargement initial
window.addEventListener("load", function () {
  setTimeout(() => {
    attachProjectClickEvents();
  }, 200);
});

// Fermer la modal avec le bouton X
if (projectModalCloseBtn) {
  projectModalCloseBtn.addEventListener("click", function (e) {
    projectModalFunc();
  });
}

// Fermer la modal en cliquant sur l'overlay
if (projectOverlay) {
  projectOverlay.addEventListener("click", function (e) {
    if (e.target === projectOverlay) {
      projectModalFunc();
    }
  });
}

// Fermer la modal avec la touche Escape
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (
      projectModalContainer &&
      projectModalContainer.classList.contains("active")
    ) {
      projectModalFunc();
    }
  }
});

// ============================================
// PAGINATION DYNAMIQUE (PORTFOLIO & BLOG)
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // Config
  const ITEMS_PER_PAGE = 6;
  
  // Fonction de pagination générique
  function initPagination(listId, itemSelector, btnId, paginationContainerId) {
    const list = document.getElementById(listId);
    const btn = document.getElementById(btnId);
    const container = document.getElementById(paginationContainerId);
    
    if (!list || !btn || !container) return;
    
    // Obtenir tous les éléments éligibles (non filtrés pour le portfolio)
    let visibleItems = Array.from(list.querySelectorAll(itemSelector)).filter(
      item => !item.classList.contains("filtered-out")
    );
    
    // Si moins d'éléments que la limite, afficher tous les éléments éligibles et cacher le bouton
    if (visibleItems.length <= ITEMS_PER_PAGE) {
      visibleItems.forEach((item) => {
        item.style.display = "block";
        setTimeout(() => item.classList.add("revealed"), 50);
      });
      container.style.display = "none";
      return;
    }
    
    let currentPage = 1;
    
    // Fonction d'affichage basée sur la page
    const updateDisplay = () => {
      const maxIndex = currentPage * ITEMS_PER_PAGE;
      
      visibleItems.forEach((item, index) => {
        if (index < maxIndex) {
          item.style.display = "block";
          // Déclencher une légère animation
          setTimeout(() => item.classList.add("revealed"), 50);
        } else {
          item.style.display = "none";
        }
      });
      
      if (maxIndex >= visibleItems.length) {
        container.style.display = "none";
      } else {
        container.style.display = "block";
      }
    };
    
    // Initialiser
    updateDisplay();
    
    // Bouton Voir Plus (utiliser onclick pour éviter d'empiler les addEventListener à chaque filtrage)
    btn.onclick = () => {
      currentPage++;
      updateDisplay();
    };
  }

  // Initialisation Blog (avec recherche et filtre par catégorie)
  const applyBlogFilterAndPagination = () => {
    const searchInput = document.getElementById("blog-search-input");
    const activeCatBtn = document.querySelector("[data-blog-cat].active");
    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const selectedCat = activeCatBtn ? (activeCatBtn.dataset.blogCat || "all").toLowerCase().trim() : "all";
    const allBlogItems = document.querySelectorAll("#blog-posts-list [data-blog-item]");
    const emptyState = document.getElementById("blog-empty-state");

    let matchCount = 0;
    allBlogItems.forEach((item) => {
      item.classList.remove("filtered-out");
      const itemCat = (item.dataset.blogCategory || "").toLowerCase();
      const titleText = (item.querySelector(".blog-item-title")?.textContent || "").toLowerCase();
      const excerptText = (item.querySelector(".blog-text")?.textContent || "").toLowerCase();

      const matchesCat = selectedCat === "all" || itemCat === selectedCat;
      const matchesQuery = !query || titleText.includes(query) || excerptText.includes(query) || itemCat.includes(query);

      if (!matchesCat || !matchesQuery) {
        item.classList.add("filtered-out");
        item.style.display = "none";
      } else {
        matchCount++;
      }
    });

    if (emptyState) {
      emptyState.style.display = (allBlogItems.length > 0 && matchCount === 0) ? "block" : "none";
    }

    initPagination("blog-posts-list", "[data-blog-item]:not(.filtered-out)", "blog-load-more", "blog-pagination");
  };

  applyBlogFilterAndPagination();

  const blogSearchInput = document.getElementById("blog-search-input");
  if (blogSearchInput) {
    blogSearchInput.addEventListener("input", applyBlogFilterAndPagination);
  }

  const blogCatBtns = document.querySelectorAll("[data-blog-cat]");
  blogCatBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      blogCatBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      applyBlogFilterAndPagination();
    });
  });
  
  // Initialisation Portfolio
  // Le portfolio est plus complexe car filtrable. 
  // On doit l'intégrer au système de filtre existant.
  
  const originalFilterFunc = filterFunc; // On devrait hooker filterFunc mais ce n'est pas possible directement si elle est globale const.
  // On va surcharger le clic sur les boutons de filtre à la place.
  
  const filterBtns = document.querySelectorAll("[data-filter-btn]");
  const selectItems = document.querySelectorAll("[data-select-item]");
  
  const techBtns = document.querySelectorAll("[data-tech-tag]");
  
  const applyPortfolioPagination = () => {
    const allItems = document.querySelectorAll("#portfolio-project-list [data-filter-item]");
    
    const activeFilterBtn = document.querySelector("[data-filter-btn].active");
    const selectedCategory = activeFilterBtn ? activeFilterBtn.innerText.toLowerCase().trim() : "all";
    
    const activeTechBtn = document.querySelector("[data-tech-tag].active");
    const selectedTech = activeTechBtn ? activeTechBtn.dataset.techTag.toLowerCase().trim() : "all";
    
    allItems.forEach(item => {
      item.classList.remove("filtered-out");
      const itemCat = (item.dataset.category || "").toLowerCase();
      const itemTechs = (item.dataset.technologies || "").toLowerCase().split(",").map(t => t.trim());
      
      const matchesCat = (
        selectedCategory === "all" ||
        selectedCategory === "tout" ||
        selectedCategory === "tous" ||
        itemCat === selectedCategory
      );
      
      const matchesTech = (
        selectedTech === "all" ||
        selectedTech === "toutes" ||
        itemTechs.includes(selectedTech)
      );
      
      if (!matchesCat || !matchesTech) {
        item.classList.add("filtered-out");
        item.style.display = "none";
      }
    });
    
    initPagination("portfolio-project-list", "[data-filter-item]:not(.filtered-out)", "portfolio-load-more", "portfolio-pagination");
  };
  
  // Exécuter une première fois
  setTimeout(applyPortfolioPagination, 150);
  
  // Hooker sur les filtres de catégorie
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setTimeout(applyPortfolioPagination, 50);
    });
  });
  
  selectItems.forEach(item => {
    item.addEventListener("click", () => {
      setTimeout(applyPortfolioPagination, 50);
    });
  });

  // Hooker sur les tags de technologie
  techBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      techBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      setTimeout(applyPortfolioPagination, 50);
    });
  });
});

// ============================================
// 📈 ANALYTICS DISCRET & RESPECTUEUX DE LA VIE PRIVÉE (100% SANS COOKIE)
// ============================================
function initAnalytics() {
  function sendTrack(type, target = '') {
    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target }),
        keepalive: true
      }).catch(() => {});
    } catch (e) {}
  }

  // 1. Page view (une seule fois par session)
  if (!sessionStorage.getItem('pv_logged')) {
    sendTrack('page_view', window.location.pathname);
    sessionStorage.setItem('pv_logged', '1');
  }

  // 2. Clics sur le téléchargement de CV
  document.querySelectorAll('a[download], .cv-download-btn, .cv-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sendTrack('cv_download', 'CV_Document');
    });
  });

  // 3. Clics sur les projets
  document.querySelectorAll('[data-project-item]').forEach(item => {
    item.addEventListener('click', function() {
      const title = this.querySelector('[data-project-title]')?.textContent?.trim() || 'Projet';
      sendTrack('project_click', title);
    });
  });
}

// ============================================
// 🐙 ACTIVITÉ GITHUB & OPEN-SOURCE EN DIRECT
// ============================================
async function initGitHubWidget() {
  const widget = document.getElementById('github-widget');
  if (!widget) return;

  const username = widget.dataset.githubUser || 'Fullann';
  const grid = document.getElementById('github-repos-grid');
  const reposCountEl = document.getElementById('github-repos-count');
  const followersCountEl = document.getElementById('github-followers-count');
  const starsCountEl = document.getElementById('github-stars-count');
  const bioEl = document.getElementById('github-bio');
  const avatarEl = document.getElementById('github-avatar');

  const cacheKey = `gh_widget_cache_${username}`;
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  const renderGitHubData = (userData, repos) => {
    if (userData) {
      if (reposCountEl) reposCountEl.textContent = userData.public_repos ?? '-';
      if (followersCountEl) followersCountEl.textContent = userData.followers ?? '-';
      if (bioEl && userData.bio) bioEl.textContent = userData.bio;
      if (avatarEl && userData.avatar_url) avatarEl.src = userData.avatar_url;
    }

    // Calculer le total des étoiles sur l'ensemble des dépôts publics récupérés
    const totalStars = repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
    if (starsCountEl) starsCountEl.textContent = totalStars;

    // Filtrer pour afficher jusqu'à 4 dépôts pertinents (non-forks triés par mise à jour)
    const sortedRepos = [...repos].sort(
      (a, b) => new Date(b.pushed_at || b.updated_at || 0) - new Date(a.pushed_at || a.updated_at || 0)
    );
    const displayRepos = sortedRepos.filter(r => !r.fork).slice(0, 4);
    const finalRepos = displayRepos.length > 0 ? displayRepos : sortedRepos.slice(0, 4);

    if (grid) {
      if (finalRepos.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 text-sm col-span-full">Aucun dépôt public trouvé.</p>';
      } else {
        grid.innerHTML = finalRepos.map(repo => `
          <div class="github-repo-card">
            <div>
              <div class="github-repo-header">
                <a href="${escapeHtmlClient(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="github-repo-name">
                  <ion-icon name="folder-outline"></ion-icon>
                  <span>${escapeHtmlClient(repo.name)}</span>
                </a>
                <ion-icon name="open-outline" style="font-size: 14px; color: var(--light-gray-70);"></ion-icon>
              </div>
              <p class="github-repo-desc">${escapeHtmlClient(repo.description || 'Aucune description fournie.')}</p>
            </div>
            <div class="github-repo-meta">
              ${repo.language ? `
                <span class="github-repo-lang">
                  <span class="github-lang-dot"></span>
                  <span>${escapeHtmlClient(repo.language)}</span>
                </span>
              ` : ''}
              <span>⭐ ${Number(repo.stargazers_count) || 0}</span>
              <span>🍴 ${Number(repo.forks_count) || 0}</span>
            </div>
          </div>
        `).join('');
      }
    }
  };

  try {
    // 0. Vérifier le cache sessionStorage pour éviter le rate-limit GitHub (60 req/h)
    try {
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL_MS && Array.isArray(cached.repos)) {
          renderGitHubData(cached.userData, cached.repos);
          return;
        }
      }
    } catch {
      // Ignorer erreur de lecture sessionStorage
    }

    // 1. Récupération profil
    let userData = null;
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (userRes.ok) {
      userData = await userRes.json();
    }

    // 2. Récupération de l'ensemble des dépôts publics (jusqu'à 100 pour un total d'étoiles exact)
    const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`);
    if (!reposRes.ok) throw new Error('API GitHub indisponible');

    const repos = await reposRes.json();
    if (!Array.isArray(repos)) throw new Error('Format invalide');

    renderGitHubData(userData, repos);

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        userData,
        repos
      }));
    } catch {
      // Ignorer quota sessionStorage
    }
  } catch {
    if (grid) {
      const safeUser = escapeHtmlClient(username);
      grid.innerHTML = `
        <div class="col-span-full p-4 rounded-lg bg-dark-800 text-center text-sm text-gray-400">
          <p>Consultez mes contributions et dépôts directement sur <a href="https://github.com/${safeUser}" target="_blank" rel="noopener noreferrer" class="text-amber-400 underline">github.com/${safeUser}</a></p>
        </div>
      `;
    }
  }
}

// Démarrer les widgets interactifs et le Service Worker au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  initAnalytics();
  initGitHubWidget();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});


