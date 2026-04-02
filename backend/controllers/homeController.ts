import { Request, Response, NextFunction } from "express";
const catchAsyncError = require("../middleware/catchAsyncError");

import ErrorHandler from "../utils/errorhandler";
import { validateProductData } from "../utils/validators";
import Slider from "../models/Category/SliderModel";
import { Category } from "../models/Category/CategoryModel";


/* =====================================================================================================*/
/* ================================ Get Sliders (GET) (/all/sliders) ================================== */
/* ==================================================================================================== */
export const getSliders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const sliders  = await Slider.find({ status: "Published" }).sort({ order: 1 });

    res.status(201).json({
      success: true,
      sliders
    
    });
  },
);


/* =====================================================================================================*/
/* ================================ Get Navitems (GET) (/navitems) ================================== */
/* ==================================================================================================== */
export const getNavitems = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const navItems = await Category.find({navmenu: true}).select("main_label sub_label").populate("sub_label");

        res.status(201).json({
            success: true,
            navItems
        });
    },
);


/* =====================================================================================================*/
/* ================================ Get Category (GET) (/category) ================================== */
/* ==================================================================================================== */
export const getCategory = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const categoryItems = await Category.find({ category_menu: true }).select("main_label category_image")

        res.status(201).json({
            success: true,
            categoryItems
        });
    },
);