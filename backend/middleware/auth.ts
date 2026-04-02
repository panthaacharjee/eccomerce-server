import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorhandler";
import User from "../models/Customer/UserModel";
const jwt = require("jsonwebtoken");
const catchAsyncError = require("../middleware/catchAsyncError");

declare global {
  namespace Express {
    interface Request {
      user?: any; // or your User type/interface
    }
  }
}

exports.isAuthenticatedUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // const {token} = req.cookies
    const token = req.headers["authorization"] || req.cookies;

    const bearer = token.split(" ");

    if (!token) {
      return next(ErrorHandler("Token Not Found!", 404, res, next));
    }
    const decodeData = jwt.verify(bearer[1], process.env.JWT_SECRET);
    const user = await User.findById(decodeData.id);
    req.user = user;

    next();
  },
);
