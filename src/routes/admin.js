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
        try {
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
        } catch (err) {
            res.status(500).send("Something went wrong!")
        }
    }
})

router.post('/addStaff', upload.single('data'), async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!")
    } else {
        try {
            const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'));
            //check if username duplicate
            const isDuplicate = await findUser(data.username)
            if (isDuplicate) {
                res.status(400).send("Username already exists!")
            } else {
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
            }
        } catch (err) {
            res.send(400).send("Could not add Staff!")
        }
        fs.unlinkSync('./tmp/data.json')
    }


})

router.delete('/delete/:username', async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!");
    } else {
        const { username } = req.params
        if (!username) {
            res.send(400).send("Username is empty.")
        } else {
            try {
                //check if username exists
                const isExists = await findUser(username);
                if (!isExists) {
                    res.status(400).send("Username not found!")
                } else {
                    await worker.delete({
                        where: {
                            username: username
                        }
                    })
                    res.status(200).send(`Staff ${username} has been deleted!`)
                }
            } catch (err) {
                res.send(503).send("Could not delete the Staff!")
            }

        }
    }

})

router.patch('/update', upload.single('data'), async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!")
    } else {
        try {
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

        } catch (err) {
            res.status(400).send('Could not update!')
        }
        fs.unlinkSync('./tmp/data.json')
    }
})

async function findUser(username) {
    const res = await worker.findUnique({
        where: {
            username: username
        }
    })
    if (res) {
        return true
    } else {
        return false
    }
}

module.exports = router;