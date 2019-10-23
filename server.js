const express = require('express');
const dotenv = require('dotenv');

//Load ENV variables

dotenv.config({ path: './config/config.env' });

const app = express();

app.get('/', (req, res) => {
  res
    .status(400)
    .send({
      success: false,
      error: 'Please include all required parameters in the request.',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App running in ${process.env.NODE_ENV} mode on port ${PORT}!`);
});
