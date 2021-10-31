const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { worker } = new PrismaClient();

const { formatDate } = require('../services/formatDate');

const { upload } = require('../middleware/upload')
const fs = require('fs')

const { encryptPwd, comparePwd } = require('../services/pwd')

const { viewAdminInfo } = require('../middleware/permissions')
router.get('/getStaffList', async (req, res) => {
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
            res.status(500).send("Could not get StaffList!")
        }
    }
})

router.post('/addWorker', upload.single('data'), async (req, res) => {
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
                res.status(200).send(`${data.position} ${data.username} has been created!`)
            }
            fs.unlinkSync('./tmp/data.json')
        } catch (err) {
            res.status(500).send("Could not add user!")
        }

    }


})

router.delete('/delete/:username', async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!");
    } else {
        const { username } = req.params
        const username_lc = username.toLowerCase();
        if (!username) {
            res.status(400).send("Username is empty!")
        } else {
            //identify admin
            const { admin_usr, password } = req.body
            if (!admin_usr || !password) {
                res.status(400).send("Username or Password is empty!")
            } else {
                const admin_usrlc = admin_usr.toLowerCase()
                try {
                    const isValid = await confirmAdmin(admin_usrlc, password);
                    if (isValid == 200) {
                        try {
                            //check if username exists
                            const isExists = await findUser(username_lc);
                            const isAdmin = await isUserAdmin(username_lc);
                            if (isAdmin) {
                                res.status(401).send("You don't have Permission!")
                            }
                            if (!isExists) {
                                res.status(400).send("Username not found!")
                            } else if (!isAdmin) {
                                await worker.delete({
                                    where: {
                                        username: username_lc
                                    }
                                })
                                res.status(200).send(`Staff ${username_lc} has been deleted!`)
                            }
                        } catch (err) {
                            res.status(500).send("Could not delete the Staff!")
                        }
                    }
                    if (isValid == 404) {
                        res.status(404).send("Username does not exist!")
                    }
                    if (isValid == 403) {
                        res.status(403).send("Wrong Password!")
                    }
                    if (isValid == 401) {
                        res.status(401).send("You don't have permission!")
                    }

                } catch (err) {
                    res.status(500).send("Something Went Wrong!")
                }

            }

        }
    }

})

async function confirmAdmin(username, password) {
    try {
        const result = await worker.findUnique({
            select: {
                password: true
            },
            where: {
                username: username
            }
        })
        if (result == null) {
            return 404
        } else {
            const pass = result.password
            const resCode = await comparePwd(password, pass)
            if (resCode == 200) {
                return 200
            }
            if (resCode == 403) {
                return 403
            }
            else {
                return 401
            }
        }
    } catch (err) {
        return 500
    }
}

router.patch('/update', upload.single('data'), async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401).send("You don't have Permission!")
    } else {
        try {
            const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
            //username to lowercase
            data.username = data.username.toLowerCase();
            if (data.password === '') {
                data.DOB = new Date(data.DOB)
                await prisma.$executeRaw`UPDATE worker SET username=${data.username}, firstName=${data.firstName}, lastName=${data.lastName}, DOB=${data.DOB} WHERE position='Admin'`
                res.status(200).send("Admin info has been updated!")
            } else {
                await worker.updateMany({
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
            res.status(500).send('Could not update!')
        }

    }
})

async function findUser(username) {
    const res = await worker.findUnique({
        where: {
            username: username
        }
    })
    return res === null ? false : true
}

async function isUserAdmin(username) {
    const res = await worker.findUnique({
        select: {
            position: true
        },
        where: {
            username: username
        }
    })
    return res.position == 'Admin' ? true : false;
}

router.get('/getInfo/:username', async (req, res) => {
    if (req.payload.role != "Admin") {
        res.status(401).send("You don't have Permission!");
    } else {
        const { username } = req.params
        const username_lc = username.toLowerCase();
        if(!username){
            res.status(400).send("Username is empty!")
        }else{
            //check user token
            if(!viewAdminInfo(username_lc, req.payload.audience)){
                res.status(403);
                return res.send("You don't have Permission!")
            }
            try {
                const adminInfo = await worker.findMany({
                    select:{
                        username: true,
                        firstName:true,
                        lastName: true,
                        DOB: true
                    },
                    where: {
                        position: 'Admin',
                        username: username_lc
                    }
                })
                adminInfo[0].DOB = formatDate(adminInfo[0].DOB)
                res.status(200).send(adminInfo);
            } catch (err) {
                res.status(500).send("Could not get info!")
            }
        }
    }
})

module.exports = router;