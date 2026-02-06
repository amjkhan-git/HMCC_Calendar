const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Booking creation validation (public)
const createBookingValidation = [
  body('sponsor_name')
    .notEmpty()
    .withMessage('Sponsor name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Sponsor name must be between 2 and 100 characters')
    .trim(),
  
  body('sponsor_email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('sponsor_phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format')
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone number must be between 7 and 20 characters'),
  
  body('sponsor_organization')
    .notEmpty()
    .withMessage('Family name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Family name must be between 2 and 100 characters')
    .trim(),
  
  body('food_vendor_name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Food vendor name must be less than 100 characters')
    .trim(),
  
  body('food_vendor_contact_name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Food vendor contact name must be less than 100 characters')
    .trim(),
  
  body('food_vendor_phone')
    .optional({ checkFalsy: true })
    .matches(/^[\d\s\-\+\(\)]*$/)
    .withMessage('Invalid vendor phone number format')
    .isLength({ max: 20 }),
  
  body('expected_guests')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 500 })
    .withMessage('Expected guests must be between 1 and 500'),
  
  body('special_notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Special notes must be less than 500 characters')
    .trim(),
  
  body('payment_method')
    .optional({ checkFalsy: true })
    .isIn(['check', 'credit_card', 'cash', 'zelle', 'paypal'])
    .withMessage('Invalid payment method'),
  
  validate
];

// Admin booking update validation
const adminUpdateBookingValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid booking ID'),
  
  body('sponsor_name')
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 100 })
    .withMessage('Sponsor name must be between 2 and 100 characters')
    .trim(),
  
  body('sponsor_email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('sponsor_phone')
    .optional({ checkFalsy: true })
    .matches(/^[\d\s\-\+\(\)]*$/)
    .withMessage('Invalid phone number format'),
  
  body('sponsor_organization')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .trim(),
  
  body('food_vendor_name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .trim(),
  
  body('food_vendor_contact_name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .trim(),
  
  body('food_vendor_phone')
    .optional({ checkFalsy: true })
    .isLength({ max: 20 }),
  
  body('expected_guests')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 500 }),
  
  body('special_notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .trim(),
  
  body('food_amount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Food amount must be a positive number'),
  
  body('cleaning_amount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cleaning amount must be a positive number'),
  
  body('payment_method')
    .optional({ checkFalsy: true })
    .isIn(['check', 'credit_card', 'cash', 'zelle', 'paypal'])
    .withMessage('Invalid payment method'),
  
  body('check_number')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 })
    .trim(),
  
  body('mohid_reference')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .trim(),
  
  body('amount_paid')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Amount paid must be a positive number'),
  
  body('payment_status')
    .optional({ checkFalsy: true })
    .isIn(['pending', 'partial', 'completed', 'cancelled', 'refunded'])
    .withMessage('Invalid payment status'),
  
  body('admin_comment')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .trim(),
  
  validate
];

// Payment status update validation
const paymentStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid booking ID'),
  
  body('payment_status')
    .isIn(['pending', 'partial', 'completed', 'cancelled', 'refunded'])
    .withMessage('Invalid payment status'),
  
  body('amount_paid')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Amount paid must be a positive number'),
  
  body('payment_method')
    .optional({ checkFalsy: true })
    .isIn(['check', 'credit_card', 'cash', 'zelle', 'paypal'])
    .withMessage('Invalid payment method'),
  
  body('check_number')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }),
  
  body('mohid_reference')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }),
  
  validate
];

// Date parameter validation
const dateParamValidation = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  
  validate
];

// ID parameter validation
const idParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  validate
];

// Search query validation
const searchValidation = [
  query('q')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
    .trim()
    .escape(),
  
  validate
];

// Admin login validation
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Approval validation
const approvalValidation = [
  body('rejection_reason')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be less than 500 characters')
    .trim()
    .escape(),
  
  validate
];

module.exports = {
  validate,
  createBookingValidation,
  adminUpdateBookingValidation,
  paymentStatusValidation,
  dateParamValidation,
  idParamValidation,
  searchValidation,
  loginValidation,
  approvalValidation
};
