const db = require('../utils/db')

/** 
 * Class representing a transaction. 
 */
class Transaction {
    /**
     * Create a transaction.
     * @param {Date} create_at - Transaction date.
     * @param {number} amount - Transaction amount.
     * @param {string} type - Transaction type.
     */
    constructor(params) {
        this.create_at = params.date
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
                    create_at: this.create_at,
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
                        date: { $dateToString: { format: "%d/%m/%Y", date: "$create_at" } },
                        hour: { $hour: "$create_at" },
                        amount: 1,
                        type: 1,
                    }
                },
                { $sort: { create_at: -1 } }
            ])
            .toArray()
    }

    /**
    *  Get all transactions in db by date.
    * @param {Date} date - Transaction date (DD/MM/YYYY).
    * @param {number} hour - Transaction hour in 24H format.
    * @returns {Promise} Promise from db.
    */
    async getByDate(date, hour) {
        const hourInt = parseInt(hour)
        const transactions = await db
            .get()
            .collection('transactions')
            .aggregate([
                {
                    $project: {
                        date: { $dateToString: { format: "%d/%m/%Y", date: "$create_at" } },
                        hour: { $hour: "$create_at" },
                        amount: 1,
                        type: 1
                    }
                },
                {
                    $match: {
                        date,
                        hour: hourInt,
                    }
                },
                {
                    $project: {
                        _id: 0,
                    }
                }
            ])
            .toArray()
        let balance = 0
        transactions.forEach(value => balance += value.amount);
        return {
            balance,
            transactions
        }
    }
}

module.exports = Transaction