const mongoose = require("mongoose");
const colors = require(`colors`);

const connectDB = async () => {
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

  const connection = await mongoose.connect(
    process.env.MONGO_URI,
    dbConnectionOptions
  );

  console.log(`MongoDB Connected: ${connection.connection.host}`.cyan.bold);
};

module.exports = connectDB;
