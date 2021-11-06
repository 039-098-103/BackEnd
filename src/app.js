const express = require('express');
const app = express();

const { authToken } = require('./middleware/accessToken')

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "*")
    res.header('Access-Control-Allow-Headers', "*")
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', "GET, POST, PATCH, DELETE")
        return res.status(200).json({})
    }
    next();
})

app.use(express.json())
app.use(express.static('images'))
app.use('/api/worker/auth', require('./services/workerAuth'))
app.use('/api/admin', authToken, require('./routes/admin'))
app.use('/api/getProduct', require('./routes/productDetail'))
app.use('/api/auth', require('./services/auth'))
app.use('/api/customer', require('./routes/customer'))

//port
app.listen(3000)
module.exports = app;