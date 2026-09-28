const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { marked } = require('marked');
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');
const { escapeHtml } = require('../utils/sanitize');
const { toSlug } = require('../utils/slug');
const { normalizeGitHubUrl, normalizeGitHubUrlsInMarkdown } = require('../utils/githubHelper');

exports.getAllBlogs = catchAsync(async (req, res, _next) => {
  const blogs = await dbOperations.blogs.getAll();
  const normalizedBlogs = blogs.map(blog => ({
    ...blog,
    image: normalizeGitHubUrl(blog.image)
  }));
  res.json(normalizedBlogs);
});

exports.getBlogTranslations = catchAsync(async (req, res, _next) => {
  const { id } = req.params;
  const translations = await dbOperations.blogs.getTranslations(id);
  res.json(translations);
});

exports.getBlogBySlug = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const blog = await dbOperations.blogs.getBySlug(slug);

  if (!blog) {
    return next(new AppError('Blog non trouvé', 404));
  }

  const cleanContent = normalizeGitHubUrlsInMarkdown(blog.content || '');
  const blogWithHtml = {
    ...blog,
    image: normalizeGitHubUrl(blog.image),
    content: cleanContent,
    contentHtml: marked(cleanContent)
  };

  res.json(blogWithHtml);
});

exports.createBlog = catchAsync(async (req, res, _next) => {
  const { title, category, excerpt, content, author, translations, imageUrl, image: bodyImage } = req.body;
  let image = req.file ? `/assets/images/${req.file.filename}` : (imageUrl || bodyImage || null);
  if (image) {
    image = normalizeGitHubUrl(image);
  }

  const processedContent = normalizeGitHubUrlsInMarkdown(content || '');
  const slug = toSlug(title);

  const newBlog = await dbOperations.blogs.create({
    title,
    category,
    excerpt,
    content: processedContent,
    image,
    date: new Date().toISOString().split('T')[0],
    author: author || 'Admin',
    slug
  });

  if (translations && translations !== 'undefined' && translations !== 'null') {
    const parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
    await dbOperations.blogs.updateTranslations(newBlog.id, parsedTranslations);
  }

  await updateHtmlFile();
  res.json(newBlog);
});

exports.updateBlog = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, category, excerpt, content, author, translations, imageUrl, image: bodyImage } = req.body;

  const updateData = { title, category, excerpt, author };

  if (title) {
    updateData.slug = toSlug(title);
  }

  if (content !== undefined) {
    updateData.content = normalizeGitHubUrlsInMarkdown(content);
  }

  if (req.file) {
    updateData.image = `/assets/images/${req.file.filename}`;
  } else if (imageUrl !== undefined || bodyImage !== undefined) {
    const rawImage = imageUrl !== undefined ? imageUrl : bodyImage;
    updateData.image = rawImage ? normalizeGitHubUrl(rawImage) : null;
  }

  const updatedBlog = await dbOperations.blogs.update(id, updateData);
  if (!updatedBlog) {
    return next(new AppError('Blog non trouvé', 404));
  }

  if (translations && translations !== 'undefined' && translations !== 'null') {
    const parsedTranslations = typeof translations === 'string' ? JSON.parse(translations) : translations;
    await dbOperations.blogs.updateTranslations(id, parsedTranslations);
  }

  await updateHtmlFile();
  res.json(updatedBlog);
});

exports.deleteBlog = catchAsync(async (req, res, _next) => {
  const { id } = req.params;

  await dbOperations.blogs.delete(id);
  await updateHtmlFile();
  res.json({ success: true });
});

exports.renderBlogPage = catchAsync(async (req, res, _next) => {
  const { slug } = req.params;
  const { lang } = req.query;
  const blog = await dbOperations.blogs.getBySlug(slug);

  if (!blog) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Article introuvable | Portfolio</title>
  <link rel="shortcut icon" href="/assets/images/icon.ico" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle 600px at 50% 20%, rgba(255, 219, 112, 0.08), transparent 70%), #0b0b0e;
      color: #e4e4e7;
      font-family: 'Poppins', sans-serif;
      padding: 24px;
    }
    .notfound-card {
      background: linear-gradient(180deg, #18181d 0%, #121216 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 24px;
      padding: 56px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 30px 80px -20px rgba(0,0,0,0.8);
    }
    .notfound-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: rgba(255, 219, 112, 0.1);
      border: 1px solid rgba(255, 219, 112, 0.25);
      border-radius: 9999px;
      color: #ffdb70;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .notfound-code {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 5rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #ffdb70, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .notfound-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.45rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .notfound-text {
      color: #a1a1aa;
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .notfound-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #ffdb70 0%, #f59e0b 100%);
      color: #121214;
      font-weight: 700;
      padding: 13px 30px;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.25s ease;
      box-shadow: 0 8px 24px rgba(255, 219, 112, 0.25);
    }
    .notfound-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(255, 219, 112, 0.4);
    }
  </style>
