const { marked } = require('marked');
const { dbOperations } = require('../config/database');
const { updateHtmlFile } = require('../services/htmlGenerator.service');

let lastUpdate = Date.now();

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await dbOperations.blogs.getAll();
    res.json(blogs);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des blogs' });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await dbOperations.blogs.getBySlug(slug);

    if (!blog) {
      return res.status(404).json({ error: 'Blog non trouvé' });
    }

    const blogWithHtml = {
      ...blog,
      contentHtml: marked(blog.content)
    };

    res.json(blogWithHtml);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du blog' });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, category, excerpt, content, author } = req.body;
    const image = req.file ? `/assets/images/${req.file.filename}` : null;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    lastUpdate = Date.now();

    const newBlog = await dbOperations.blogs.create({
      title,
      category,
      excerpt,
      content,
      image,
      date: new Date().toISOString().split('T')[0],
      author: author || 'Admin',
      slug
    });

    await updateHtmlFile();
    res.json(newBlog);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du blog' });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, excerpt, content, author } = req.body;

    lastUpdate = Date.now();

    const updateData = { title, category, excerpt, content, author };

    if (title) {
      updateData.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (req.file) {
      updateData.image = `/assets/images/${req.file.filename}`;
    }

    const updatedBlog = await dbOperations.blogs.update(id, updateData);
    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog non trouvé' });
    }

    await updateHtmlFile();
    res.json(updatedBlog);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du blog' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    lastUpdate = Date.now();

    await dbOperations.blogs.delete(id);
    await updateHtmlFile();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du blog' });
  }
};

exports.renderBlogPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await dbOperations.blogs.getBySlug(slug);

    if (!blog) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Article non trouvé - Portfolio</title>
          <link rel="stylesheet" href="/assets/css/style.css">
        </head>
        <body style="display:flex; align-items:center; justify-content:center; min-height:100vh; background:var(--smoky-black); color:var(--white-2); font-family:sans-serif;">
          <div style="text-align:center; padding:40px;">
            <h1 style="font-size:3rem; margin-bottom:20px; color:var(--orange-yellow-crayola);">404</h1>
            <p style="margin-bottom:20px;">L'article de blog demandé n'existe pas.</p>
            <a href="/" style="color:var(--orange-yellow-crayola); text-decoration:none; font-weight:600;">← Retour au portfolio</a>
          </div>
        </body>
        </html>
      `);
    }

    const siteSettings = await dbOperations.settings.getAll();
    const baseUrl = (siteSettings.base_url || 'http://localhost:3000').replace(/\/$/, '');
    const siteName = siteSettings.site_name || 'Portfolio';
    const contentHtml = marked(blog.content || '');

    let blogImageUrl = blog.image ? (blog.image.startsWith('http') ? blog.image : `${baseUrl}/${blog.image.replace(/^\.\//, '')}`) : `${baseUrl}/assets/images/logo.svg`;
    const fullArticleUrl = `${baseUrl}/blog/${blog.slug}`;
    const pageDescription = blog.excerpt || blog.title;

    const wordCount = (blog.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readingTimeStr = `${readingTimeMinutes} min de lecture`;

    const blogPageHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blog.title} | ${siteName}</title>
  <meta name="description" content="${pageDescription}">
  <link rel="canonical" href="${fullArticleUrl}">

  <!-- Open Graph / LinkedIn / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:title" content="${blog.title}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:url" content="${fullArticleUrl}">
  <meta property="og:image" content="${blogImageUrl}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${blog.title}">
  <meta name="twitter:description" content="${pageDescription}">
  <meta name="twitter:image" content="${blogImageUrl}">

  <!-- Favicon -->
  <link rel="shortcut icon" href="/assets/images/icon.ico" type="image/x-icon">
  
  <!-- CSS Global -->
  <link rel="stylesheet" href="/assets/css/style.css">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    body {
      background: var(--smoky-black);
      color: var(--white-2);
      font-family: 'Poppins', sans-serif;
      min-height: 100vh;
      padding: 20px 10px;
    }
    .blog-page-container {
      max-width: 900px;
      margin: 30px auto;
    }
    .blog-article-card {
      background: var(--eerie-black-2);
      border: 1px solid var(--jet);
      border-radius: 20px;
      padding: 35px 45px;
      box-shadow: var(--shadow-2);
    }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--eerie-black-1);
      color: var(--orange-yellow-crayola);
      border: 1px solid var(--jet);
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      margin-bottom: 30px;
      transition: var(--transition-1);
    }
    .btn-back:hover {
      background: var(--onyx);
      transform: translateX(-4px);
    }
    .article-header {
      margin-bottom: 30px;
    }
    .article-category {
      display: inline-block;
      font-size: 0.85rem;
      color: var(--orange-yellow-crayola);
      font-weight: 500;
      text-transform: capitalize;
      margin-bottom: 10px;
    }
    .article-title {
      font-size: 2.2rem;
      font-weight: 600;
      color: var(--white-1);
      line-height: 1.3;
      margin-bottom: 15px;
    }
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 20px;
      color: var(--light-gray-70);
      font-size: 0.9rem;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--jet);
    }
    .article-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .article-hero-image {
      width: 100%;
      max-height: 450px;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 35px;
      box-shadow: var(--shadow-3);
    }
    .article-body {
      font-size: 1.05rem;
      line-height: 1.8;
      color: var(--light-gray);
    }
    .article-body p {
      margin-bottom: 20px;
    }
    .article-body h1, .article-body h2, .article-body h3, .article-body h4 {
      color: var(--white-1);
      margin: 30px 0 15px 0;
      font-weight: 600;
    }
    .article-body h2 { font-size: 1.6rem; }
    .article-body h3 { font-size: 1.3rem; }
    .article-body ul, .article-body ol {
      margin: 0 0 20px 25px;
    }
    .article-body li {
      margin-bottom: 8px;
    }
    .article-body blockquote {
      border-left: 4px solid var(--orange-yellow-crayola);
      background: var(--eerie-black-1);
      padding: 15px 20px;
      border-radius: 0 12px 12px 0;
      margin: 25px 0;
      font-style: italic;
      color: var(--white-2);
    }
    .article-body code {
      background: var(--onyx);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.9rem;
      color: var(--orange-yellow-crayola);
    }
    .article-body pre {
      background: var(--eerie-black-1);
      padding: 20px;
      border-radius: 12px;
      overflow-x: auto;
      margin: 25px 0;
      border: 1px solid var(--jet);
    }
    .article-body pre code {
      background: transparent;
      padding: 0;
    }
    .article-body a {
      color: var(--orange-yellow-crayola);
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      .blog-article-card {
        padding: 20px;
      }
      .article-title {
        font-size: 1.7rem;
      }
    }
  </style>
