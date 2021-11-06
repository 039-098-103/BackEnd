const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const { customer } = new PrismaClient();

const { comparePwd } = require('./pwd')
const { signAccessToken } = require('../middleware/accessToken')

router.post('/', async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        res.status(400)
        return res.send('Username or Password is empty!')
    }
    const username_lc = username.toLowerCase();
    try {
        const result = await customer.findMany({
            select: {
                username: true,
                password: true
            },
            where: {
                username: username_lc
            }
        })
        if (result == '') {
            res.status(404)
            return res.send('Username does not exist!')
        }
        const pass = result[0].password
        const pos = 'Customer'

        const resCode = await comparePwd(password, pass)
        if (resCode == 403) {
            res.status(403).send('Wrong Password!')
        }
        if (resCode == 200) {
            const token = await signAccessToken(username_lc, pos)
            res.status(200).send(token)
        }

    } catch (err) {
        res.status(500)
        return res.send('Something went wrong!')
    }
})

module.exports = router;