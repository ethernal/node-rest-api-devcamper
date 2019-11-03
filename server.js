const express = require(`express`);
const dotenv = require(`dotenv`);
const morgan = require(`morgan`);
const colors = require(`colors`);
const path = require(`path`);
const errorHandler = require(`./middleware/error`);
const connectDB = require(`./config/db`);
const fileupload = require(`express-fileupload`);
const cookieParser = require(`cookie-parser`);
const mongoSanitize = require(`express-mongo-sanitize`);
const helmet = require(`helmet`);
const xssClean = require(`xss-clean`);
const hpp = require(`hpp`);
//Load ENV variables
dotenv.config({ path: `./config/config.env` });

// Connect to the Database
connectDB();

// Route Files
const bootcamps = require(`./routes/bootcamps`);
const courses = require(`./routes/courses`);
const auth = require(`./routes/auth`);
const users = require(`./routes/users`);
const reviews = require(`./routes/reviews`);

const app = express();

// Body parser - allows to log request body data to the console from the server so we do not get undefined when invoking: console.log(req.body);
app.use(express.json());

app.use(cookieParser());

// Dev Logging middleware
if (process.env.NODE_ENV === `development`) {
  app.use(morgan(`dev`));
}
// File uploading middleware
app.use(fileupload());

/**
 * Security Enhancements
 */

// Sanitize data passed to Express
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS
app.use(xssClean());

// Prevent parameter pollution
app.use(hpp());

/**
 * END of security enhancements
 */

//Set static folder
app.use(express.static(path.join(__dirname, `public`)));

// Mount routes
app.use(`/api/v1/bootcamps`, bootcamps);
app.use(`/api/v1/courses`, courses);
app.use(`/api/v1/auth`, auth);
app.use(`/api/v1/users`, users);
app.use(`/api/v1/reviews`, reviews);

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
  console.log(`Unhandled Error (${err.name}) in server.js: ${err.message}`.red);
  // CLose server & exit process
  server.close(() => process.exit(1));
});
