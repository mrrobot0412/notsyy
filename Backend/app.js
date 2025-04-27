const express =require("express")
const app=express()
const connectDB=require('./db/connect')
const authenticateUser = require('./middlewares/authenticate');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS with options
app.use(cors(corsOptions));

// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Routes
app.use('/notsy/auth', require('./routes/auth'));
app.use('/notsy', authenticateUser, require('./routes/index'));

// Listen function & connect to database
const port = 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`database connected and listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();