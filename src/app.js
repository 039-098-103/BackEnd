const express = require('express');
const app = express();

const { authToken } = require('./middleware/accessToken')

app.use(express.json())
app.use('/worker', require('./services/workerAuth'))
app.use('/admin', authToken, require('./routes/admin'))

//port
app.listen(3000)
module.exports = app;