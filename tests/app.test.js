
const request = require('supertest')
const db = require('../src/utils/db')
const app = require('../src/app')

beforeAll(() => db.connect())

afterEach(async () => {
    await db.get().collection('cash').removeMany({})
    await db.get().collection('transactions').removeMany({})
})

describe('GET /transaction/status', () => {
    it('Should return the cash register status', async () => {
        await db.get().collection('cash').insertMany([
            { "denomination": 10000, "quantity": 5 },
            { "denomination": 50000, "quantity": 5 }
        ])
        const response = await request(app).get('/transaction/status')
        expect(response.body.balance).toBe(300000)
        expect(response.body.details).toEqual(
            expect.arrayContaining([
                { "denomination": 50000, "quantity": 5 },
                { "denomination": 10000, "quantity": 5 }
            ]),
        );
        expect(response.status).toBe(200)
    })
})

describe('POST /transaction/empty', () => {
    it('Should empty the cash register', async () => {
        await db.get().collection('cash').insertMany([
            { "denomination": 10000, "quantity": 1 },
            { "denomination": 50000, "quantity": 1 }
        ])

        const response = await request(app).post('/transaction/empty')

        const expectedCash = await db.get().collection('cash').aggregate([
            {
                $project: {
                    _id: 0
                }
            },
            { $sort: { denomination: -1 } }
        ]).toArray()
        const transactions = await db.get().collection('transactions').aggregate([
            {
                $project: {
                    _id: 0
                }
            }
        ]).toArray()

        expect(response.body.message).toBe('Success')
        expect(expectedCash).toEqual(
            expect.arrayContaining([
                { "denomination": 50000, "quantity": 0 },
                { "denomination": 10000, "quantity": 0 }
            ]),
        );
        expect(transactions[0]).toEqual(
            {
                create_at: expect.any(Date),
                amount: -60000,
                type: 'EMPTY'
            }
        )
        expect(response.status).toBe(200)
    })

    it('Should return the cash register is already empty', async () => {
        await db.get().collection('cash').insertMany([
            { "denomination": 10000, "quantity": 0 },
            { "denomination": 50000, "quantity": 0 }
        ])
        const response = await request(app).post('/transaction/empty')

        expect(response.body.message).toBe('Cash register is already empty')
        expect(response.status).toBe(200)
    })
})

describe('POST /transaction/charge', () => {
    it('Should empty the cash register', async () => {
        await db.get().collection('cash').insertMany([
            { "denomination": 10000, "quantity": 0 },
            { "denomination": 50000, "quantity": 0 }
        ])

        const response = await request(app).post('/transaction/charge').send(
            {
                "details": [
                    { "denomination": 10000, "quantity": 1 },
                    { "denomination": 50000, "quantity": 1 }
                ]
            }
        )

        const expectedCash = await db.get().collection('cash').aggregate([
            {
                $project: {
                    _id: 0
                }
            },
            { $sort: { denomination: -1 } }
        ]).toArray()
        const transactions = await db.get().collection('transactions').aggregate([
            {
                $project: {
                    _id: 0
                }
            }
        ]).toArray()

        expect(response.body.message).toBe('Success')
        expect(expectedCash).toEqual(
            expect.arrayContaining([
                { "denomination": 50000, "quantity": 1 },
                { "denomination": 10000, "quantity": 1 }
            ]),
        );
        expect(transactions[0]).toEqual(
            {
                create_at: expect.any(Date),
                amount: 60000,
                type: 'CHARGE'
            }
        )
        expect(response.status).toBe(200)
    })

    it('Details should not be provided correctly', async () => {
        const response = await request(app).post('/transaction/charge').send(
            {
                "details": []
            }
        )
        expect(response.body.error).toBe('Details param must be provided')
        expect(response.status).toBe(400)
    })

    it('Details should not be provided', async () => {
        const response = await request(app).post('/transaction/charge').send({})
        expect(response.body.error).toBe('Details param must be provided')
        expect(response.status).toBe(400)
    })
})

describe('POST /transaction/pay', () => {
    it('Should do a payment', async () => {
        await db.get().collection('cash').insertMany([
            { "denomination": 10000, "quantity": 1 },
            { "denomination": 50000, "quantity": 1 }
        ])

        const response = await request(app).post('/transaction/pay').send(
            {
                "amount": 40000,
                "cash": [{ "denomination": 50000, "quantity": 1 }]
            }
        )

        const expectedCash = await db.get().collection('cash').aggregate([
            {
                $project: {
                    _id: 0
                }
            },
            { $sort: { denomination: -1 } }
        ]).toArray()
        const transactions = await db.get().collection('transactions').aggregate([
            {
                $project: {
                    _id: 0
                }
            }
        ]).toArray()

        expect(response.body.message).toBe('Success')
        expect(expectedCash).toEqual(
            expect.arrayContaining([
                { "denomination": 50000, "quantity": 2 },
                { "denomination": 10000, "quantity": 0 }
            ]),
        );
        expect(transactions).toEqual(
            expect.arrayContaining([
                {
                    create_at: expect.any(Date),
                    amount: 50000,
                    type: 'PAYMENT'
                },
                {
                    create_at: expect.any(Date),
                    amount: -10000,
                    type: 'CHANGE'
                }
            ])
        )
        expect(response.status).toBe(200)
    })
})
