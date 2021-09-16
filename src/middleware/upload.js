const multer = require('multer');

const fileStorageEngine = multer.diskStorage({
    destination: './tmp',
    filename: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, 'data.json')
        } else {
            cb(null, false)
        }
    }
})

const upload = multer({
    storage: fileStorageEngine
})

module.exports = {
    upload
}