const router = require('express').Router();

const { getColors } = require('../controllers/colorController')
router.get('/', getColors)

module.exports = router;