</head>
<body>
  <div class="notfound-card">
    <div class="notfound-badge">Erreur de navigation</div>
    <div class="notfound-code">404</div>
    <h1 class="notfound-title">Article introuvable</h1>
    <p class="notfound-text">L'article demandé n'existe pas ou son adresse a été modifiée.</p>
    <a href="/#blog" class="notfound-btn">← Retour au portfolio</a>
  </div>
</body>
</html>`);
  }

  // Traductions éventuelles
  if (lang && lang !== 'fr') {
    const translations = await dbOperations.blogs.getTranslations(blog.id);
    if (translations && translations[lang]) {
      blog.title = translations[lang].title || blog.title;
      blog.excerpt = translations[lang].excerpt || blog.excerpt;
      blog.content = translations[lang].content || blog.content;
    }
  }

  // Normaliser le lien de l'image (convertir tout lien GitHub blob en raw)
  blog.image = normalizeGitHubUrl(blog.image);

  // Normaliser les liens GitHub dans le texte de l'article Markdown
  const rawContent = normalizeGitHubUrlsInMarkdown(blog.content || '');

  // Réglages globaux du site
  const siteSettings = await dbOperations.settings.getAll();
  const baseUrl = (siteSettings.base_url || 'http://localhost:3000').replace(/\/$/, '');
  const siteName = escapeHtml(siteSettings.site_name || 'Portfolio');
  const fullArticleUrl = `${baseUrl}/blog/${encodeURI(blog.slug)}`;
  const pageDescription = escapeHtml(blog.excerpt || blog.title);

  let blogImageUrl = blog.image
    ? (blog.image.startsWith('http') ? blog.image : `${baseUrl}/${blog.image.replace(/^\.\//, '')}`)
    : `${baseUrl}/og-image?title=${encodeURIComponent(blog.title)}`;

  // Convertir le markdown en HTML
  let contentHtml = marked(rawContent);

  // Construire un sommaire interactif à partir des titres <h2> et <h3>
  const tableOfContents = [];
  let headingCounter = 0;
  contentHtml = contentHtml.replace(/<h([23])>(.*?)<\/h\1>/gi, (_match, level, innerText) => {
    headingCounter++;
    const plainText = innerText.replace(/<[^>]*>/g, '').trim();
    const anchorId = `section-${toSlug(plainText) || headingCounter}`;
    tableOfContents.push({
      level: parseInt(level, 10),
      title: plainText,
      id: anchorId
    });
    return `<h${level} id="${anchorId}" class="article-heading article-heading-h${level}"><a href="#${anchorId}" class="heading-anchor" aria-label="Lien vers la section ${escapeHtml(plainText)}">#</a><span>${innerText}</span></h${level}>`;
  });

  // Améliorer l'affichage des alertes et notes de style blockquote (> [!NOTE], etc.)
  contentHtml = contentHtml
    .replace(/<blockquote>\s*<p>\[!NOTE\]\s*(.*?)<\/p>\s*<\/blockquote>/gis, '<div class="article-callout callout-note"><div class="callout-header"><ion-icon name="information-circle-outline"></ion-icon><span>Note</span></div><div class="callout-body">$1</div></div>')
    .replace(/<blockquote>\s*<p>\[!TIP\]\s*(.*?)<\/p>\s*<\/blockquote>/gis, '<div class="article-callout callout-tip"><div class="callout-header"><ion-icon name="bulb-outline"></ion-icon><span>Astuce</span></div><div class="callout-body">$1</div></div>')
    .replace(/<blockquote>\s*<p>\[!WARNING\]\s*(.*?)<\/p>\s*<\/blockquote>/gis, '<div class="article-callout callout-warning"><div class="callout-header"><ion-icon name="warning-outline"></ion-icon><span>Attention</span></div><div class="callout-body">$1</div></div>')
    .replace(/<blockquote>\s*<p>\[!IMPORTANT\]\s*(.*?)<\/p>\s*<\/blockquote>/gis, '<div class="article-callout callout-important"><div class="callout-header"><ion-icon name="alert-circle-outline"></ion-icon><span>Important</span></div><div class="callout-body">$1</div></div>');

  // Rendre les tables responsives en les enveloppant
  contentHtml = contentHtml.replace(/<table>/gi, '<div class="table-responsive"><table>').replace(/<\/table>/gi, '</table></div>');

  // Champs échappés pour la sécurité
  const safeTitle = escapeHtml(blog.title);
  const safeCategory = escapeHtml(blog.category);
  const safeAuthor = escapeHtml(blog.author || 'Admin');
  const safeDate = escapeHtml(blog.date);
  const safeImage = escapeHtml(blog.image);

  // Calcul du temps de lecture et nombre de mots
  const plainTextWords = rawContent.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean);
  const wordCount = plainTextWords.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readingTimeStr = `${readingTimeMinutes} min de lecture`;

  // Récupérer les autres articles pour navigation précédent/suivant et articles liés
  let allBlogs;
  try {
    allBlogs = await dbOperations.blogs.getAll();
  } catch {
    allBlogs = [];
  }
  const currentIndex = allBlogs.findIndex(b => b.id === blog.id || b.slug === blog.slug);
  const prevBlog = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;
  const nextBlog = currentIndex >= 0 && currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null;
  const relatedBlogs = allBlogs
    .filter(b => b.id !== blog.id)
    .slice(0, 3)
    .map(b => ({
      ...b,
      image: normalizeGitHubUrl(b.image),
      slug: b.slug || toSlug(b.title)
    }));

  const blogPageHtml = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle} | ${siteName}</title>
