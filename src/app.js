const express = require('express');
const app = express();

const { authToken } = require('./middleware/accessToken')

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "http://52.187.115.71")
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    res.header('Access-Control-Allow-Methods', "GET, POST, PATCH, DELETE")
    next();
})

app.use(express.json())
app.use('/auth', require('./services/workerAuth'))
app.use('/admin', authToken, require('./routes/admin'))

//port
app.listen(3000)
module.exports = app;