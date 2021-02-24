const db = require('../utils/db')
const { denominations } = require('../utils/constants')

/** 
 * Class representing a coin or a bill. 
 */
class Cash {
    constructor() { }

    /**
    * Update cash in db.
    * @returns {Promise} Promise from db.
    */
    async updateQuantity(details, type) {
        const promiseList = []
        details.forEach(async value => {
            if (!value.denomination || !value.quantity && type !== 'CHANGE')
                throw new Error('Denomination and quantity must be provided')
            if (value.denomination < 0 || value.quantity < 0 && type !== 'CHANGE')
                throw new Error('Denomination and quantity must be positive values')
            if (!denominations.includes(parseInt(value.denomination)) && type !== 'CHANGE')
                throw new Error(`Denomination must be one of this: ${denominations}`)
            if (!Number.isInteger(value.denomination) || !Number.isInteger(value.quantity) && type !== 'CHANGE')
                throw new Error('Denomination and quantity must be integer')

            promiseList.push(
                db
                    .get()
                    .collection('cash')
                    .findOneAndUpdate(
                        {
                            denomination: value.denomination
                        },
                        { $inc: { quantity: value.quantity } }
                    )
            )
        });

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
                        _id: 0
                    }
                },
                { $sort: { denomination: -1 } }
            ])
            .toArray()

        let balance = 0
        response.forEach(cash =>
            balance += cash.denomination * cash.quantity);

        return {
            balance,
            details: response
        }
    }
}

module.exports = Cash
