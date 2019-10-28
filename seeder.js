const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: `./config/config.env` });
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");

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
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`, `utf-8`)
);

// Import into DB

const importData = async () => {
  try {
    console.log("Importing data...".white.inverse);

    await Bootcamp.create(bootcamps);
    console.log(`Bootcamps imported`.green.inverse);
    await Course.create(courses);
    console.log(`Courses imported`.green.inverse);
    await mongoose.disconnect();
    console.log(`MongoDB disconnected.`.green.inverse);
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

// Delete all data from the database

const deleteData = async () => {
  try {
    await Bootcamp.deleteMany();
    console.log("Bootcaps deleted".red.inverse);
    await Course.deleteMany();
    console.log("Courses deleted".red.inverse);
    await mongoose.disconnect();
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
