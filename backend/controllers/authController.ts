import { Request, Response, NextFunction } from "express";
const catchAsyncError = require("../middleware/catchAsyncError");
import User from "../models/Customer/UserModel";
import ErrorHandler from "../utils/errorhandler";
import hashPassword from "../utils/HashPassword";
const { comparePassword } = require("../utils/ComparePassword");
const sendToken = require("../utils/jwtToken");
const token = require("../utils/Token");
const sendEmail = require("../utils/sendEmail");

/* =====================================================================================================*/
/* ============================= REGISTER USER (POST) (/register/user) ================================= */
/* ===================================================================================================== */
exports.registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, password } = req.body;


    if (!email || !password) {
      return next(ErrorHandler("ALL FIELDS ARE REQUIRED", 400, res, next));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ErrorHandler("USER ALREADY EXISTS", 409, res, next));
    }


    // Await the hashPassword function
    const hashPass = await hashPassword(password);

    console.log("Hashed Password:", hashPass); 
    // Create user
   try{
     const user = await User.create({
       firstName,
       lastName,
       email,
       authentication: {
         password: hashPass,
       },
     });

     const sessionToken = token(user._id);
     user.authentication.sessionToken = sessionToken;
     await user.save();

     sendToken(user, 201, res);
   }catch(error){
     console.error("Error creating user:", error);
   }


   
  },
);

/* ===================================================================================================== */
/* ================================= LOGIN USER (POST) (/login/user) =================================== */
/* ===================================================================================================== */
exports.loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      return next(ErrorHandler("EMAIL OR PASSWORD REQUERED", 400, res, next));
    }

    const user = await User.findOne({ email }).select(
      "+authentication.password",
    );
    if (!user) {
      return next(
        ErrorHandler("PLEASE ENTER VALID EMAIL OR PASSWORD", 400, res, next),
      );
    }

    const isPasswordMatched = await comparePassword(
      password,
      user.authentication.password,
    );
    if (!isPasswordMatched) {
      return next(
        ErrorHandler("PLEASE ENTER VALID EMAIL OR PASSWORD", 400, res, next),
      );
    }

    await user.save();

    const sessionToken = token(user._id);
    user.authentication.sessionToken = sessionToken;
    await user.save();
    sendToken(user, 201, res);
  },
);

/* ===================================================================================================== */
/* ============================= LOGIN AUTHORIZATION(POST) (/login/auth) ================================= */
/* ===================================================================================================== */

exports.loginAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      email,
      accountType,
    }: {
      email: string;
      accountType: string;
    } = req.body;


    const accountUser = await User.find({ account: accountType });
    let finalUser = accountUser.filter((val) => val.email === email);

    console.log("Final User:", finalUser); // Debugging log
    if (finalUser.length !== 0) {
      const user = await User.findById(finalUser[0]._id);
      if (user) {
        const sessionToken = token(user._id);
        user.authentication.sessionToken = sessionToken;
        await user.save();
        sendToken(user, 201, res);
      } else {
        return next(
          ErrorHandler(
            "SOMETHING WENT WRONG! PROCCED AFTER SOMETIMES",
            502,
            res,
            next
          )
        );
      }
    } else {
      const user = await User.create({
        email: email,
        authentication: {
          password: "123456789",
        },
        role: "Guest",
        account: accountType,
      });
     
      const sessionToken = token(user._id);
      user.authentication.sessionToken = sessionToken;
      await user.save();
      sendToken(user, 201, res);
    }
  }
);


/* ===================================================================================================== */
/* ==================================== LOGOUT USER (GET) (/logout) ==================================== */
/* ===================================================================================================== */
exports.logout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "LOG OUT",
    });
  },
);

/* ===================================================================================================== */
/* ============================= FORGOT PASSWORD (post) (/forgot/password) ============================= */
/* ===================================================================================================== */
exports.fortgotPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email }: { email: string } = req.body;
    if (!email) {
      return next(ErrorHandler("EMAIL ARE REQUIRED", 400, res, next));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ErrorHandler("USER ALREADY EXISTS", 409, res, next));
    }

    await sendEmail({
      email: email,
      subject: "FORGOT PASSWORD",
      text: "FORGOT PASSWORD",
    });
  },
);

/* ===================================================================================================== */
/* =================================== GET USER (get) (/get/user) ====================================== */
/* ===================================================================================================== */
exports.getUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById((req as any).user._id);

    res.status(200).json({
      success: true,
      user,
    });
  },
);

/* ===================================================================================================== */
/* ================================= LOGIN ADMIN (POST) (/login/admin) =================================== */
/* ===================================================================================================== */
exports.loginAdmin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      return next(ErrorHandler("EMAIL OR PASSWORD REQUERED", 400, res, next));
    }

    const user = await User.findOne({ email }).select(
      "+authentication.password",
    );
    if (!user) {
      return next(
        ErrorHandler("PLEASE ENTER VALID EMAIL OR PASSWORD", 400, res, next),
      );
    }

    if (user.role === "User") {
      return next(ErrorHandler("YOU ARE NOT ADMIN", 400, res, next));
    }

    const isPasswordMatched = await comparePassword(
      password,
      user.authentication.password,
    );
    if (!isPasswordMatched) {
      return next(
        ErrorHandler("PLEASE ENTER VALID EMAIL OR PASSWORD", 400, res, next),
      );
    }

    await user.save();

    const sessionToken = token(user._id);
    user.authentication.sessionToken = sessionToken;
    await user.save();

    sendToken(user, 201, res);
  },
);


/* ===================================================================================================== */
/* =================================== GET ALL USERS (get) (/get/users) ====================================== */
/* ===================================================================================================== */
exports.getAllUsers = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find().populate("orders"); 


    res.status(200).json({
      success: true,
      users: users,
    });
  },
);
      