const router = require('express').Router();

const { getBagType } = require('../controllers/bagController')
router.get('/', getBagType)

module.exports = router;