</head>
<body>
  <div class="blog-page-container">
    <a href="/" class="btn-back">
      <ion-icon name="arrow-back-outline"></ion-icon>
      <span>Retour au portfolio</span>
    </a>

    <article class="blog-article-card">
      <header class="article-header">
        ${blog.category ? `<span class="article-category">${blog.category}</span>` : ''}
        <h1 class="article-title">${blog.title}</h1>
        <div class="article-meta">
          <div class="article-meta-item">
            <ion-icon name="person-outline"></ion-icon>
            <span>${blog.author || 'Admin'}</span>
          </div>
          <div class="article-meta-item">
            <ion-icon name="calendar-outline"></ion-icon>
            <time datetime="${blog.date}">${blog.date}</time>
          </div>
          <div class="article-meta-item">
            <ion-icon name="time-outline"></ion-icon>
            <span>${readingTimeStr}</span>
          </div>
        </div>
      </header>

      ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="article-hero-image">` : ''}

      <div class="article-body">
        ${contentHtml}
      </div>

      <!-- Social Share Buttons -->
      <section class="share-buttons-container">
        <h4 class="share-buttons-title">Partager cet article :</h4>
        <ul class="share-buttons-list">
          <li>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullArticleUrl)}" target="_blank" rel="noopener noreferrer" class="share-btn linkedin">
              <ion-icon name="logo-linkedin"></ion-icon>
              <span>LinkedIn</span>
            </a>
          </li>
          <li>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(fullArticleUrl)}" target="_blank" rel="noopener noreferrer" class="share-btn twitter">
              <ion-icon name="logo-twitter"></ion-icon>
              <span>Twitter / X</span>
            </a>
          </li>
          <li>
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(blog.title + ' ' + fullArticleUrl)}" target="_blank" rel="noopener noreferrer" class="share-btn whatsapp">
              <ion-icon name="logo-whatsapp"></ion-icon>
              <span>WhatsApp</span>
            </a>
          </li>
          <li>
            <button type="button" class="share-btn copy-link-btn" onclick="copyArticleLink('${fullArticleUrl}')">
              <ion-icon name="copy-outline"></ion-icon>
              <span>Copier le lien</span>
            </button>
          </li>
        </ul>
      </section>
    </article>
  </div>

  <div class="scroll-progress-bar" id="scroll-progress-bar"></div>

  <script>
    window.addEventListener("scroll", () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      const bar = document.getElementById("scroll-progress-bar");
      if (bar) bar.style.width = scrolled + "%";
    });

    function copyArticleLink(url) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          showToast("Lien de l'article copié !", "success");
        }).catch(() => {
          showToast("Erreur lors de la copie", "error");
        });
      } else {
        const dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.value = url;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        showToast("Lien de l'article copié !", "success");
      }
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
      toast.className = 'custom-toast ' + (type || 'success');
      toast.innerHTML = '<span class="custom-toast-icon">' + (type === 'error' ? '❌' : '✅') + '</span><span>' + msg + '</span>';
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 50);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
      }, 3500);
    }
  </script>
  <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
</body>
</html>`;

    res.send(blogPageHtml);
  } catch (error) {
    console.error('Erreur affichage blog:', error);
    res.status(500).send('Erreur lors de l\'affichage du blog');
  }
};
