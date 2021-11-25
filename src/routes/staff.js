const router = require('express').Router()
const { getInfo, updateInfo,getOrder } = require('../controllers/staffController')
const { upload } = require('../middleware/upload')

router.get('/getInfo', getInfo)

router.patch('/updateInfo', upload.single('data'), updateInfo)

router.get('/getOrderList', getOrder)

module.exports = router