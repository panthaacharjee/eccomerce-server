const bcryptjs = require("bcryptjs")
const catchAsyncError  = require("../middleware/catchAsyncError")

exports.comparePassword = async(enteredPassword:string, userPassword:string)=>{
  const match = await bcryptjs.compare(enteredPassword, userPassword);
  return match
}


