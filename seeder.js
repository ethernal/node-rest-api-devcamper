const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environmental variables
dotenv.config({ path: `./config/config.env` });

// Load models
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");
const User = require("./models/User");
const Review = require("./models/Review");

// Use recommended options for MongoDB
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
  authSource: process.env.MONGO_AUTH_DB,
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
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, `utf-8`)
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/reviews.json`, `utf-8`)
);

// Import data into DB

const importData = async () => {
  try {
    console.log("Importing data...".white.inverse);

    await Bootcamp.create(bootcamps);
    console.log(`Bootcamps imported`.green.inverse);

    await Course.create(courses);
    console.log(`Courses imported`.green.inverse);

    await User.create(users);
    console.log(`Users imported`.green.inverse);

    await Review.create(reviews);
    console.log(`Reviews imported`.green.inverse);

    // Sometimes this leads to Mongo Server pool was destroyed error
    // I assume this is due to the MongoDB middleware/functions that are being run pre/post save
    // and while it happens we issue a disconnect, but I am uncertain as it is not happening all the time
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

    await User.deleteMany();
    console.log("Users deleted".red.inverse);

    await Review.deleteMany();
    console.log("Reviews deleted".red.inverse);

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
