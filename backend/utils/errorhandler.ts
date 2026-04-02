import {  NextFunction,  Response } from "express";

function ErrorHandler (message:string, statusCode:number,  res:Response, next:NextFunction){
   return next(res.status(statusCode).json({
    success:false,
    message:String(message)
   }))
}

export default ErrorHandler