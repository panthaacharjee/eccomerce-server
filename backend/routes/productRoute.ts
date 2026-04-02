
const expressProductRoute = require("express");
const productRouter = expressProductRoute.Router();

const {
  productCreate,
  allProduct,
  singleProduct,
  updateProduct,
  deleteProduct,
  deleteProducts,
  restoreProducts,

  getUserProducts,
  getUserSingleProduct,
  getProductsBySubcategory
} = require("../controllers/productControllers");

productRouter.route("/create/product").post(productCreate);
productRouter.route("/all/product").get(allProduct);
productRouter.route("/single/product/:id").get(singleProduct);
productRouter.route("/update/product/:id").put(updateProduct);
productRouter.route("/delete/product/:id").delete(deleteProduct);
productRouter.route("/delete/products").delete(deleteProducts);
productRouter.route("/restore/products").patch(restoreProducts);

productRouter.route("/get/user/products").get(getUserProducts);
productRouter.route("/get/user/single/product/:id").get(getUserSingleProduct);
productRouter.route("/get/products/by/subcategory").get(getProductsBySubcategory);

module.exports = productRouter;
