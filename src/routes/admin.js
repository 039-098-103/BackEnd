const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const { worker } = new PrismaClient();

router.get('/getStaffList', async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).json("You don't have Permission!")
    } else {
        const staffList = await worker.findMany({
            select: {
                username: true,
                firstName: true,
                lastName: true,
                DOB: true,
            },
            where: {
                position: 'Staff'
            }
        })
        res.send(staffList)
    }
})

module.exports = router;