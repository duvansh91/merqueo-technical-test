const { MongoClient } = require('mongodb')

const uri = global.__MONGO_URI__ || process.env.MONGO_URL
let mongodb

const connect = () => MongoClient.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true }
).then((client) => {
  mongodb = client.db(global.__MONGO_DB_NAME__ || 'register')
})

const get = () => mongodb

module.exports = {
  connect,
  get,
}
