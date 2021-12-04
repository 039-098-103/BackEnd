const router = require('express').Router()
const { getInfo, updateInfo,getOrder, addProduct} = require('../controllers/staffController')
const { upload } = require('../middleware/upload')

router.get('/getInfo', getInfo)

router.patch('/updateInfo', upload.single('data'), updateInfo)

router.get('/getOrderList', getOrder)

router.post('/addProduct', upload.any(), addProduct)
module.exports = router