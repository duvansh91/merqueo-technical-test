const db = require('../utils/db')
const { denominations } = require('../utils/constants')

/**
 * Class representing a coin or a bill.
 * @param {Object} params - Params.
 * @param {number} params.denomination - Denomination.
 * @param {number} params.quantity - Quantity.
 */
class Cash {
  constructor(params) {
    this.denomination = params.denomination
    this.quantity = params.quantity
  }

  /**
  * Update cash in db.
  * @param {Array<Object>} details - List of bills or coins.
  * @param {String} type - Type of transaction.
  * @returns {Promise} Promise from db.
  */
  async updateQuantity(details, type) {
    const promiseList = []
    details.forEach(async (value) => {
      if (!value.denomination || !value.quantity && type !== 'CHANGE')
        throw new Error('Denomination and quantity must be provided')
      if (value.denomination < 0 || value.quantity < 0 && type !== 'CHANGE')
        throw new Error('Denomination and quantity must be positive values')
      if (!denominations.includes(parseInt(value.denomination, 10)) && type !== 'CHANGE')
        throw new Error(`Denomination must be one of this: ${denominations}`)
      if (!Number.isInteger(value.denomination) || !Number.isInteger(value.quantity) && type !== 'CHANGE')
        throw new Error('Denomination and quantity must be integer')

      promiseList.push(
        db
          .get()
          .collection('cash')
          .findOneAndUpdate(
            {
              denomination: value.denomination,
            },
            { $inc: { quantity: value.quantity } }
          )
      )
    })

    await Promise.all(promiseList)
  }

  /**
  * Empty cash register.
  * @returns {Promise} Promise from db.
  */
  empty() {
    return db
      .get()
      .collection('cash')
      .updateMany(
        {},
        { $set: { quantity: 0 } }
      )
  }

  /**
  * Get cash register state.
  * @returns {Promise} Promise from db.
  */
  async getState() {
    const response = await db
      .get()
      .collection('cash')
      .aggregate([
        {
          $project: {
            _id: 0,
          }
        },
        { $sort: { denomination: -1 } }
      ])
      .toArray()

    let balance = 0
    response.forEach((cash) => {
      balance += cash.denomination * cash.quantity
    })

    return {
      balance,
      details: response
    }
  }
}

module.exports = Cash
