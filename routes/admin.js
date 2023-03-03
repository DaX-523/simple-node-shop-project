const path = require('path');
const { body } = require('express-validator');
const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
// const doubleCsrf = require('../middleware/double-csrf');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    body('title')
        .isString()
        .isLength({ min: 3, max: 20 })
        .trim(),
    body('price').isFloat(),
    body('description', 'Description should be 5 to 400 characters long!')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .isString()
        .isLength({ min: 3, max: 20 })
        .trim(),
    body('price').isFloat(),
    body('description', 'Description should be 5 to 400 characters long!')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
