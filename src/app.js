require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./routes')
const db = require('./utils/db')
const port = 4000

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', routes)

db.connect(() => {
    app.listen(port, () => {
        console.log(`server running on port ${port}`)
    })
})
