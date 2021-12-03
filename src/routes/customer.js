const router = require('express').Router();
const { upload } = require('../middleware/upload')
const { accRegister, getCart, addToCart, removeFromCart, getInfo, editInfo, getOrderList, addOrder, editAddress, updateCart } = require('../controllers/customerController')
const { authToken } = require('../middleware/accessToken')

router.post('/register', upload.single('data'), accRegister);

router.get('/getCart', authToken, getCart)

router.post('/addToCart/:id', authToken, addToCart)

router.delete('/removeFromCart/:id', authToken, removeFromCart)

router.get('/accountInfo', authToken, getInfo)

router.patch('/editInfo', authToken, upload.single('data') ,editInfo)

router.get('/getOrders', authToken, getOrderList )

router.post('/checkout', authToken, upload.single('data'), addOrder )

router.patch('/updateAddress', authToken, upload.single('data'), editAddress)

router.patch('/updateCart/:id/:pid', authToken, updateCart)

module.exports = router;