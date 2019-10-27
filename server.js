const express = require(`express`);
const dotenv = require(`dotenv`);
const morgan = require(`morgan`);
const colors = require(`colors`);
const errorHandler = require(`./middleware/error`);
const connectDB = require(`./config/db`);
//Load ENV variables
dotenv.config({ path: `./config/config.env` });

// Connect to the Database
connectDB();

// Route Files
const bootcamps = require(`./routes/bootcamps`);
const courses = require(`./routes/courses`);

const app = express();

// Body parser - allows to log request body data to the console from the server so we do not get undefined when invoking: console.log(req.body);
app.use(express.json());

// Dev Logging middleware
if (process.env.NODE_ENV === `development`) app.use(morgan(`dev`));

// Mount routes
app.use(`/api/v1/bootcamps`, bootcamps);
app.use(`/api/v1/courses`, courses);

// Apply middleware AFTER the routes are loaded as loading middleware earlier will make it unable to catch the errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `App running in ${process.env.NODE_ENV} mode on port ${PORT}!`.green.bold
  );
});

// Handle unhandled promise rejections

process.on(`unhandledRejection`, (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // CLose server & exit process
  server.close(() => process.exit(1));
});
