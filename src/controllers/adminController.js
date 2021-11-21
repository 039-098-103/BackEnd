const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { worker } = new PrismaClient();
const { formatDate } = require('../services/formatDate')

const fs = require('fs')

const { encryptPwd } = require('../services/pwd')

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

        if (staffList == '') {
            res.status(404)
            return res.send("StaffList are empty!")
        }

        for (let i in staffList) {
            staffList[i].DOB = formatDate(staffList[i].DOB)
        }
        res.status(200).send(staffList)
    } catch (err) {
        res.status(500)
        return res.send("Could not get StaffList!")
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
        fs.unlinkSync('./tmp/data.json')
        res.status(500)
        return res.send("Could not add user!")
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
        res.status(500)
        return res.send("Could not delete the Staff!")
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
        fs.unlinkSync('./tmp/data.json')
        res.status(500)
        return res.send('Could not update!')
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
        res.status(500)
        return res.send("Could not get info!")
    }
}

const deleteAdmin = async (req, res) => {
    if (req.payload.role != 'Admin') {
        res.status(401)
        return res.send("You don't have Permission!")
    }

    const username = req.payload.audience;

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


module.exports = {
    getStaffList,
    addWorker,
    deleteStaff,
    updateAdmin,
    getAdminInfo,
    deleteAdmin
}