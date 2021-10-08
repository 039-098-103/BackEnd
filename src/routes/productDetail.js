const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { productDetail, product } = new PrismaClient();

router.get('/', async(req, res) => {
    //get all products with bagtype
    const products = await product.findMany({
        include: {
            BagType: true
        }
    })

    //get colors and pid
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

    const colors = colorArray(pds)
    pushColor(products, pds, colors)
    res.status(200).send(products)
})

function colorArray(pds) {
    return pds.reduce(function(a, b) {
        (a[b.productId] = a[b.productId] || []).push(b.Color)
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

router.get('/:id', async(req, res) => {
    const { id } = req.params

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

    const colors = colorArray(pds)
    pushColor(products, pds, colors)

    res.status(200).send(products)
})

module.exports = router;