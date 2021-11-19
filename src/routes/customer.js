const router = require('express').Router();
const { upload } = require('../middleware/upload')
const { accRegister, getCart, addToCart, removeFromCart, getInfo } = require('../controllers/customerController')
const { authToken } = require('../middleware/accessToken')

router.post('/register', upload.single('data'), accRegister);

router.get('/getCart', authToken, getCart)

router.post('/addToCart/:id', authToken, addToCart)

router.delete('/removeFromCart/:id', authToken, removeFromCart)

router.get('/accountInfo', authToken, getInfo)

module.exports = router;