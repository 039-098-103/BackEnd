const router = require('express').Router()
const { getInfo, updateInfo } = require('../controllers/staffController')
const { upload } = require('../middleware/upload')

router.get('/getInfo', getInfo)

router.patch('/updateInfo', upload.single('data'), updateInfo)

module.exports = router