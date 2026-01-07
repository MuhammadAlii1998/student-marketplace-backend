const Category = require('../models/category');
const Product = require('../models/product');

// Get all categories with product counts
async function getCategories(req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Add dynamic product count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat.name });
        return {
          ...cat.toObject(),
          count
        };
      })
    );
    
    res.json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get category by slug
async function getCategoryBySlug(req, res) {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Add dynamic product count
    const count = await Product.countDocuments({ category: category.name });
    
    res.json({
      ...category.toObject(),
      count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Create category (admin)
async function createCategory(req, res) {
  try {
    const { name, slug } = req.body;
    const category = new Category({ name, slug: slug || name.toLowerCase() });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory
};
