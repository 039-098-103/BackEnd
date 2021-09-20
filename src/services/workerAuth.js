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

        try {
            const result = await worker.findMany({
                select: {
                    username: true,
                    password: true,
                    position: true
                },
                where: {
                    username: username
                }
            })

            const pass = result[0].password
            const pos = result[0].position
            if (pass) {
                const resCode = await comparePwd(password, pass)
                if (resCode == 403) {
                    res.status(403).send("Wrong Password!")
                }
                if (resCode == 200) {
                    const token = await signAccessToken(username, pos)
                    res.status(200).send(token)
                } else {
                    res.status(401).send("You don't have permission!")
                }
            } else {
                res.status(404).send("User not found!")
            }
        } catch (err) {
            res.status(400).send("Could not login!")
        }
    }
})

module.exports = router;