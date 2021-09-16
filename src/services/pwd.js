const bcrypt = require('bcrypt')

async function comparePwd(inp, hashedPwd) {
    var res;
    const isValid = await bcrypt.compare(inp, hashedPwd)
    if (!isValid) {
        return res = 403
    } else {
        return res = 200
    }
}

async function encryptPwd(rawPwd) {
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(rawPwd, salt)
    return hashedPwd
}

module.exports = {
    comparePwd,
    encryptPwd
}