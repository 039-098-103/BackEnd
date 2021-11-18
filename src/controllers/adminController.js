const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { worker } = new PrismaClient();
const { formatDate } = require('../services/formatDate')

const fs = require('fs')

const { encryptPwd, comparePwd } = require('../services/pwd')

const { resMsg } = require('../middleware/resMsg')

const getStaffList = async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401)
        return res.send("You don't have Permission!")
    }
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

const addWorker = async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401)
        return res.send("You don't have Permission!")
    }
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'));
        //username to lowercase
        data.username = data.username.toLowerCase();
        //check if username duplicate
        const isDuplicate = await findUser(data.username)
        if (isDuplicate) {
            res.status(409)
            return res.send("Username already exists!")
        }
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

        fs.unlinkSync('./tmp/data.json')
    } catch (err) {
        res.status(500).send("Could not add user!")
    }
}

async function findUser(username) {
    const res = await worker.findUnique({
        where: {
            username: username
        }
    })
    return res === null ? false : true
}

const deleteStaff = async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401)
        return res.send("You don't have Permission!");
    }
    const { username } = req.params
    const username_lc = username.toLowerCase();
    if (!username) {
        res.status(400)
        return res.send("Username is empty!")
    }
    //identify admin
    const { password } = req.body
    if (!password) {
        res.status(400)
        return res.send("Password is empty!")
    }
    const admin_usr = req.payload.audience;
    try {
        const isValid = await confirmAdmin(admin_usr, password);
        if (isValid == 200) {
            try {
                //check if username exists
                const isExists = await findUser(username_lc);
                if (!isExists) {
                    res.status(400)
                    return res.send("Username not found!")
                }
                const isAdmin = await isUserAdmin(username_lc);
                if (isAdmin) {
                    res.status(401)
                    return res.send("You don't have Permission!")
                }

                await worker.delete({
                    where: {
                        username: username_lc
                    }
                })
                res.status(200).send(`Staff ${username_lc} has been deleted!`)

            } catch (err) {
                res.status(500).send("Could not delete the Staff!")
            }
        }
        else {
            res.status(isValid)
            return res.send(resMsg(isValid))
        }

    } catch (err) {
        res.status(500).send("Something Went Wrong!")
    }
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

const updateAdmin = async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401)
        return res.send("You don't have Permission!")
    }
    const username = req.payload.audience;
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
        if (data.password === '') {
            data.DOB = new Date(data.DOB)
            await prisma.$executeRaw`UPDATE worker SET firstName=${data.firstName}, lastName=${data.lastName}, DOB=${data.DOB} WHERE position='Admin' AND username=${username}`
            res.status(200).send("Admin info has been updated!")
        } else {
            await worker.updateMany({
                data: {
                    password: await encryptPwd(data.password),
                    firstName: data.firstName,
                    lastName: data.lastName,
                    DOB: new Date(data.DOB)
                },
                where: {
                    position: 'Admin',
                    username: username
                }
            })
            res.status(200).send(`Admin info has been updated!`)
        }
        fs.unlinkSync('./tmp/data.json')
    } catch (err) {
        res.status(500).send('Could not update!')
    }

}

const getAdminInfo = async (req, res) => {
    if (req.payload.role != "Admin") {
        res.status(401)
        return res.send("You don't have Permission!");
    }
    const username = req.payload.audience;
    try {
        const adminInfo = await worker.findMany({
            select: {
                username: true,
                firstName: true,
                lastName: true,
                DOB: true
            },
            where: {
                position: 'Admin',
                username: username
            }
        })
        adminInfo[0].DOB = formatDate(adminInfo[0].DOB)
        res.status(200).send(adminInfo);
    } catch (err) {
        res.status(500).send("Could not get info!")
    }
}

const deleteAdmin = async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401)
        return res.send("You don't have Permission!")
    }
    const { password } = req.body
    if (!password) {
        res.status(400)
        return res.send("Password is empty!")
    }
    const username = req.payload.audience;
    try {
        const isValid = await confirmAdmin(username, password);
        if (isValid == 200) {
            try {
                await worker.delete({
                    where: {
                        username: username
                    }
                })
                res.status(200).send(`Admin ${username} has been deleted.`)
            } catch (err) {
                res.status(500)
                return res.send("Something Went Wrong!")
            }
        }
        else {
            res.status(isValid)
            return res.send(resMsg(isValid))
        }
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}
module.exports = {
    getStaffList,
    addWorker,
    deleteStaff,
    updateAdmin,
    getAdminInfo,
    deleteAdmin
}