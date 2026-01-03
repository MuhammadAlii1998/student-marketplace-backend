const validator = require('validator');

// Validate registration input
function validateRegistration(req, res, next) {
  const { name, email, password, studentId } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  // Validate ESILV email domain
  if (email && !email.endsWith('@edu.devinci.fr') && !email.endsWith('@devinci.fr')) {
    errors.push('Must use ESILV email address');
  }

  // Validate password
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Validate student ID
  if (!studentId || !/^\d{7}$/.test(studentId)) {
    errors.push('Student ID must be exactly 7 digits');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize inputs
  req.body.name = validator.trim(req.body.name);
  req.body.email = validator.normalizeEmail(req.body.email);

  next();
}

// Validate login input
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 1) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  req.body.email = validator.normalizeEmail(req.body.email);
  next();
}

// Validate product creation
function validateProduct(req, res, next) {
  const { title, description, price, category, condition, location } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  if (!price || isNaN(price) || price <= 0) {
    errors.push('Valid price is required');
  }

  if (!category || category.trim().length < 1) {
    errors.push('Category is required');
  }

  if (condition && !['new', 'like-new', 'good', 'fair'].includes(condition)) {
    errors.push('Invalid condition value');
  }

  if (!location || location.trim().length < 1) {
    errors.push('Location is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Sanitize inputs
  req.body.title = validator.trim(req.body.title);
  req.body.description = validator.trim(req.body.description);
  req.body.category = validator.trim(req.body.category);
  req.body.location = validator.trim(req.body.location);

  next();
}

// Validate email for resend verification
function validateEmail(req, res, next) {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  req.body.email = validator.normalizeEmail(req.body.email);
  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateProduct,
  validateEmail
};
