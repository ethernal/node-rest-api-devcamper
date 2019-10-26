const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

dotenv.config({ path: `./config/config.env` });

const Bootcamp = require("./models/Bootcamp");

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
  authSource: "admin",
};

mongoose.connect(process.env.MONGO_URI, dbConnectionOptions);

console.log(
  `MongoDB Connected [ SEEDER ]: ${mongoose.connection.host}`.cyan.bold.inverse
);

const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`, `utf-8`)
);

// Import into DB

const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    console.log("Data imported".green.inverse);
    mongoose.disconnect();
    console.log(`MongoDB disconnected.`.green.inverse);
    process.exit();
  } catch (error) {
    mongoose.disconnect();
    if (error.name === `HttpError` && error.code === `EAI_AGAIN`) {
      console.warn(`Could not connect to GeoCoder Provider.`.yellow.inverse);
      console.error(`Data was imported.`.green.inverse);
    } else {
      console.error(error);
    }
    console.log(`MongoDB disconnected.`.green.inverse);
    process.exit();
  }
};

// Delete all data from the database

const deleteData = async () => {
  try {
    await Bootcamp.deleteMany();
    console.log("Data deleted".red.inverse);
    mongoose.disconnect();
    console.log(`MongoDB disconnected.`.green.inverse);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

if (process.argv[2] === `-i`) {
  importData();
} else if (process.argv[2] === `-d`) {
  deleteData();
}
