const router = require('express').Router();
const { getProduct, getProductById } = require('../controllers/productController')

router.get('/', getProduct)

router.get('/:id', getProductById)

module.exports = router;