const MongoClient = require("mongodb").MongoClient

const uri = process.env.MONGO_URI
let mongodb

const connect = (callback) => {
  MongoClient.connect(
    uri,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (error, client) => {
      if (error) {
        throw error
      }
      mongodb = client.db("register")
      callback()
    }
  );
};

const get = () => {
  return mongodb
};

module.exports = {
  connect,
  get,
}
