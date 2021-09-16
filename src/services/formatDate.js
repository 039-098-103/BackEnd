const moment = require('moment')

function formatDate(oldDate) {
    return newDate = moment(oldDate).format("YYYY-MM-DD")
}

module.exports = {
    formatDate
}