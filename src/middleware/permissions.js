function roleCheck(usr_role, role){
    return (usr_role === role)
}

function authAdmin(req,res,next) {
    const role = req.payload.role
    if(!roleCheck(role, 'Admin')){
        res.status(403)
        return res.send("You don't have permission!")
    }
    next()
}

function authStaff(req,res,next){
    const role = req.payload.role
    if(!roleCheck(role, 'Staff')){
        res.status(403)
        return res.send("You don't have permission!")
    }
    next()
}
module.exports = {
    authAdmin,
    authStaff,
}