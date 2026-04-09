// index.ts
const server = require("./app");
const dotenv = require("dotenv");
const connectDB = require("./backend/config/Datebase");
const cloudinary = require("cloudinary").v2;

import dns from "dns"

dns.setServers(["1.1.1.1", "8.8.8.8"])

// Load environment variables
dotenv.config({ path: "./config.env" })



// Configure Cloudinary
if (process.env.CLOUDINARY_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured");
}

// Connect to database
connectDB();


// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});