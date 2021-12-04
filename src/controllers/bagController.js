const { PrismaClient } = require('@prisma/client')
const { bagType } = new PrismaClient()

const getBagType = async(req,res)=>{
    try{
        const result = await bagType.findMany()
        if(result == ''){
            res.status(404)
            return res.send("BagType is empty!")
        }
        return res.status(200).send(result)
    }catch(err){
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

module.exports = {
    getBagType
}