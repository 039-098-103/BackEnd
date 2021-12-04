function resMsg(resCode){
    switch (resCode) {
        case 401:
            return "You don't have Permission!"
        case 403:
            return "Wrong Password!"
        case 404:
            return "Username does not exist!"
        case 500:
            return "Something Went Wrong!"
    }   
}

module.exports = {
    resMsg
}