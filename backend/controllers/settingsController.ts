import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import {
  Category,
  SubLabel,
  ICategory,
  ISubLabel,
} from "../models/Category/CategoryModel";
import Slider, { ISlider } from "../models/Category/SliderModel";

import ErrorHandler from "../utils/errorhandler";

/* =====================================================================================================*/
/* ==================================== 1. Create Sub Label =========================================== */
/* ==================================================================================================== */

export const createSubLabel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title } = req.body;

    // Validation
    if (!title) {
      next(ErrorHandler("Sub label title is required", 400, res, next));
      return;
    }

    // Check if sub label already exists
    const existingSubLabel = await SubLabel.findOne({ title });
    if (existingSubLabel) {
      next(
        ErrorHandler(
          "Sub label with this title already exists",
          409,
          res,
          next,
        ),
      );
      return;
    }

    await SubLabel.create({ title });

    const subLabelData = await SubLabel.find();

    res.status(201).json({
      success: true,
      message: "Sub label created successfully",
      sub_label: subLabelData,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 2. Create Category ============================================ */
/* ==================================================================================================== */

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      main_label,
      sub_label = [],
      navmenu = false,
      category_menu = true,
      category_image,
    } = req.body;

    // Validation
    if (!main_label || !category_image?.url) {
      next(
        ErrorHandler(
          "Main label and category image are required",
          400,
          res,
          next,
        ),
      );
      return;
    }

    // Check if main label already exists
    const existingCategory = await Category.findOne({ main_label });
    if (existingCategory) {
      next(
        ErrorHandler(
          "Category with this main label already exists",
          409,
          res,
          next,
        ),
      );
      return;
    }

    // Validate sub labels exist
    if (sub_label.length > 0) {
      const validSubLabels = await SubLabel.find({ _id: { $in: sub_label } });
      if (validSubLabels.length !== sub_label.length) {
        next(
          ErrorHandler("One or more sub labels do not exist", 404, res, next),
        );
        return;
      }
    }

    // Create category
    await Category.create({
      main_label,
      sub_label,
      navmenu,
      category_menu,
      category_image,
    });

    // Populate sub labels
    const populatedCategories = await Category.find().populate("sub_label");

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      categories: populatedCategories,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 3. Update Category ============================================ */
/* ==================================================================================================== */

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      next(ErrorHandler("Category not found", 404, res, next));
      return;
    }

    // If main_label is being updated, check for uniqueness
    if (
      updateData.main_label &&
      updateData.main_label !== category.main_label
    ) {
      const existingCategory = await Category.findOne({
        main_label: updateData.main_label,
      });
      if (existingCategory) {
        next(
          ErrorHandler(
            "Category with this main label already exists",
            409,
            res,
            next,
          ),
        );
        return;
      }
    }

    // Validate sub labels if being updated
    if (updateData.sub_label && Array.isArray(updateData.sub_label)) {
      const validSubLabels = await SubLabel.find({
        _id: { $in: updateData.sub_label },
      });
      if (validSubLabels.length !== updateData.sub_label.length) {
        next(
          ErrorHandler("One or more sub labels do not exist", 404, res, next),
        );
        return;
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("sub_label");

    const populatedCategories = await Category.find().populate("sub_label");

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      categories: populatedCategories,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 4. Delete Category ============================================ */
/* ==================================================================================================== */

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      next(ErrorHandler("Category not found", 404, res, next));
      return;
    }

    // Check if category can be deleted (used_count must be 0)
    if (category.used_count > 0) {
      next(
        ErrorHandler(
          `Cannot delete category. It is currently being used (used count: ${category.used_count})`,
          400,
          res,
          next,
        ),
      );
      return;
    }

    // Delete category
    await Category.findByIdAndDelete(id);

    const populatedCategories = await Category.find().populate("sub_label");

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      categories: populatedCategories,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 5. Get All Categories ========================================= */
/* ==================================================================================================== */

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get categories with pagination and populate
    const categories = await Category.find().populate("sub_label");

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 6. Get User Categories ======================================== */
/* ==================================================================================================== */

export const getUserCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get categories with navmenu = true
    const navmenuCategories = await Category.find({ navmenu: true })
      .populate("sub_label")
      .sort({ createdAt: -1 });

    // Get categories with category_menu = true
    const categoryMenuCategories = await Category.find({ category_menu: true })
      .populate("sub_label")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User categories retrieved successfully",

      navmenu: navmenuCategories,
      category_menu: categoryMenuCategories,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 7. Get Category By ID ========================================= */
/* ==================================================================================================== */

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate("sub_label");
    if (!category) {
      next(ErrorHandler("Category not found", 404, res, next));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 8. Get All Sub Labels ========================================= */
/* ==================================================================================================== */

export const getAllSubLabels = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const subLabels = await SubLabel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sub_label: subLabels,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 9. Update Sub Label =========================================== */
/* ==================================================================================================== */

export const updateSubLabel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      next(ErrorHandler("Sub label title is required", 400, res, next));
      return;
    }

    // Check if sub label exists
    const subLabel = await SubLabel.findById(id);
    if (!subLabel) {
      next(ErrorHandler("Sub label not found", 404, res, next));
      return;
    }

    // Check if title already exists (excluding current sub label)
    const existingSubLabel = await SubLabel.findOne({
      title: title,
      _id: { $ne: id },
    } as any); // Type assertion to fix TypeScript error

    if (existingSubLabel) {
      next(
        ErrorHandler(
          "Sub label with this title already exists",
          409,
          res,
          next,
        ),
      );
      return;
    }

    // Update sub label
    const updatedSubLabel = await SubLabel.findByIdAndUpdate(
      id,
      { title },
      { new: true, runValidators: true },
    );

    const subLabels = await SubLabel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sub label updated successfully",
      sub_label: subLabels,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 10. Delete Sub Label ========================================== */
/* ==================================================================================================== */

export const deleteSubLabel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Convert string ID to ObjectId for type safety
    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id as any);
    } catch (error) {
      next(ErrorHandler("Invalid sub label ID format", 400, res, next));
      return;
    }

    // Check if sub label exists
    const subLabel = await SubLabel.findById(objectId);
    if (!subLabel) {
      next(ErrorHandler("Sub label not found", 404, res, next));
      return;
    }

    // Check if sub label is used in any category
    const categoryUsingSubLabel = await Category.findOne({
      sub_label: { $in: [objectId] },
    });

    if (categoryUsingSubLabel) {
      next(
        ErrorHandler(
          "Cannot delete sub label. It is being used in one or more categories",
          400,
          res,
          next,
        ),
      );
      return;
    }

    // Delete sub label
    await SubLabel.findByIdAndDelete(objectId);

    const subLabels = await SubLabel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sub label deleted successfully",
      sub_label: subLabels,
    });
  } catch (error: any) {
    next(ErrorHandler(error.message, 500, res, next));
  }
};

