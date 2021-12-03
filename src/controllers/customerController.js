const { PrismaClient } = require('@prisma/client')
const { customer, cartItem, productDetail, orders, orderDetail } = new PrismaClient()
const prisma = new PrismaClient()
const fs = require('fs')
const { hashPwd } = require('../services/pwd')
const { formatDate } = require('../services/formatDate')

const accRegister = async (req, res) => {
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
                password: await hashPwd(data.password)
            }
        })

        res.status(200).send(`User ${data.username} has been created!`)

        fs.unlinkSync('./tmp/data.json')
    } catch (err) {
        fs.unlinkSync('./tmp/data.json')
        res.status(500)
        return res.send('Something Went Wrong!')
    }
}

async function findUser(username) {
    const result = await customer.findUnique({
        where: {
            username: username
        }
    })
    return result === null ? false : true
}

const getCart = async (req, res) => {
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
                },
                cartItemId: true

            },
            where: {
                username: username
            }
        })

        const item = [];
        for (let i in result) {
            const cartItemId = result[i].cartItemId;
            const productId = result[i].ProductDetail.Product.productId;
            const productDetailId = result[i].ProductDetail.productDetailId
            const productName = result[i].ProductDetail.Product.productName;
            const price = result[i].ProductDetail.Product.price;
            const imageName = result[i].ProductDetail.Product.imageName;
            const bagTypeId = result[i].ProductDetail.Product.BagType.bagTypeId;
            const bagTypeName = result[i].ProductDetail.Product.BagType.bagTypeName;
            const colorId = result[i].ProductDetail.Color.colorId;
            const colorName = result[i].ProductDetail.Color.colorName;
            item[i] = { cartItemId, productId, productName, price, imageName, bagTypeId, bagTypeName, colorId, colorName, productDetailId }
        }

        res.status(200).send(item);
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

