const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', categoriesController.getAllCategories);

router.post('/',
  authenticateToken,
  categoriesController.createCategory
);

router.put('/:id',
  authenticateToken,
  categoriesController.updateCategory
);

router.delete('/:id',
  authenticateToken,
  categoriesController.deleteCategory
);

module.exports = router;
