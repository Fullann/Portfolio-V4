const { z } = require('zod');

// Schema pour le login
const loginSchema = z.object({
  username: z.string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur est trop long')
    .trim(),
  password: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe est trop long')
});

// Schema pour l'envoi d'email
const emailSchema = z.object({
  fullname: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .trim(),
  email: z.string()
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  message: z.string()
    .min(5, 'Le message doit contenir au moins 5 caractères')
    .max(5000, 'Le message est trop long')
    .trim(),
  'g-recaptcha-response': z.string().min(1, 'CAPTCHA manquant')
});

// Schema pour les projets
const projectSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(255, 'Le titre est trop long')
    .trim(),
  category: z.string()
    .min(2, 'La catégorie doit contenir au moins 2 caractères')
    .max(255, 'La catégorie est trop longue')
    .trim(),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description est trop longue')
    .trim()
    .optional(),
});

// Schema pour les témoignages
const testimonialSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom est trop long')
    .trim(),
  text: z.string()
    .min(10, 'Le texte doit contenir au moins 10 caractères')
    .max(2000, 'Le texte est trop long')
    .trim(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
});

// Schema pour les blogs
const blogSchema = z.object({
  title: z.string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(255, 'Le titre est trop long')
    .trim(),
  category: z.string()
    .min(2, 'La catégorie est requise')
    .max(255, 'La catégorie est trop longue')
    .trim(),
  excerpt: z.string()
    .min(20, 'L\'extrait doit contenir au moins 20 caractères')
    .max(500, 'L\'extrait est trop long')
    .trim(),
  content: z.string()
    .min(50, 'Le contenu doit contenir au moins 50 caractères')
    .max(50000, 'Le contenu est trop long')
    .trim(),
  author: z.string()
    .max(255, 'Le nom de l\'auteur est trop long')
    .trim()
    .optional()
});

// Middleware de validation
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Parse et valide le body
      const validatedData = schema.parse(req.body);
      // Remplace req.body par les données validées et nettoyées
      req.body = validatedData;
      next();
    } catch (error) {
      // Vérifier si c'est bien une erreur Zod
      if (error.name === 'ZodError' || error.errors) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Validation échouée',
          details: errors
        });
      }
      
      // Si c'est une autre erreur, la logger et renvoyer une erreur générique
      console.error('Erreur de validation inattendue:', error);
      return res.status(500).json({
        error: 'Erreur lors de la validation',
        details: error.message
      });
    }
  };
};


module.exports = {
  loginSchema,
  emailSchema,
  projectSchema,
  testimonialSchema,
  blogSchema,
  validate
};
