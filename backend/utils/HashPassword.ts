const bcryptjs = require("bcryptjs")

function convertTo2a(hash:string) {
  return hash.replace(/^\$2b\$/, '$2a$');
}

//Hashing Password
const hashPassword = async(password:string)=>{
    const hash = await bcryptjs.hash(password, 10)
    const   pass  = convertTo2a(hash)
    return pass
}

export default hashPassword