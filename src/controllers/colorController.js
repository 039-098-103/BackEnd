const { PrismaClient } = require('@prisma/client')
const { color } = new PrismaClient()


const getColors = async (req, res) => {
    try{
        const result = await color.findMany();
        res.status(200).send(result)

    }catch(err){
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

module.exports = {
    getColors
}