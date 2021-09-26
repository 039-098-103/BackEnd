const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { worker } = new PrismaClient();

const { formatDate } = require('../services/formatDate');

const { upload } = require('../middleware/upload')
const fs = require('fs')

const { encryptPwd } = require('../services/pwd')

router.get('/getStaffList', async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!")
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
            res.status(400).send("Could not get StaffList!")
        }
    }
})

router.post('/addStaff', upload.single('data'), async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!")
    } else {
        try {
            const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'));
            //username to lowercase
            data.username = data.username.toLowerCase();
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
                        DOB: new Date(data.DOB),
                        position: data.position
                    }
                })
                res.send(`Staff ${data.username} has been created!`)
            }
            fs.unlinkSync('./tmp/data.json')
        } catch (err) {
            res.send(400).send("Could not add Staff!")
        }

    }


})

router.delete('/delete/:username', async(req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!");
    } else {
        const { username } = req.params
        const username_lc = username.toLowerCase();
        if (!username) {
            res.send(400).send("Username is empty.")
        } else {
            try {
                //check if username exists
                const isExists = await findUser(username_lc);
                if (!isExists) {
                    res.status(400).send("Username not found!")
                } else {
                    await worker.delete({
                        where: {
                            username: username_lc
                        }
                    })
                    res.status(200).send(`Staff ${username_lc} has been deleted!`)
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
                //username to lowercase
            data.username = data.username.toLowerCase();
            if (data.password === '') {
                data.DOB = new Date(data.DOB)
                await prisma.$executeRaw `UPDATE worker SET username=${data.username}, firstName=${data.firstName}, lastName=${data.lastName}, DOB=${data.DOB} WHERE position='Admin'`
                res.status(200).send("Admin info has been updated!")
            } else {
                await worker.update({
                    data: {
                        username: data.username,
                        password: await encryptPwd(data.password),
                        firstName: data.firstName,
                        lastName: data.lastName,
                        DOB: new Date(data.DOB)
                    },
                    where: {
                        position: 'Admin'
                    }
                })
                res.status(200).send(`Admin info has been updated!`)
            }
            fs.unlinkSync('./tmp/data.json')
        } catch (err) {
            res.status(400).send('Could not update!')
        }

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

router.get('/getInfo', async(req, res) => {
    if (req.payload.role != "Admin") {
        res.status(401).send("You don't have Permission!");
    } else {
        try {
            const adminInfo = await worker.findMany({
                where: {
                    position: 'Admin'
                }
            })
            adminInfo[0].DOB = formatDate(adminInfo[0].DOB)
            res.status(200).send(adminInfo);
        } catch (err) {
            res.status(400).send("Could not get info!")
        }
    }
})

module.exports = router;