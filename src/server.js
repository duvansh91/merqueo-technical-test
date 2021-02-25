require('dotenv').config()
const db = require('./utils/db')
const app = require('./app')

const port = 4000

db.connect().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line
    console.log(`server running on port ${port}`)
  })
})
