const mongoose = require("mongoose");

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
    authSource: "admin",
  };

  const connection = await mongoose.connect(
    process.env.MONGO_URI,
    dbConnectionOptions
  );

  console.log(`MongoDB Connected: ${connection.connection.host}`);
};

module.exports = connectDB;
