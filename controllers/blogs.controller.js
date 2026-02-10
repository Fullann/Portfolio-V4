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
      return res.status(404).send('Blog non trouvé');
    }

    const contentHtml = marked(blog.content);

    const blogPageHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${blog.title}</title>
        <link rel="stylesheet" href="/assets/css/style.css">
        <style>
          .blog-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .back-link {
            color: var(--orange-yellow-crayola);
            text-decoration: none;
            margin-bottom: 20px;
            display: inline-block;
          }
          .blog-header {
            margin-bottom: 30px;
          }
          .blog-title {
            font-size: 2.5rem;
            margin-bottom: 10px;
          }
          .blog-meta {
            color: var(--light-gray-70);
            margin-bottom: 20px;
          }
          .blog-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 30px;
          }
          .blog-content {
            line-height: 1.8;
            font-size: 1.1rem;
          }
        </style>
      </head>
      <body>
        <div class="blog-container">
          <a href="/" class="back-link">← Retour au portfolio</a>
          <article class="blog-header">
            <h1 class="blog-title">${blog.title}</h1>
            <div class="blog-meta">
              Par ${blog.author} • ${blog.date} • ${blog.category}
            </div>
            ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="blog-image">` : ''}
          </article>
          <div class="blog-content">
            ${contentHtml}
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(blogPageHtml);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).send('Erreur lors de l\'affichage du blog');
  }
};
