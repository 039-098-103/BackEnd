const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')
const { customer, cartItem, productDetail } = new PrismaClient();
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
            res.status(409)
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

router.get('/getCart', authToken, async (req, res) => {
    const username = req.payload.audience;
    if (!findUser(username)) {
        res.status(404)
        return res.status("Username does not exist!")
    }
    try {
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
        for (let i in result) {
            const productId = result[i].ProductDetail.Product.productId;
            const productName = result[i].ProductDetail.Product.productName;
            const price = result[i].ProductDetail.Product.price;
            const imageName = result[i].ProductDetail.Product.imageName;
            const bagTypeId = result[i].ProductDetail.Product.BagType.bagTypeId;
            const bagTypeName = result[i].ProductDetail.Product.BagType.bagTypeName;
            const colorId = result[i].ProductDetail.Color.colorId;
            const colorName = result[i].ProductDetail.Color.colorName;
            item[i] = { productId, productName, price, imageName, bagTypeId, bagTypeName, colorId, colorName }
        }

        res.status(200).send(item);
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
})

router.post('/addToCart/:id', authToken, async (req, res) => {
    const id = Number(req.params.id)

    if (!id) {
        res.status(400)
        return res.send("ProductDetail Id is empty!")
    }
    const username = req.payload.audience;
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }

    const itemExist = await findItem(id);
 
    if (!itemExist) {
        res.status(404)
        return res.send("Item does not exist!")
    }

    try {
        const isAdded = await findItemInCart(username, id)
        const dupBagType = await checkBagType(username, id);
        if (isAdded || dupBagType) {
            res.status(409)
            return res.send("Could not add!")
        }

        await cartItem.create({
            data: {
                productDetailId: id,
                username: username
            }
        })
        res.status(200).send(`Item added!`)
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
})

async function findItemInCart(username, pid) {
    const result = await cartItem.findMany({
        where: {
            username: username,
            productDetailId: pid
        }
    })
    return result == '' ? false : true;
}
async function checkBagType(username, pid) {
    const bag = await cartItem.findMany({
        select: {
            ProductDetail: {
                include: {
                    Product: {
                        select: {
                            bagTypeId: true
                        }
                    }
                }
            }
        },
        where: {
            username: username
        }
    })

    const prod = await productDetail.findMany({
        select: {
            Product: {
                select: {
                    bagTypeId: true
                }
            }
        },
        where: {
            productDetailId: pid
        }
    })
    const bid = prod[0].Product.bagTypeId
    for (let i in bag) {
        let pbid = bag[i].ProductDetail.Product.bagTypeId
        if(pbid == bid){
            return true
        }
    }
    return false
}
async function findItem(itemId) {
    const result = await productDetail.findMany({
        where: {
            productDetailId: itemId
        }
    })
    return result == '' ? false : true;
}

module.exports = router;