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

module.exports = {
    comparePwd,
}