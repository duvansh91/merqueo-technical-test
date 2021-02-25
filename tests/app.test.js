const request = require('supertest')
const db = require('../src/utils/db')
const app = require('../src/app')

beforeAll(() => db.connect())

afterEach(async () => {
  await db.get().collection('cash').deleteMany({})
  await db.get().collection('transactions').deleteMany({})
})

describe('GET /transaction/status', () => {
  it('Should return the cash register status', async () => {
    await db.get().collection('cash').insertMany([
      { denomination: 10000, quantity: 5 },
      { denomination: 50000, quantity: 5 }
    ])
    const response = await request(app).get('/transaction/status')
    expect(response.body.balance).toBe(300000)
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        { denomination: 50000, quantity: 5 },
        { denomination: 10000, quantity: 5 }
      ]),
    )
    expect(response.status).toBe(200)
  })
})

describe('POST /transaction/empty', () => {
  it('Should empty the cash register', async () => {
    await db.get().collection('cash').insertMany([
      { denomination: 10000, quantity: 1 },
      { denomination: 50000, quantity: 1 }
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
        { denomination: 50000, quantity: 0 },
        { denomination: 10000, quantity: 0 }
      ]),
    )
    expect(transactions[0]).toEqual(
      {
        created_at: expect.any(Date),
        amount: -60000,
        type: 'EMPTY'
      }
    )
    expect(response.status).toBe(200)
  })

  it('Should return the cash register is already empty', async () => {
    await db.get().collection('cash').insertMany([
      { denomination: 10000, quantity: 0 },
      { denomination: 50000, quantity: 0 }
    ])
    const response = await request(app).post('/transaction/empty')
    expect(response.body.message).toBe('Cash register is already empty')
    expect(response.status).toBe(200)
  })
})

describe('POST /transaction/charge', () => {
  it('Should empty the cash register', async () => {
    await db.get().collection('cash').insertMany([
      { denomination: 10000, quantity: 0 },
      { denomination: 50000, quantity: 0 }
    ])
    const response = await request(app).post('/transaction/charge').send(
      {
        details: [
          { denomination: 10000, quantity: 1 },
          { denomination: 50000, quantity: 1 }
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
        { denomination: 50000, quantity: 1 },
        { denomination: 10000, quantity: 1 }
      ]),
    )
    expect(transactions[0]).toEqual(
      {
        created_at: expect.any(Date),
        amount: 60000,
        type: 'CHARGE'
      }
    )
    expect(response.status).toBe(200)
  })

  it('Details should not be provided correctly', async () => {
    const response = await request(app).post('/transaction/charge').send(
      {
        details: []
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
      { denomination: 10000, quantity: 1 },
      { denomination: 50000, quantity: 1 }
    ])
    const response = await request(app).post('/transaction/pay').send(
      {
        amount: 40000,
        cash: [{ denomination: 50000, quantity: 1 }]
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
        { denomination: 50000, quantity: 2 },
        { denomination: 10000, quantity: 0 }
      ]),
    )
    expect(transactions).toEqual(
      expect.arrayContaining([
        {
          created_at: expect.any(Date),
          amount: 50000,
          type: 'PAYMENT'
        },
        {
          created_at: expect.any(Date),
          amount: -10000,
          type: 'CHANGE'
        }
      ])
    )
    expect(response.status).toBe(200)
  })

  it('Should return amount must be provided', async () => {
    const response = await request(app).post('/transaction/pay').send(
      {
        cash: [{ denomination: 50000, quantity: 1 }]
      }
    )
    expect(response.body.error).toBe('Amount must be provided')
    expect(response.status).toBe(400)
  })

  it('Should return cash must be provided', async () => {
    const response = await request(app).post('/transaction/pay').send(
      {
        amount: 40000
      }
    )
    expect(response.body.error).toBe('Cash must be provided')
    expect(response.status).toBe(400)
  })

  it('Cash should not be provided correctly', async () => {
    const response = await request(app).post('/transaction/pay').send(
      {
        amount: 40000,
        cash: []
      }
    )
    expect(response.body.error).toBe('Cash must be provided')
    expect(response.status).toBe(400)
  })

  it('Denomination should not be provided correctly', async () => {
    const response = await request(app).post('/transaction/pay').send(
      {
        amount: 30000,
        cash: [{ denomination: 30000, quantity: 1 }]
      }
    )
    expect(response.body.error).toBe(
      'Denomination must be one of this: 100000,50000,20000,10000,5000,1000,500,200,100,50'
    )
    expect(response.status).toBe(400)
  })
})

describe('GET /transaction/log', () => {
  it('Should return the transactions log', async () => {
    await db.get().collection('transactions').insertMany([
      {
        created_at: new Date('2021-02-24T18:05:05.588+00:00'),
        amount: 20000,
        type: 'PAYMENT',
      },
      {
        created_at: new Date('2021-02-24T18:05:05.588+00:00'),
        amount: -10000,
        type: 'CHANGE',
      }
    ])
    const response = await request(app).get('/transaction/log')
    expect(response.body.transactions).toEqual(
      expect.arrayContaining([
        {
          amount: -10000,
          type: 'CHANGE',
          date: '24/02/2021',
          hour: 18
        },
        {
          amount: 20000,
          type: 'PAYMENT',
          date: '24/02/2021',
          hour: 18
        }
      ]),
    )
    expect(response.status).toBe(200)
  })
})

describe('GET /transaction/log-by-date', () => {
  it('Should return the transactions log by date', async () => {
    await db.get().collection('transactions').insertMany([
      {
        created_at: new Date('2021-02-23T18:05:05.588+00:00'),
        amount: 20000,
        type: 'PAYMENT',
      },
      {
        created_at: new Date('2021-02-23T18:05:05.588+00:00'),
        amount: -10000,
        type: 'CHANGE',
      },
      {
        created_at: new Date('2021-02-27T18:05:05.588+00:00'),
        amount: 30000,
        type: 'PAYMENT',
      }
    ])
    const response = await request(app).get('/transaction/log-by-date').send(
      {
        date: '25/02/2021',
        hour: '22'
      }
    )
    expect(response.body.balance).toBe(10000)
    expect(response.body.transactions).toEqual(
      expect.arrayContaining([
        {
          amount: 20000,
          type: 'PAYMENT',
          date: '23/02/2021',
          hour: 18
        },
        {
          amount: -10000,
          type: 'CHANGE',
          date: '23/02/2021',
          hour: 18
        }
      ]),
    )
    expect(response.status).toBe(200)
  })

  it('Should return date must be provided', async () => {
    const response = await request(app).get('/transaction/log-by-date').send(
      {
        hour: '18'
      }
    )
    expect(response.body.error).toBe('Date must be provided')
    expect(response.status).toBe(400)
  })

  it('Should return hour must be provided', async () => {
    const response = await request(app).get('/transaction/log-by-date').send(
      {
        date: '24/02/2021'
      }
    )
    expect(response.body.error).toBe('Hour must be provided')
    expect(response.status).toBe(400)
  })
})
