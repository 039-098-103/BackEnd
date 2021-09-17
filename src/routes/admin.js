const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const { worker } = new PrismaClient();

const { formatDate } = require('../services/formatDate');

const { upload } = require('../middleware/upload')
const fs = require('fs')

const { encryptPwd } = require('../services/pwd')

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
        for (let i in staffList) {
            staffList[i].DOB = formatDate(staffList[i].DOB)
        }
        res.send(staffList)
    }
})

router.post('/addStaff', upload.single('data'), async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).json("You don't have Permission!")
    } else {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'));
        await worker.create({
            data: {
                username: data.username,
                password: await encryptPwd(data.password),
                firstName: data.firstName,
                lastName: data.lastName,
                DOB: data.DOB,
                position: data.position
            }
        })

        res.send(`Staff ${data.username} has been created!`)
        fs.unlinkSync('./tmp/data.json')
    }
})

router.delete('/delete/:username', async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).json("You don't have Permission!");
    } else {
        const { username } = req.params
        await worker.delete({
            where: {
                username: username
            }
        })
        res.status(200).send(`Staff ${username} has been deleted!`)
    }


})

router.patch('/update', upload.single('data'), async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).json("You don't have Permission!")
    } else {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))

        await worker.updateMany({
            data: {
                username: data.username,
                password: await encryptPwd(data.password),
                firstName: data.firstName,
                lastName: data.lastName,
                DOB: data.DOB
            },
            where: {
                position: 'Admin'
            }
        })
        res.status(200).send(`Admin information has been updated!`)
        fs.unlinkSync('./tmp/data.json')
    }
})

module.exports = router;