const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { worker } = new PrismaClient();

const { comparePwd } = require('./pwd')
const { signAccessToken } = require('../middleware/accessToken')

router.post('/', async(req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        res.status(400).send("Username or Password is empty!")
    } else {
        const username_lc = username.toLowerCase()
        try {
            const result = await worker.findMany({
                select: {
                    username: true,
                    password: true,
                    position: true
                },
                where: {
                    username: username_lc
                }
            })
            if (result == '') {
                res.status(404)
                return res.send('Username does not exist!')
            } else {
                const pass = result[0].password
                const pos = result[0].position

                const resCode = await comparePwd(password, pass)
                if (resCode == 403) {
                    res.status(403)
                    return res.send("Wrong Password!")
                }
                if (resCode == 200) {
                    const token = await signAccessToken(username_lc, pos)
                    res.status(200).send(token)
                } else {
                    res.status(401)
                    return res.send("You don't have permission!")
                }

            }

        } catch (err) {
            res.status(500)
            return res.send("Something Went Wrong!")
        }
    }
})

module.exports = router;