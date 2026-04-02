const jwt = require("jsonwebtoken")
const token = (userId:string)=>{
    return jwt.sign({ id: userId  }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
}

module.exports = token