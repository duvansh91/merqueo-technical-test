const router = require('express').Router()
const Cash = require('../classes/cash')
const Payment = require('../classes/payment')
const Transaction = require('../classes/transaction')
const { denominations } = require('../utils/constants')

router.post('/charge', async (req, res) => {
    const { details } = req.body
    if (!details || !details.length)
        return res.status(400).json({ error: 'Details param must be provided' })
    const newCash = new Cash({})
    try {
        await newCash.updateQuantity(details, 'CHARGE')
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
    let totalAmount = 0
    details.forEach(value => {
        totalAmount += value.denomination * value.quantity
    });
    const newTransaction = new Transaction(
        {
            date: new Date(),
            amount: totalAmount,
            type: 'CHARGE'
        }
    )
    await newTransaction.create()
    res.status(200).json({ message: 'Success' })
})

router.post('/empty', async (req, res) => {
    const newCash = new Cash({})
    let cashState
    try {
        cashState = await newCash.getState()
        if (cashState.balance === 0)
            return res.status(200).json({ message: 'Cash register is already empty' })
        await newCash.empty()
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
    const newTransaction = new Transaction(
        {
            date: new Date(),
            amount: -cashState.balance,
            type: 'EMPTY'
        }
    )
    await newTransaction.create()
    res.status(200).json({ message: 'Success' })
})

router.get('/status', async (req, res) => {
    let state
    try {
        const newCash = new Cash({})
        state = await newCash.getState()
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
    res.status(200).json({ ...state })
})

router.post('/pay', async (req, res) => {
    const params = req.body
    const { amount, cash } = params
    if (!amount)
        return res.status(400).json({ error: 'Amount must be provided' })
    if (!cash || cash.length === 0)
        return res.status(400).json({ error: 'Cash must be provided' })
    if (cash.find(value => !denominations.includes(value.denomination)))
        return res.status(400).json({ error: `Denomination must be one of this: ${denominations}` })
    try {
        const newPayment = new Payment({ amount, cash })
        payment = await newPayment.create()
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
    const newTransaction = new Transaction(
        {
            date: new Date(),
            amount: payment.cash,
            type: 'PAYMENT'
        }
    )
    await newTransaction.create()
    const newChange = new Transaction(
        {
            date: new Date(),
            amount: -payment.change,
            type: 'CHANGE'
        }
    )
    await newChange.create()
    res.status(200).json({ message: 'Success' })
})

router.get('/log', async (req, res) => {
    const newTransaction = new Transaction({})
    const log = await newTransaction.getAll()
    res.status(200).json(log)
})

router.get('/log-by-date', async (req, res) => {
    const { date, hour } = req.body
    const newTransaction = new Transaction({})
    const log = await newTransaction.getByDate(date, hour)
    res.status(200).json(log)
})

module.exports = router