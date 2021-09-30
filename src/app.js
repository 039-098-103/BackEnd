const express = require('express');
const app = express();

const { authToken } = require('./middleware/accessToken')

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "http://frontend")
    res.header('Access-Control-Allow-Headers', "*")
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', "GET, POST, PATCH, DELETE")
        return res.status(200).json({})
    }
    next();
})

app.use(express.json())
app.use('/auth', require('./services/workerAuth'))
app.use('/admin', authToken, require('./routes/admin'))

//port
app.listen(3000)
module.exports = app;