<meta name="description" content="${pageDescription}">
<link rel="canonical" href="${fullArticleUrl}">

<!-- Open Graph / LinkedIn / Facebook / WhatsApp -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="${siteName}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${pageDescription}">
<meta property="og:url" content="${fullArticleUrl}">
<meta property="og:image" content="${blogImageUrl}">
<meta property="article:published_time" content="${safeDate}">
<meta property="article:author" content="${safeAuthor}">
<meta property="article:section" content="${safeCategory}">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${pageDescription}">
<meta name="twitter:image" content="${blogImageUrl}">

<!-- Favicon -->
<link rel="shortcut icon" href="/assets/images/icon.ico" type="image/x-icon">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Poppins:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">

<!-- Prism Syntax Highlighting -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">

<!-- Design System Exclusif du Blog -->
<style>
  :root {
    --bg-page: #0b0b0e;
    --bg-surface: #141418;
    --bg-surface-elevated: #1a1a20;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-accent: rgba(255, 219, 112, 0.35);
    --gold: #ffdb70;
    --gold-dark: #f59e0b;
    --gold-glow: rgba(255, 219, 112, 0.18);
    --text-pure: #ffffff;
    --text-body: #d4d4d8;
    --text-muted: #9ca3af;
    --font-heading: 'Plus Jakarta Sans', sans-serif;
    --font-body: 'Poppins', sans-serif;
    --font-code: 'Fira Code', monospace;
    --container-max-width: 920px;
    --reading-font-size: 1.1rem;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--bg-page);
    background-image: 
      radial-gradient(circle 850px at 50% -120px, rgba(255, 219, 112, 0.08), transparent 70%),
      radial-gradient(circle 600px at 100% 400px, rgba(245, 158, 11, 0.03), transparent 60%);
    color: var(--text-body);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.8;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* Barre de progression de lecture supérieure */
  .reading-progress-track {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: transparent;
    z-index: 1001;
  }

  .reading-progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #ffdb70, #f59e0b, #ec4899);
    box-shadow: 0 0 14px rgba(255, 219, 112, 0.7);
    transition: width 0.08s ease-out;
  }

  /* Header Sticky Élégant */
  .blog-nav-bar {
    position: sticky;
    top: 0;
    z-index: 990;
    background: rgba(14, 14, 18, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 14px 24px;
    transition: all 0.3s ease;
  }

  .blog-nav-inner {
    max-width: var(--container-max-width);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .nav-back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: rgba(255, 219, 112, 0.08);
    border: 1px solid rgba(255, 219, 112, 0.25);
    border-radius: 9999px;
    color: var(--gold);
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.25s ease;
  }

  .nav-back-link:hover {
    background: rgba(255, 219, 112, 0.16);
    border-color: var(--border-accent);
    transform: translateX(-3px);
    box-shadow: 0 4px 16px var(--gold-glow);
  }

  .nav-article-snippet {
    display: none;
    font-family: var(--font-heading);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-pure);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 440px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .nav-article-snippet.visible {
    opacity: 1;
    display: block;
  }

  .nav-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .control-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: 9999px;
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 500;
  }

  .control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    color: var(--text-muted);
    font-size: 0.92rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    color: var(--gold);
    background: rgba(255, 219, 112, 0.1);
    border-color: var(--border-accent);
  }

  /* Fil d'Ariane */
  .article-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    color: var(--text-muted);
    margin-bottom: 22px;
    flex-wrap: wrap;
  }

  .article-breadcrumbs a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
  }

  .article-breadcrumbs a:hover {
    color: var(--gold);
  }

  .article-breadcrumbs .separator {
    color: rgba(255, 255, 255, 0.2);
    font-size: 0.8rem;
  }

  .article-breadcrumbs .current {
    color: var(--gold);
    font-weight: 500;
  }

  /* Conteneur principal */
  .blog-container {
    display: block !important;
    max-width: var(--container-max-width) !important;
    width: 100% !important;
    margin: 36px auto 100px auto !important;
    padding: 0 24px !important;
  }

  /* Feuille d'Article Éditoriale */
  .article-sheet {
    display: block !important;
    width: 100% !important;
    background: linear-gradient(180deg, #15151a 0%, #121216 100%);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 28px;
    padding: 56px 64px;
    box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
    position: relative;
    overflow: hidden;
    margin-bottom: 44px;
  }

  @media (max-width: 768px) {
    .article-sheet {
      padding: 32px 20px;
      border-radius: 20px;
    }
    .blog-container {
      margin-top: 18px !important;
      padding: 0 14px !important;
    }
  }

  /* En-tête de l'Article */
  .article-header {
    margin-bottom: 36px;
  }

  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: rgba(255, 219, 112, 0.1);
    border: 1px solid rgba(255, 219, 112, 0.3);
    border-radius: 9999px;
    color: var(--gold);
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 20px;
  }

  .article-main-title {
    font-family: var(--font-heading);
    font-size: clamp(2.1rem, 4.2vw, 3.2rem);
    font-weight: 800;
    line-height: 1.18;
    color: var(--text-pure);
    letter-spacing: -0.025em;
    margin: 0 0 18px 0;
  }

  .gold-divider-bar {
    width: 52px;
    height: 4px;
    border-radius: 4px;
    background: linear-gradient(90deg, #ffdb70, #f59e0b);
    margin: 0 0 24px 0;
  }

  .article-excerpt-lead {
    font-size: 1.22rem;
    line-height: 1.75;
    color: #e4e4e7;
    margin-bottom: 30px;
    padding-left: 20px;
    border-left: 3px solid var(--gold);
  }

  .article-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    padding: 18px 0;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .meta-item ion-icon {
    font-size: 1.1rem;
    color: var(--gold);
  }

  .author-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffdb70, #f59e0b);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #121214;
    font-weight: 800;
    font-size: 0.82rem;
    box-shadow: 0 4px 12px rgba(255, 219, 112, 0.3);
  }

  /* Bannière Hero */
  .hero-figure {
    margin: 36px 0 44px 0;
    position: relative;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #000;
  }

  .hero-figure img {
    width: 100%;
    max-height: 500px;
    object-fit: cover;
    display: block;
    cursor: zoom-in;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .hero-figure:hover img {
    transform: scale(1.02);
  }

  .figure-caption {
    padding: 12px 18px;
    font-size: 0.82rem;
    color: var(--text-muted);
    text-align: center;
    background: rgba(14, 14, 18, 0.8);
    border-top: 1px solid var(--border-subtle);
  }

  /* Sommaire Dynamique (Table of Contents) */
  .toc-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    padding: 24px 28px;
    margin: 36px 0 44px 0;
    position: relative;
  }

  .toc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .toc-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-pure);
  }

  .toc-title ion-icon {
    color: var(--gold);
    font-size: 1.25rem;
  }

  .toc-badge {
    font-size: 0.76rem;
    padding: 3px 10px;
    border-radius: 9999px;
    background: rgba(255, 219, 112, 0.1);
    color: var(--gold);
    font-weight: 600;
  }

  .toc-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .toc-level-3 {
    margin-left: 22px;
    font-size: 0.94rem;
  }

  .toc-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #cbd5e1;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .toc-bullet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
    opacity: 0.6;
    transition: transform 0.2s;
  }

  .toc-link:hover {
    color: var(--gold);
    transform: translateX(5px);
  }

  .toc-link:hover .toc-bullet {
    opacity: 1;
    transform: scale(1.4);
  }

  /* Corps de l'Article */
  .article-body {
    font-size: var(--reading-font-size);
    line-height: 1.88;
    color: var(--text-body);
  }

  .article-body p {
    margin-bottom: 26px;
    letter-spacing: 0.005em;
  }

  .article-body h2 {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-pure);
    margin: 52px 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    scroll-margin-top: 90px;
  }

  .article-body h3 {
    font-family: var(--font-heading);
    font-size: 1.38rem;
    font-weight: 600;
    color: #f4f4f5;
    margin: 38px 0 16px 0;
    scroll-margin-top: 90px;
  }

  .heading-anchor {
    position: absolute;
    left: -26px;
    color: var(--gold);
    opacity: 0;
    text-decoration: none;
    font-weight: 400;
    transition: opacity 0.2s;
  }

  .article-heading:hover .heading-anchor {
    opacity: 0.8;
  }

  .article-body ul, .article-body ol {
    margin: 0 0 28px 26px;
  }

  .article-body li {
    margin-bottom: 10px;
    padding-left: 6px;
  }

  .article-body a {
    color: var(--gold);
    text-decoration: underline;
    text-underline-offset: 4px;
    transition: opacity 0.2s;
  }

  .article-body a:hover {
    opacity: 0.8;
  }

  .article-body strong {
    color: #ffffff;
    font-weight: 600;
  }

  .article-body img {
    max-width: 100%;
    height: auto;
    border-radius: 16px;
    margin: 32px auto;
    display: block;
    box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
    border: 1px solid var(--border-subtle);
    cursor: zoom-in;
    transition: transform 0.25s ease;
  }

  .article-body img:hover {
    transform: scale(1.015);
  }

  /* Callouts & Alertes */
  .article-callout {
    border-radius: 16px;
    padding: 22px 26px;
    margin: 30px 0;
    border-left: 4px solid;
    background: rgba(255, 255, 255, 0.02);
  }

  .callout-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 0.98rem;
    margin-bottom: 10px;
    font-family: var(--font-heading);
  }

  .callout-body {
    font-size: 1rem;
    line-height: 1.7;
  }

  .callout-note {
    border-color: #38bdf8;
    background: rgba(56, 189, 248, 0.07);
  }
  .callout-note .callout-header { color: #38bdf8; }

  .callout-tip {
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.07);
  }
  .callout-tip .callout-header { color: #4ade80; }

  .callout-warning {
    border-color: #facc15;
    background: rgba(250, 204, 21, 0.07);
  }
  .callout-warning .callout-header { color: #facc15; }

  .callout-important {
    border-color: #f87171;
    background: rgba(248, 113, 113, 0.07);
  }
  .callout-important .callout-header { color: #f87171; }

  .article-body blockquote:not(.article-callout) {
    border-left: 4px solid var(--gold);
    background: rgba(255, 219, 112, 0.04);
    padding: 20px 26px;
    border-radius: 0 16px 16px 0;
    margin: 32px 0;
    font-style: italic;
    color: #e4e4e7;
  }

  /* Blocs de Code macOS */
  .article-body code:not(pre code) {
    background: rgba(255, 255, 255, 0.08);
    color: #ffdb70;
    padding: 3px 8px;
    border-radius: 6px;
    font-family: var(--font-code);
    font-size: 0.88em;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .code-block-wrapper {
    position: relative;
    margin: 34px 0;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #141418;
    box-shadow: 0 16px 40px rgba(0,0,0,0.55);
  }

  .code-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.035);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    font-size: 0.8rem;
    color: #a1a1aa;
    font-family: var(--font-code);
  }

  .mac-dots {
    display: flex;
    gap: 7px;
  }

  .mac-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
  }
  .dot-red { background: #ff5f56; }
  .dot-yellow { background: #ffbd2e; }
  .dot-green { background: #27c93f; }

  .copy-code-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #d4d4d8;
    padding: 5px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.78rem;
    transition: all 0.2s;
  }

  .copy-code-btn:hover {
    background: rgba(255, 219, 112, 0.12);
    color: var(--gold);
    border-color: var(--gold);
  }

  .article-body pre {
    margin: 0 !important;
    padding: 22px 24px !important;
    background: #141418 !important;
    border-radius: 0 !important;
    border: none !important;
    font-family: var(--font-code) !important;
    font-size: 0.94rem !important;
    overflow-x: auto;
  }

  /* Tableaux */
  .table-responsive {
    overflow-x: auto;
    margin: 34px 0;
    border-radius: 14px;
    border: 1px solid var(--border-subtle);
  }

  .article-body table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.96rem;
    text-align: left;
  }

  .article-body th {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-weight: 600;
    padding: 15px 20px;
    border-bottom: 2px solid var(--border-subtle);
  }

  .article-body td {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .article-body tr:last-child td {
    border-bottom: none;
  }

  .article-body tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  /* Partage Réseaux */
  .article-share-section {
    margin-top: 52px;
    padding-top: 34px;
    border-top: 1px solid var(--border-subtle);
  }

  .share-title {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-pure);
    margin-bottom: 18px;
  }

  .share-buttons-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .share-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: rgba(255, 255, 255, 0.03);
    color: #e4e4e7;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .share-pill:hover {
    transform: translateY(-2px);
    border-color: var(--border-accent);
    color: #ffffff;
  }

  .share-pill.linkedin:hover { background: #0077b5; border-color: #0077b5; }
  .share-pill.twitter:hover { background: #000000; border-color: #555; }
  .share-pill.whatsapp:hover { background: #25d366; border-color: #25d366; color: #121214; }
  .share-pill.copy:hover { background: var(--gold); border-color: var(--gold); color: #121214; }

  /* Carte Profil Auteur */
  .author-card {
    display: flex;
    align-items: center;
    gap: 22px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    padding: 26px;
    margin-top: 44px;
  }

  .author-card-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffdb70, #f59e0b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 800;
    color: #121214;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(255, 219, 112, 0.3);
  }

  .author-card-info h4 {
    margin: 0 0 6px 0;
    font-family: var(--font-heading);
    font-size: 1.2rem;
    color: var(--text-pure);
  }

  .author-card-info p {
    margin: 0;
    font-size: 0.92rem;
    color: var(--text-muted);
    line-height: 1.6;
  }

  /* Navigation Articles Suivant / Précédent */
  .article-pagination {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 44px;
  }

  @media (max-width: 640px) {
    .article-pagination {
      grid-template-columns: 1fr;
    }
  }

  .pagination-card {
    background: linear-gradient(180deg, #15151a 0%, #121216 100%);
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    padding: 22px 26px;
    text-decoration: none;
    color: inherit;
    transition: all 0.25s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .pagination-card:hover {
    border-color: var(--border-accent);
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  }

  .pagination-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .pagination-title {
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-pure);
    line-height: 1.4;
  }

  /* Articles Connexes */
  .related-section {
    margin-top: 68px;
  }

  .related-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 26px;
  }

  .related-header h3 {
    font-family: var(--font-heading);
    font-size: 1.45rem;
    font-weight: 700;
    color: var(--text-pure);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 22px;
  }

  .related-card {
    background: linear-gradient(180deg, #15151a 0%, #121216 100%);
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  .related-card:hover {
    transform: translateY(-4px);
    border-color: var(--border-accent);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
  }

  .related-card-img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    display: block;
    transition: transform 0.35s ease;
  }

  .related-card:hover .related-card-img {
    transform: scale(1.04);
  }

  .related-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .related-card-category {
    font-size: 0.76rem;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .related-card-title {
    font-family: var(--font-heading);
    font-size: 1.02rem;
    font-weight: 600;
    color: var(--text-pure);
    line-height: 1.4;
    margin-bottom: 12px;
    flex-grow: 1;
  }

  .related-card-meta {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  /* Bouton Retour Haut */
  .back-to-top-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffdb70, #f59e0b);
    border: none;
    color: #121214;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(255, 219, 112, 0.4);
    opacity: 0;
    visibility: hidden;
    transform: translateY(16px);
    transition: all 0.3s ease;
    z-index: 950;
  }

  .back-to-top-btn.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .back-to-top-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(255, 219, 112, 0.6);
  }

  /* Modal Lightbox */
  .lightbox-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(10, 10, 14, 0.94);
    backdrop-filter: blur(16px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 30px;
  }

  .lightbox-modal.active {
    display: flex;
  }

  .lightbox-content {
    max-width: 90vw;
    max-height: 88vh;
    border-radius: 16px;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    object-fit: contain;
    animation: zoomLightbox 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes zoomLightbox {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }

  .lightbox-close-btn {
    position: absolute;
    top: 24px;
    right: 28px;
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: #ffffff;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .lightbox-close-btn:hover {
    background: rgba(255, 219, 112, 0.2);
    color: var(--gold);
  }

  /* Toast Notification */
  .toast-container {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  .custom-toast {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    background: rgba(20, 20, 26, 0.95);
    border: 1px solid var(--border-accent);
    border-radius: 9999px;
    color: #ffffff;
    font-size: 0.92rem;
    font-weight: 500;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px var(--gold-glow);
    opacity: 0;
    transform: translateY(16px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .custom-toast.show {
    opacity: 1;
    transform: translateY(0);
  }
</style>
</head>
<body>

<!-- Barre de progression -->
<div class="reading-progress-track">
  <div class="reading-progress-fill" id="reading-progress-fill"></div>
</div>

<!-- Header de Navigation -->
<header class="blog-nav-bar">
  <div class="blog-nav-inner">
    <a href="/#blog" class="nav-back-link">
      <ion-icon name="arrow-back-outline"></ion-icon>
      <span>Retour au portfolio</span>
    </a>

    <div class="nav-article-snippet" id="nav-article-snippet">${safeTitle}</div>

    <div class="nav-controls">
      <div class="control-pill" title="Temps de lecture estimé">
        <ion-icon name="time-outline" style="color: var(--gold);"></ion-icon>
        <span>${readingTimeMinutes} min</span>
      </div>
      <button type="button" class="control-btn" id="btn-font-decrease" title="Diminuer la taille du texte">A-</button>
      <button type="button" class="control-btn" id="btn-font-increase" title="Augmenter la taille du texte">A+</button>
      <button type="button" class="control-btn" onclick="copyArticleLink('${fullArticleUrl}')" title="Copier le lien de l'article">
        <ion-icon name="share-social-outline"></ion-icon>
      </button>
    </div>
  </div>
</header>

<main class="blog-container">
  <!-- Fil d'Ariane -->
  <nav class="article-breadcrumbs" aria-label="Fil d'Ariane">
    <a href="/">Accueil</a>
    <span class="separator">›</span>
    <a href="/#blog">Blog</a>
    <span class="separator">›</span>
    <span class="current">${safeCategory}</span>
  </nav>

  <!-- Feuille d'Article -->
  <article class="article-sheet">
    <header class="article-header">
      <div class="category-pill">
        <ion-icon name="bookmark-outline"></ion-icon>
        <span>${safeCategory}</span>
      </div>

      <h1 class="article-main-title">${safeTitle}</h1>
      <div class="gold-divider-bar"></div>

      ${blog.excerpt ? `<div class="article-excerpt-lead">${escapeHtml(blog.excerpt)}</div>` : ''}

      <div class="article-meta-row">
        <div class="meta-item">
          <div class="author-avatar">${safeAuthor.charAt(0).toUpperCase()}</div>
          <span style="font-weight: 600; color: #ffffff;">${safeAuthor}</span>
        </div>
        <div class="meta-item">
          <ion-icon name="calendar-outline"></ion-icon>
          <time datetime="${safeDate}">${safeDate}</time>
        </div>
        <div class="meta-item">
          <ion-icon name="time-outline"></ion-icon>
          <span>${readingTimeStr}</span>
        </div>
        <div class="meta-item">
          <ion-icon name="book-outline"></ion-icon>
          <span>${wordCount} mots</span>
        </div>
      </div>
    </header>

    ${safeImage ? `
    <figure class="hero-figure">
      <img src="${safeImage}" alt="${safeTitle}" class="zoomable-image" loading="eager">
      <figcaption class="figure-caption">🔍 Cliquez sur l'image pour l'agrandir en plein écran</figcaption>
    </figure>
    ` : ''}

    ${tableOfContents.length > 0 ? `
    <nav class="toc-card" aria-label="Sommaire">
      <div class="toc-header">
        <div class="toc-title">
          <ion-icon name="list-outline"></ion-icon>
          <span>Sommaire de l'article</span>
        </div>
        <span class="toc-badge">${tableOfContents.length} sections</span>
      </div>
      <ul class="toc-list">
        ${tableOfContents.map(item => `
          <li class="toc-item toc-level-${item.level}">
            <a href="#${item.id}" class="toc-link">
              <span class="toc-bullet"></span>
              <span>${escapeHtml(item.title)}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </nav>
    ` : ''}

    <div class="article-body" id="article-body">
      ${contentHtml}
    </div>

    <!-- Partage social -->
    <section class="article-share-section">
      <div class="share-title">Partager cet article</div>
      <div class="share-buttons-grid">
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullArticleUrl)}" target="_blank" rel="noopener noreferrer" class="share-pill linkedin">
          <ion-icon name="logo-linkedin"></ion-icon>
          <span>LinkedIn</span>
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(fullArticleUrl)}" target="_blank" rel="noopener noreferrer" class="share-pill twitter">
          <ion-icon name="logo-twitter"></ion-icon>
          <span>Twitter / X</span>
        </a>
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(blog.title + ' ' + fullArticleUrl)}" target="_blank" rel="noopener noreferrer" class="share-pill whatsapp">
          <ion-icon name="logo-whatsapp"></ion-icon>
          <span>WhatsApp</span>
        </a>
        <button type="button" class="share-pill copy" onclick="copyArticleLink('${fullArticleUrl}')">
          <ion-icon name="link-outline"></ion-icon>
          <span>Copier le lien</span>
        </button>
      </div>
    </section>

    <!-- Carte Profil Auteur -->
    <section class="author-card">
      <div class="author-card-avatar">${safeAuthor.charAt(0).toUpperCase()}</div>
      <div class="author-card-info">
        <h4>${safeAuthor}</h4>
        <p>Développeur et créateur de solutions logicielles modernes. Retrouvez mes derniers articles, retours d'expérience et guides techniques sur ce portfolio.</p>
      </div>
    </section>
  </article>

  <!-- Navigation Précédent / Suivant -->
  ${(prevBlog || nextBlog) ? `
  <nav class="article-pagination" aria-label="Navigation entre articles">
    ${prevBlog ? `
      <a href="/blog/${encodeURI(prevBlog.slug || toSlug(prevBlog.title))}" class="pagination-card">
        <span class="pagination-label">← Article Précédent</span>
        <span class="pagination-title">${escapeHtml(prevBlog.title)}</span>
      </a>
    ` : '<div></div>'}
    ${nextBlog ? `
      <a href="/blog/${encodeURI(nextBlog.slug || toSlug(nextBlog.title))}" class="pagination-card" style="text-align: right;">
        <span class="pagination-label">Article Suivant →</span>
        <span class="pagination-title">${escapeHtml(nextBlog.title)}</span>
      </a>
    ` : '<div></div>'}
  </nav>
  ` : ''}

  <!-- Articles Recommandés -->
  ${relatedBlogs.length > 0 ? `
  <section class="related-section">
    <div class="related-header">
      <h3>À découvrir également</h3>
      <a href="/#blog" style="color: var(--gold); text-decoration: none; font-size: 0.92rem; font-weight: 600;">Tous les articles →</a>
    </div>
    <div class="related-grid">
      ${relatedBlogs.map(r => `
        <a href="/blog/${encodeURI(r.slug)}" class="related-card">
          ${r.image ? `<img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}" class="related-card-img" loading="lazy">` : ''}
          <div class="related-card-body">
            <span class="related-card-category">${escapeHtml(r.category || 'Blog')}</span>
            <h4 class="related-card-title">${escapeHtml(r.title)}</h4>
            <div class="related-card-meta">${escapeHtml(r.date || '')}</div>
          </div>
        </a>
      `).join('')}
    </div>
  </section>
  ` : ''}
</main>

<!-- Bouton Retour Haut de page -->
<button type="button" class="back-to-top-btn" id="back-to-top" title="Haut de page">
  <ion-icon name="arrow-up-outline"></ion-icon>
</button>

<!-- Modal Lightbox -->
<div class="lightbox-modal" id="lightbox-modal">
  <button type="button" class="lightbox-close-btn" id="lightbox-close">&times;</button>
  <img src="" alt="" class="lightbox-content" id="lightbox-img">
</div>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
<script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
<script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>

<script>
  // 1. Barre de progression & Header snippet
  const progressBar = document.getElementById("reading-progress-fill");
  const navSnippet = document.getElementById("nav-article-snippet");
  const backToTopBtn = document.getElementById("back-to-top");

  window.addEventListener("scroll", () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    
    if (progressBar) progressBar.style.width = scrolled + "%";

    if (winScroll > 280) {
      if (navSnippet) navSnippet.classList.add("visible");
      if (backToTopBtn) backToTopBtn.classList.add("visible");
    } else {
      if (navSnippet) navSnippet.classList.remove("visible");
      if (backToTopBtn) backToTopBtn.classList.remove("visible");
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 2. Gestion de la taille de police réglable
  const articleBody = document.getElementById("article-body");
  const btnFontDecrease = document.getElementById("btn-font-decrease");
  const btnFontIncrease = document.getElementById("btn-font-increase");
  let currentFontSize = parseFloat(localStorage.getItem('preferred-font-size') || 1.1);

  function applyFontSize(size) {
    currentFontSize = Math.min(Math.max(size, 0.95), 1.35);
    if (articleBody) articleBody.style.fontSize = currentFontSize + "rem";
    localStorage.setItem('preferred-font-size', currentFontSize);
  }
  applyFontSize(currentFontSize);

  if (btnFontDecrease) {
    btnFontDecrease.addEventListener("click", () => applyFontSize(currentFontSize - 0.08));
  }
  if (btnFontIncrease) {
    btnFontIncrease.addEventListener("click", () => applyFontSize(currentFontSize + 0.08));
  }

  // 3. Blocs de code : Ajout Header macOS + Bouton Copier
  document.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";
    pre.parentNode.insertBefore(wrapper, pre);

    let lang = "CODE";
    if (code) {
      const match = code.className.match(/language-(\\w+)/);
      if (match) lang = match[1].toUpperCase();
    }

    const header = document.createElement("div");
    header.className = "code-block-header";
    header.innerHTML = \`
      <div class="mac-dots">
        <span class="mac-dot dot-red"></span>
        <span class="mac-dot dot-yellow"></span>
        <span class="mac-dot dot-green"></span>
      </div>
      <span style="font-weight: 600; color: #ffdb70; font-size: 0.75rem;">\${lang}</span>
      <button type="button" class="copy-code-btn">
        <ion-icon name="copy-outline"></ion-icon>
        <span>Copier</span>
      </button>
    \`;

    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    const copyBtn = header.querySelector(".copy-code-btn");
    copyBtn.addEventListener("click", () => {
      const textToCopy = code ? code.innerText : pre.innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon><span>Copié !</span>';
        showToast("Code copié dans le presse-papier !", "success");
        setTimeout(() => {
          copyBtn.innerHTML = '<ion-icon name="copy-outline"></ion-icon><span>Copier</span>';
        }, 2200);
      });
    });
  });

  // 4. Lightbox pour agrandir toutes les images
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  function openLightbox(src, alt) {
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || "Image en grand format";
      lightbox.classList.add("active");
    }
  }

  function closeLightbox() {
    if (lightbox) lightbox.classList.remove("active");
  }

  document.querySelectorAll(".article-body img, .hero-figure img").forEach(img => {
    img.addEventListener("click", () => openLightbox(img.src, img.alt));
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // 5. Toast Notifications & Copie de lien
  function copyArticleLink(url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Lien de l'article copié !", "success");
      }).catch(() => {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(url) {
    const dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.value = url;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    showToast("Lien de l'article copié !", "success");
  }

  function showToast(msg, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = '<span style="font-size:1.1rem;">' + (type === 'error' ? '⚠️' : '✨') + '</span><span>' + msg + '</span>';
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 40);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3200);
  }
</script>
</body>
</html>`;

  res.send(blogPageHtml);
});
