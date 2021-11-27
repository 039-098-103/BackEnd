const { PrismaClient } = require('@prisma/client')
const { product, productDetail } = new PrismaClient()

const getProduct = async(req,res)=>{
    try {
        const products = await product.findMany({
            include: {
                BagType: true
            }
        })

        const pds = await productDetail.findMany({
            include: {
                Product: {
                    select: {
                        productId: true
                    }
                },
                Color: true
            }
        })
        if(products == '' || pds == ''){
            res.status(404)
            return res.send("Products are empty!")
        }
        const colors = colorArray(pds)
        pushColor(products, pds, colors)
        res.status(200).send(products)
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}

function colorArray(pds) {
    return pds.reduce(function (a, b) {
        (a[b.productId] = a[b.productId] || []).push(b.Color)
        for (const i in b.Color) {
            b.Color['productDetailId'] = b.productDetailId
        }
        return a
    }, {})
}

function pushColor(prd, pds, colors) {
    for (let i in pds) {
        let pid = pds[i].productId
        for (let j in prd) {
            if (pid == prd[j].productId) {
                prd[j]['Color'] = colors[pid]
            } else if (pid == prd.productId) {
                prd['Color'] = colors[pid]
            }
        }
    }
    return prd
}

const getProductById = async(req,res)=>{
    const { id } = req.params
    try {
        const products = await product.findUnique({
            include: {
                BagType: true
            },
            where: {
                productId: Number(id)
            }
        })

        const pds = await productDetail.findMany({
            include: {
                Product: {
                    select: {
                        productId: true
                    }
                },
                Color: true
            },
            where: {
                productId: Number(id)
            }
        })
        if(products == '' || pds == ''){
            res.status(404)
            return res.send("Products are empty!")
        }
        const colors = colorArray(pds)
        pushColor(products, pds, colors)
        res.status(200).send(products)
    } catch (err) {
        res.status(500)
        return res.send("Something Went Wrong!")
    }
}
module.exports = {
    getProduct,
    getProductById
}