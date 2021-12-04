const express = require('express');
const app = express();

const { authToken } = require('./middleware/accessToken')

const { authAdmin, authStaff } = require('./middleware/permissions')

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
app.use('/api/admin', authToken, authAdmin, require('./routes/admin'))
app.use('/api/getProduct', require('./routes/productDetail'))
app.use('/api/auth', require('./services/auth'))
app.use('/api/customer', require('./routes/customer'))
app.use('/api/getColors', require('./routes/color'))
app.use('/api/getBagType', require('./routes/bag'))
app.use('/api/staff', authToken, authStaff, require('./routes/staff'))

app.listen(3000)
module.exports = app;