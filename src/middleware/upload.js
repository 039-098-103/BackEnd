const multer = require('multer');

var imgName = ''

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, './tmp')
        }
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            cb(null, './images')
        }
    },
    filename: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, 'data.json')
        }
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            imgName = Date.now() + "-" + file.originalname
            cb(null, imgName)
        }
    }
})

function getImgName() {
    let tmp = imgName
    imgName = ''
    return tmp
}

const upload = multer({
    storage: fileStorageEngine
})

module.exports = {
    upload,
    getImgName
}