const JWT = require('jsonwebtoken')

module.exports = {
    signAccessToken: (username, position) => {
        return new Promise((resolve, reject) => {
            const payload = {
                role: position,
                audience: username
            }
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: '12h',
                issuer: 'www.jwbrand.company'
            }
            JWT.sign(payload, secret, options, (err, token) => {
                if (err) {
                    reject(err)
                }
                resolve(`Bearer ${token}`)
            })
        })
    },
    authToken: (req, res, next) => {
        if (!req.headers['authorization']) {
            return res.sendStatus(401)
        }
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) {
                return res.sendStatus(403)
            }
            req.payload = payload
            next()
        })
    }
}