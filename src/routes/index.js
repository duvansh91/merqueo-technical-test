const router = require('express').Router()
const transaction = require('./transaction')

router.use('/transaction', transaction)

module.exports = router