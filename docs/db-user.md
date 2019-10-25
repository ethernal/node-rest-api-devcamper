---
title: How to secure access to MongoDB database and authenticate with Mongoose
author: Sebastian Pieczyński
---

To create new Database user:

run mongo.exe in console.

To create admin user for single Database:

```js
use admin
> db.createUser({ user:"admin", pwd: "password", roles:[{role:"userAdmin", db:"devcamper"}]})

Successfully added user: {
        "user" : "admin",
        "roles" : [
                {
                        "role" : "userAdmin",
                        "db" : "devcamper"
                }
        ]
}
>
```

Explanation:

```
use admin
```

switches to admin database so that we can store autorization data there. You could also use a differnet database to store user data.

```js
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [{ role: 'userAdmin', db: 'devcamper' }],
});
```

Creates an `admin` user with `password` as password and with `userAdmin` role for database `devcamper`. Role of `userAdmin` basically grants user an Admin role for the selected database.

To login via `Mongoose` you can use either the URI string parameters what is not very secure as you need to code all data (user and pass) in the string. Using `connectionOptions` object along with ENV file is better.

```js
const dbConnectionOptions = {
  connectTimeoutMS: 1000,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  auth: {
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
  },
  authSource: 'admin',
};
```

Notice `process.env.MONGO_USER` and `process.env.MONGO_PASSWORD`. These fields are taken from `.env` file that is not commited to the repository. You just need to provide such environmental variables.

Also please notice the `authSource` field. It points to the database where user credentials and permissions are stored so if you created the user on a `test` database use `test` as an `authSource`.
