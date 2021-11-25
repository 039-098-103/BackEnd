const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { worker, orders, orderDetail,customer } = new PrismaClient()
const { formatDate } = require('../services/formatDate')
const fs = require('fs')
const { hashPwd } = require('../services/pwd')

const getInfo = async (req, res) => {
    const username = req.payload.audience
    if (!findUser(username)) {
        res.status(404)
        return res.send("Username does not exist!")
    }
    try {
        const result = await worker.findUnique({
            select: {
                username: true,
                firstName: true,
                lastName: true,
                DOB: true,
                position: true
            },
            where: {
                username: username
            }
        })
        result.DOB = formatDate(result.DOB)
        
        res.status(200).send(result)
    } catch (err) {
        res.status(500)
        console.log(err);
        return res.send("Something Went Wrong!")
    }

}

async function findUser(username) {
    const res = await worker.findUnique({
        where: {
            username: username
        }
    })
    return res === null ? false : true
}

const updateInfo = async(req,res)=>{
    const username = req.payload.audience
    if(!findUser(username)){
        res.status(404)
        return res.send("Username does not exist!")
    }
    try{
        const data = JSON.parse(fs.readFileSync('./tmp/data.json', 'utf-8'))
        if (data.password === '' || data.password === ' ') {
            data.DOB = new Date(data.DOB)
            await prisma.$executeRaw`UPDATE worker SET firstName=${data.firstName}, lastName=${data.lastName}, DOB=${data.DOB} WHERE position='Staff' AND username=${username}`
            res.status(200).send("Staff info has been updated!")
        } else {
            await worker.updateMany({
                data: {
                    password: await hashPwd(data.password),
                    firstName: data.firstName,
                    lastName: data.lastName,
                    DOB: new Date(data.DOB)
                },
                where: {
                    username: username
                }
            })
            res.status(200).send(`Staff info has been updated!`)
        }
        fs.unlinkSync('./tmp/data.json')
    }catch(err){
        fs.unlinkSync('./tmp/data.json')
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

const getOrder = async(req,res)=>{
    try{
        const result = await orders.findMany({
            include:{
                OrderDetail:{
                    include:{
                        ProductDetail:{
                            include:{
                                Product:{
                                    include:{
                                        BagType:true
                                    }
                                },
                                Color:{
                                    select:{
                                        colorName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if(result == ''){
            res.status(404)
            return res.send("Orders are empty!")
        }
        const ord = []
        for(let i in result){
            const orderId = result[i].orderId
            const cusName = await findCustomer(result[i].username)
            const quantity = result[i].quantity
            const total = result[i].total
            const deliveryDate = formatDate(result[i].deliveryDate)
            const address = result[i].address
            const tmp = result[i].OrderDetail
            const Product = []
            for(let j in tmp){
                const productName = tmp[j].ProductDetail.Product.productName
                const price = tmp[j].ProductDetail.Product.price
                const imageName = tmp[j].ProductDetail.Product.imageName
                const bagTypeName = tmp[j].ProductDetail.Product.BagType.bagTypeName
                const colorName = tmp[j].ProductDetail.Color.colorName
                Product[j] = {productName, price, imageName, bagTypeName, colorName}
            }
            ord[i] = {orderId, cusName, quantity, total, deliveryDate, address, Product}
        }
        res.status(200).send(ord)
    }catch(err){
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

async function findCustomer(username){
    const result = await customer.findUnique({
        select:{
            firstName: true,
            lastName: true
        },
        where:{
            username: username
        }
    })

    if(result == ''){
        return 404
    }
    const name = `${result.firstName} ${result.lastName}`
    return name
}
module.exports = {
    getInfo,
    updateInfo,
    getOrder,
}