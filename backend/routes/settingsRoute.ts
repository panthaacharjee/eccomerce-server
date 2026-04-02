const settingExpress = require("express");
const settingsRouter = settingExpress.Router();

import {
  createSubLabel,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getUserCategories,
  getAllSubLabels,
  updateSubLabel,
  deleteSubLabel,
  getCategoryById,
  createSlider,
  getAllSliders,
  getSliderById,
  updateSlider,
  deleteSlider,
  updateSliderStatus,
  reorderSliders,
} from "../controllers/settingsController";

// Sub Label Routes
settingsRouter.route("/sub-label/create").post(createSubLabel);
settingsRouter.route("/sub-labels").get(getAllSubLabels);
settingsRouter.route("/sub-label/:id").put(updateSubLabel);
settingsRouter.route("/sub-label/:id").delete(deleteSubLabel);

// Category Routes
settingsRouter.route("/create/category").post(createCategory);
settingsRouter.route("/all/category").get(getAllCategories);
settingsRouter.route("/user/category").get(getUserCategories);
settingsRouter.route("/update/category/:id").put(updateCategory);
settingsRouter.route("delete/category/:id").delete(deleteCategory);
settingsRouter.route("/get/category/:id").get(getCategoryById);

// Create a new slider
settingsRouter.route("/create/slider").post(createSlider);

settingsRouter.route("/all/slider").get(getAllSliders);

settingsRouter.route("/slider/:id").get(getSliderById);

settingsRouter.route("/update/slider/:id").put(updateSlider);

settingsRouter.route("/delete/slider/:id").delete(deleteSlider);

settingsRouter.route("/update/slider/staus").patch(updateSliderStatus);

settingsRouter.route("/reorder/slider").patch(reorderSliders);

module.exports = settingsRouter;
