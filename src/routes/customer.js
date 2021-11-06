const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const { customer, cartItem } = new PrismaClient();
const { upload } = require('../middleware/upload')
const fs = require('fs')

const { encryptPwd } = require('../services/pwd')

const { authToken } = require('../middleware/accessToken')

router.post('/register', upload.single('data'), async (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
        data.username = data.username.toLowerCase();

        const isDuplicate = await findUser(data.username)
        if (isDuplicate) {
            res.status(400)
            return res.send('Username already exist!')
        }
        await customer.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                password: await encryptPwd(data.password)
            }
        })

        res.status(200).send(`User ${data.username} has been created!`)

        fs.unlinkSync('./tmp/data.json')
    } catch (err) {
        res.status(500)
        return res.send('Something went wrong!')
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

//get item from cart for logged in customer
router.get('/getCart', authToken, async (req, res) => {
    try {
        const username = req.payload.audience;
        if(!findUser(username)){
            res.status(404)
            return res.status("Username does not exist!")
        }
        const result = await cartItem.findMany({
            select: {
                ProductDetail:
                {
                    include: {
                        Product: {
                            include: {
                                BagType: true
                            }
                        },
                        Color: true
                    }
                }

            },
            where: {
                username: username
            }
        })
        
        const item = [];
        for(let i in result){
            const productId = result[i].ProductDetail.Product.productId;
            const productName = result[i].ProductDetail.Product.productName;
            const price = result[i].ProductDetail.Product.price;
            const imageName = result[i].ProductDetail.Product.imageName;
            const bagTypeId = result[i].ProductDetail.Product.BagType.bagTypeId;
            const bagTypeName = result[i].ProductDetail.Product.BagType.bagTypeName;
            const colorId = result[i].ProductDetail.Color.colorId;
            const colorName = result[i].ProductDetail.Color.colorName;
            item[i] = {productId, productName, price, imageName, bagTypeId, bagTypeName, colorId, colorName}
        }

        res.status(200).send(item);
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
})
module.exports = router;