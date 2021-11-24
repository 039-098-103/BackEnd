const { PrismaClient } = require('@prisma/client')
const { worker } = new PrismaClient()
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
        if (data.password === '') {
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

module.exports = {
    getInfo,
    updateInfo,
}