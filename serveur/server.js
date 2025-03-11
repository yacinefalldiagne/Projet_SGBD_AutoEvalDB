const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require('mongoose');

const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { console.log('DB connected') })
    .catch((err) => { console.log('DB not connected', err) });

const port = process.env.PORT || 8000;

// middleware

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.use('/', require('./routes/authRoutes'));