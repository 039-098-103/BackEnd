const router = require('express').Router();
const { getStaffList, addWorker, deleteStaff, updateAdmin, getAdminInfo, deleteAdmin } = require('../controllers/adminController')
const { upload } = require('../middleware/upload')

router.get('/getStaffList', getStaffList);

router.post('/addWorker', upload.single('data'), addWorker);

router.delete('/deleteStaff/:username', deleteStaff)

router.patch('/update', upload.single('data'), updateAdmin)

router.get('/getInfo', getAdminInfo)

//admin self delete acc
router.delete('/delete', deleteAdmin)

module.exports = router;