const addToCart = async (req, res) => {
    const id = Number(req.params.id)

    if (!id) {
        res.status(400)
        return res.send("ProductDetail id is required!")
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
    const itemInCart = await cartItem.count({
        where: {
            username: username
        }
    })
    if (itemInCart == 30) {
        res.status(405)
        return res.send("Items in Cart is full!.")
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
}

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
        if (pbid == bid) {
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

const removeFromCart = async (req, res) => {
    const id = Number(req.params.id)
    if (!id) {
        res.status(400)
        return res.send("CartItem id is required!")
    }
    const username = req.payload.audience;
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }

    const itemExist = await findCartItem(username, id);
    if (!itemExist) {
        res.status(404)
        return res.send("Item does not exist!")
    }

    try {
        await cartItem.delete({
            where: {
                cartItemId: id
            }
        })
        res.status(200).send("Item deleted!")
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }

}

async function findCartItem(username, id) {
    const result = await cartItem.findMany({
        where: {
            username: username,
            cartItemId: id
        }
    })
    return result == '' ? false : true;
}

const getInfo = async (req, res) => {
    const username = req.payload.audience;
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    try {
        const result = await customer.findUnique({
            select: {
                username: true,
                firstName: true,
                lastName: true
            },
            where: {
                username: username
            }
        })
        res.status(200).send(result)
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

const editInfo = async (req, res) => {
    const username = req.payload.audience
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
        if (data.password === '') {
            await prisma.$executeRaw`UPDATE customer SET firstName=${data.firstName}, lastName=${data.lastName} WHERE username=${username}`
            res.status(200).send("Your info has been updated!")
        } else {
            await customer.update({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    password: await hashPwd(data.password)
                }, where: {
                    username: username
                }
            })
            res.status(200).send("Your info has been updated!")
        }
        fs.unlinkSync('./tmp/data.json')

    } catch (err) {
        fs.unlinkSync('./tmp/data.json')
        res.status(500)
        return res.send("Could not update info!")
    }
}

const getOrderList = async (req, res) => {
    const username = req.payload.audience
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    try {
        const result = await orders.findMany({
            include: {
                OrderDetail: {
                    include: {
                        ProductDetail: {
                            include: {
                                Product: {
                                    include: {
                                        BagType: true
                                    }
                                },
                                Color: true
                            }
                        }
                    }
                }
            },
            where: {
                username: username
            }
        })
        const ord = []
        for (let i in result) {
            const orderId = result[i].orderId
            const quantity = result[i].quantity
            const total = result[i].total
            const deliveryDate = formatDate(result[i].deliveryDate)
            const address = result[i].address
            const Product = []
            const od = result[i].OrderDetail
            for (let j in od) {
                const productId = od[j].ProductDetail.productId
                const productName = od[j].ProductDetail.Product.productName
                const price = od[j].ProductDetail.Product.price
                const imageName = od[j].ProductDetail.Product.imageName
                const bagTypeId = od[j].ProductDetail.Product.bagTypeId
                const bagTypeName = od[j].ProductDetail.Product.BagType.bagTypeName
                const colorId = od[j].ProductDetail.Color.colorId
                const colorName = od[j].ProductDetail.Color.colorName
                Product[j] = { productId, productName, price, imageName, bagTypeId, bagTypeName, colorId, colorName }

            }
            ord[i] = { orderId, quantity, total, deliveryDate, address, Product }
        }
        if (result == '') {
            res.status(404)
            return res.send("Orders are empty!")
        }
        res.status(200).send(ord)
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

const addOrder = async (req, res) => {
    const username = req.payload.audience
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))

        var total = 0
        var quantity = 0
        for (let i in data) {
            total += Number(data[i].price)
            quantity += 1

        }
        const deliveryDate = new Date(Date.now() + 12096e5)

        await orders.createMany({
            data: {
                address: "-",
                deliveryDate: deliveryDate,
                quantity: quantity,
                total: total,
                username: username
            }
        })

        const order_res = await prisma.$queryRaw`SELECT orderId from Orders where username=${username} order by orderId DESC limit 1`
        const o_id = order_res[0].orderId

        for (let i in data) {
            await orderDetail.createMany({
                data: {
                    orderId: o_id,
                    productDetailId: data[i].productDetailId
                }
            })
            await cartItem.delete({
                where: {
                    cartItemId: data[i].cartItemId
                }
            })
        }

        fs.unlinkSync('./tmp/data.json')
        res.status(200).send("Successfully ordered.")
    } catch (err) {
        res.status(500)
        fs.unlinkSync('./tmp/data.json')
        return res.send("Something Went Wrong!")
    }
}

const editAddress = async (req, res) => {
    const username = req.payload.audience
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    try {
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
        await prisma.$executeRaw`UPDATE orders set address=${data.address} where username=${username} and orderId=${data.orderId}`
        fs.unlinkSync('./tmp/data.json')
        res.status(200).send("Address has been updated.")
    } catch (err) {
        res.status(500)
        fs.unlinkSync('./tmp/data.json')
        return res.send("Something Went Wrong!")
    }
}

const updateCart = async (req, res) => {
    const id = Number(req.params.id)
    const pid = Number(req.params.pid)
    if (!id || !pid) {
        res.status(400)
        return res.send("CartItem id or productDetail id is empty!")
    }
    const username = req.payload.audience;
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    const itemExist = await findCartItem(username, id);
    if (!itemExist) {
        res.status(404)
        return res.send("Item does not exist!")
    }
    const itemInCart = await cartItem.count({
        where: {
            username: username
        }
    })
    if (itemInCart == 30) {
        res.status(405)
        return res.send("Items in Cart is full!.")
    }
    try {
        await cartItem.updateMany({
            data:{
                productDetailId: Number(pid)
            },
            where:{
                cartItemId: Number(id)
            }
        })
        res.status(200).send("Item updated!")
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }

}

module.exports = {
    accRegister,
    getCart,
    addToCart,
    removeFromCart,
    getInfo,
    editInfo,
    getOrderList,
    addOrder,
    editAddress,
    updateCart
}