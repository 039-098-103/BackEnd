const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const { customer } = new PrismaClient();

const { upload } = require('../middleware/upload')
const fs = require('fs')

const { encryptPwd } = require('../services/pwd')

router.post('/register', upload.single('data'), async(req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
        data.username = data.username.toLowerCase();

        const isDuplicate = await findUser(data.username)
        if (isDuplicate) {
            res.status(400).send('Username already exist!')
        } else {
            await customer.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    password: await encryptPwd(data.password)
                }
            })

            res.status(200).send(`User ${data.username} has been created!`)
        }
        fs.unlinkSync('./tmp/data.json')
    } catch (err) {
        console.log(err)
        res.status(500).send('Something went wrong!')
    }
})

async function findUser(username) {
    const result = await customer.findUnique({
        where: {
            username: username
        }
    })
    return result === null ? false : true
}

module.exports = router;