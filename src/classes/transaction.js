const moment = require('moment')
const db = require('../utils/db')

/**
 * Class representing a transaction.
 */
class Transaction {
  /**
   * Create a transaction.
   * @param {Date} date - Transaction date.
   * @param {number} amount - Transaction amount.
   * @param {string} type - Transaction type.
   */
  constructor(params) {
    this.created_at = params.date
    this.amount = params.amount
    this.type = params.type
  }

  /**
  *  Create a transaction in db.
  * @returns {Promise} Promise from db.
  */
  async create() {
    return db
      .get()
      .collection('transactions')
      .insertOne(
        {
          created_at: this.created_at,
          amount: this.amount,
          type: this.type
        }
      )
  }

  /**
  *  Get all transactions in db.
  * @returns {Promise} Promise from db.
  */
  async getAll() {
    return db
      .get()
      .collection('transactions')
      .aggregate([
        {
          $project: {
            _id: 0,
            date: { $dateToString: { format: '%d/%m/%Y', date: '$created_at' } },
            hour: { $hour: '$created_at' },
            amount: 1,
            type: 1,
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray()
  }

  /**
  *  Get all transactions in db up to a date.
  * @param {Date} date - Transaction date (DD/MM/YYYY).
  * @param {number} hour - Transaction hour in 24H format.
  * @returns {Promise} Promise from db.
  */
  async getByDate(date, hour) {
    const dateObject = moment(date, 'DD/MM/YYYY')
    const hourInt = parseInt(hour, 10)
    const transactions = await db
      .get()
      .collection('transactions')
      .aggregate([
        {
          $project: {
            date: { $dateToString: { format: '%d/%m/%Y', date: '$created_at' } },
            hour: { $hour: '$created_at' },
            created_at: 1,
            amount: 1,
            type: 1
          }
        },
        {
          $match: {
            created_at: { $lte: new Date(dateObject) },
            hour: { $lte: hourInt }
          },
        },
        {
          $project: {
            _id: 0,
            created_at: 0
          }
        }
      ])
      .toArray()

    let balance = 0
    transactions.forEach((value) => {
      balance += value.amount
    })

    return {
      balance,
      transactions
    }
  }
}

module.exports = Transaction
