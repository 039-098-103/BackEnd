const { PrismaClient } = require('@prisma/client')
const { bagType } = new PrismaClient()

const getBagType = async(req,res)=>{
    try{
        const result = await bagType.findMany()
        return res.status(200).send(result)
    }catch(err){
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

module.exports = {
    getBagType
}