/* =====================================================================================================*/
/* ==================================== 1. Create Slider ============================================== */
/* ==================================================================================================== */

export const createSlider = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, description, image, status, url, order } = req.body;

    // Check if slider with same title already exists
    const existingSlider = await Slider.findOne({ title });
    if (existingSlider) {
      res.status(400).json({
        success: false,
        message: "Slider with this title already exists",
      });
      return;
    }

    // Create new slider
    await Slider.create({
      title,
      description,
      image,
      status: status || "Draft",
      url: url || "",
      order: order || 0,
    });

    const slider = await Slider.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      message: "Slider created successfully",
      slider,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
      return;
    }
    next(error);
  }
};

/* =====================================================================================================*/
/* ==================================== 2. Get All Sliders ============================================ */
/* ==================================================================================================== */

export const getAllSliders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slider = await Slider.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      slider,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================================================================*/
/* ==================================== 3. Get Single Slider ========================================== */
/* ==================================================================================================== */

export const getSliderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const slider = await Slider.findById(id);

    if (!slider) {
      res.status(404).json({
        success: false,
        message: "Slider not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      slider,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================================================================*/
/* ==================================== 4. Update Slider ============================================== */
/* ==================================================================================================== */

export const updateSlider = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, image, status, url, order } = req.body;

    // Check if slider exists
    const existingSlider = await Slider.findById(id);
    if (!existingSlider) {
      res.status(404).json({
        success: false,
        message: "Slider not found",
      });
      return;
    }

    // Check for duplicate title if title is being updated
    if (title && title !== existingSlider.title) {
      const duplicateSlider = await Slider.findOne({ title });
      if (duplicateSlider) {
        res.status(400).json({
          success: false,
          message: "Slider with this title already exists",
        });
        return;
      }
    }

    // Update slider
    const updatedSlider = await Slider.findByIdAndUpdate(
      id,
      {
        title,
        description,
        image,
        status,
        url,
        order,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    const sliders = await Slider.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Slider updated successfully",
      slider: sliders,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
      return;
    }
    next(error);
  }
};

/* =====================================================================================================*/
/* ==================================== 5. Delete Slider ============================================== */
/* ==================================================================================================== */

export const deleteSlider = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const slider = await Slider.findByIdAndDelete(id);

    if (!slider) {
      res.status(404).json({
        success: false,
        message: "Slider not found",
      });
      return;
    }

    const sliders = await Slider.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Slider deleted successfully",
      slider: sliders,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================================================================*/
/* ==================================== 6. Update Slider Status ======================================= */
/* ==================================================================================================== */

export const updateSliderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Published", "Draft", "Archive"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
      return;
    }

    const slider = await Slider.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!slider) {
      res.status(404).json({
        success: false,
        message: "Slider not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Slider status updated to ${status}`,
      data: slider,
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================================================================*/
/* ==================================== 7. Reorder Sliders ============================================ */
/* ==================================================================================================== */

export const reorderSliders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { sliders } = req.body; // Array of { id, order }

    if (!Array.isArray(sliders)) {
      res.status(400).json({
        success: false,
        message: "Sliders array is required",
      });
      return;
    }

    const updatePromises = sliders.map(({ id, order }) =>
      Slider.findByIdAndUpdate(id, { order }, { new: true }),
    );

    const updatedSliders = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Sliders reordered successfully",
      data: updatedSliders,
    });
  } catch (error) {
    next(error);
  }
};
