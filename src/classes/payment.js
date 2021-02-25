const Cash = require('./cash')

/** 
 * Class representing a payment. 
 */
class Payment {
    /**
     * Create payment.
     * @param {Object} params - Params.
     * @param {number} amount - Payment amount.
     * @param {Array<Object>} cash - Cash.
     */
    constructor(params) {
        this.amount = params.amount
        this.cash = params.cash
    }

    /**
    * Insert a payment in db.
    * @returns {Promise} Promise from db.
    */
    async create() {
        const cash = new Cash({})
        const cashState = await cash.getState()
        let totalIncomeCash = 0
        this.cash.forEach(value => totalIncomeCash += value.denomination * value.quantity)
        const change = totalIncomeCash - this.amount
        if (cashState.balance < change) throw new Error('Insufficient cash in register')
        if (totalIncomeCash < this.amount) throw new Error('Insufficient cash')
        const changeToReturn = []
        let changeTemp = change

        while (changeTemp > 0) {
            const billMatched = cashState.details.find(
                value => changeTemp >= value.denomination && value.quantity > 0
            )
            if (!billMatched) throw new Error('Not change for this value')
            const numberOfBills = changeTemp / billMatched.denomination
            if (Number.isInteger(numberOfBills)) {
                changeTemp -= billMatched.denomination * numberOfBills
                changeToReturn.push(
                    {
                        denomination: billMatched.denomination,
                        quantity: -numberOfBills
                    }
                )
            } else {
                changeTemp -= billMatched.denomination * Math.trunc(numberOfBills)
                changeToReturn.push(
                    {
                        denomination: billMatched.denomination,
                        quantity: -Math.trunc(numberOfBills)
                    }
                )
            }
        }
        const paymentIncomeCash = this.cash
        await cash.updateQuantity(paymentIncomeCash, 'PAYMENT')
        await cash.updateQuantity(changeToReturn, 'CHANGE')

        return {
            cashDetails: changeToReturn,
            cash: totalIncomeCash,
            change
        }
    }
}

module.exports = Payment