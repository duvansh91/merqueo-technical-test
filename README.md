# Merqueo technical test

This `Node` API was created to works as a cash register. 

# To run this project:
Run
```sh
npm install
```
Create a `.env` file with the this keys:
```
MONGO_URL=yourMongoUrl
```
*This project use a **MongoDB** cluster in **MongoDB Atlas***

Then run:
```sh
npm start
```
To run the tests:
```sh
npm test
```

## Routes

- POST `/transaction/charge` which charge a list of bills or coins into the cash register.

An object with the `details` param must be passed:

`details`: List of bills or coins with `denomination` and `quantity`.

Params example:
```
{
    "details": [
        {"denomination": 50000,"quantity": 5},
        {"denomination": 10000,"quantity": 5}
    ]
}
```

Success response with `status 200`:

```
{
  message: "Success"
}
```

Failed response with `status 400` with an error:

Example failed response:
```
{
  error: 'Details param must be provided',
}
```

***

- POST `/transaction/empty` which empty the cash register.

Success response with `status 200`:

```
{
  message: "Success"
}
```

***

- POST `/transaction/status` which returns the cash register status.

Example success response with `status 200`:

```
{
    "balance": 60000,
    "details": [
        {
            "denomination": 10000,
            "quantity": 1
        },
        {
            "denomination": 50000,
            "quantity": 1
        }
    ]
}

```

***

- POST `/transaction/pay` which makes a payment.

An object with the following parameters must be passed:

`amount`: Amount of the payment

`cash`: List of bills or coins with `denomination` and `quantity`.

Params example:
```
{
    "amount": 50000,
    "cash": [{"denomination":100000,"quantity":1}]
}
```

Success response with `status 200`:

```
{
  message: "Success"
}
```

Example failed response with `status 400` with an error:

```
{
  error: 'Amount must be provided',
}
```

***


- POST `/transaction/log` which returns all the transactions.

Example success response with `status 200`:

```
{
    "transactions": [
        {
            "amount": 250000,
            "type": "CHARGE",
            "date": "25/02/2021",
            "hour": 1
        },
        {
            "amount": 100000,
            "type": "PAYMENT",
            "date": "25/02/2021",
            "hour": 1
        }
    ]
}

```

***


- POST `/transaction/log-by-date` which returns all the transactions by date.

An object with the following parameters must be passed:

`date`: Date of the transactions with `DD/MM/YYYY` format.

`hour`: Hour of the transactions with `24H` formart.

Params example:
```
{
    "date": "25/02/2021",
    "hour": "02"
}
```

Example success response with `status 200`:

```
{
    "balance": 60000,
    "transactions": [
        {
            "amount": 50000,
            "type": "CHARGE",
            "date": "25/02/2021",
            "hour": 2
        },
        {
            "amount": 10000,
            "type": "PAYMENT",
            "date": "25/02/2021",
            "hour": 2
        }
    ]
}

```

Example failed response with `status 400` with an error:

```
{
  error: 'Date must be provided',
}
```
