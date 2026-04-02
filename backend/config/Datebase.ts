// config/database.js
const mongoose = require('mongoose');

const connect = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB );
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error:any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connect;