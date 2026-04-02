import { Request, Response, NextFunction } from "express";
const catchAsyncError = require("../middleware/catchAsyncError");

import ErrorHandler from "../utils/errorhandler";
import { validateProductData } from "../utils/validators";

import Product, { IProduct } from "../models/Product/ProductModel";

/* =====================================================================================================*/
/* ================================ Product Create (POST) (/create/product) ================================== */
/* ==================================================================================================== */
export const productCreate = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      sku,
      ean,
      title,
      description,
      price,
      cost_price,
      currency = "BDT",
      stock_quantity = 0,
      images = [],
      thumbnail,
      categories,
      sizes = [],
      colors = [],
      keywords = [],
      meta_title,
      meta_description,
      status = "draft",
      visibility = "visible",
      publishedAt,
      weight = "",
      weight_unit = "kg",
      length = "",
      width = "",
      height = "",
      dimension_unit = "cm",
    } = req.body;

    // Validation
    const validationErrors = validateProductData(req.body);
    if (validationErrors.length > 0) {
      return next(ErrorHandler(validationErrors.join(", "), 400, res, next));
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return next(
        ErrorHandler(`Product with SKU ${sku} already exists`, 400, res, next),
      );
    }

    // Create product
    await Product.create({
      sku,
      ean,
      title,
      description,
      price: Number(price),
      cost_price: cost_price ? Number(cost_price) : undefined,
      currency,
      stock_quantity: Number(stock_quantity),
      images: Array.isArray(images)
        ? images.map((img: any, index: number) => ({
            public_id: img.public_id || `product_${sku}_${Date.now()}_${index}`,
            url: img.url || "",
            is_primary: img.is_primary || (index === 0 && !thumbnail),
          }))
        : [],
      thumbnail: thumbnail || images[0]?.url || "",
      categories: categories,
      sizes: Array.isArray(sizes)
        ? sizes.map((size) => ({
            title: size.title || "",
            price: Number(size.price) || 0,
            stock_quantity: Number(size.stock_quantity) || 0,
          }))
        : [],
      colors: Array.isArray(colors)
        ? colors.map((color) => ({
            title: color.title || "",
            price: Number(color.price) || 0,
            stock_quantity: Number(color.stock_quantity) || 0,
          }))
        : [],
      weight,
      weight_unit,
      dimensions: {
        length,
        width,
        height,
        unit: dimension_unit,
      },
      meta_title,
      meta_description,
      keywords: Array.isArray(keywords) ? keywords : [],
      status,
      visibility,
      publishedAt:
        status === "published" && !publishedAt ? new Date() : publishedAt,
      view_count: 0,
      purchase_count: 0,
      review: [],
    });

    const allProducts = await Product.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      products: allProducts,
    });
  },
);

/* =====================================================================================================*/
/* ================================ ALL Product (get) (/all/product) ================================== */
/* ==================================================================================================== */
exports.allProduct = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      products,
    });
  },
);

/* =====================================================================================================*/
/* =========================== Single Product (get) (/single/product/:id) ============================== */
/* ==================================================================================================== */
exports.singleProduct = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
      success: true,
      product,
    });
  },
);

/* =====================================================================================================*/
/* =========================== Update Product (put) (/update/product/:id) ============================== */
/* ==================================================================================================== */
export const updateProduct = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const {
      sku,
      ean,
      title,
      description,
      price,
      cost_price,
      currency,
      stock_quantity,
      images = [],
      thumbnail,
      categories,
      sizes = [],
      colors = [],
      keywords = [],
      meta_title,
      meta_description,
      status,
      visibility,
      weight,
      weight_unit,
      length,
      width,
      height,
      dimension_unit,
    } = req.body;

    // Find product
    let product = await Product.findById(id);
    if (!product) {
      return next(ErrorHandler("Product not found", 404, res, next));
    }

    // Check if SKU is being changed and if it already exists
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return next(
          ErrorHandler(
            `Product with SKU ${sku} already exists`,
            400,
            res,
            next,
          ),
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add fields only if they are provided
    if (sku !== undefined) updateData.sku = sku;
    if (ean !== undefined) updateData.ean = ean;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (cost_price !== undefined) {
      updateData.cost_price = cost_price ? Number(cost_price) : undefined;
    }
    if (currency !== undefined) updateData.currency = currency;
    if (stock_quantity !== undefined) {
      updateData.stock_quantity = Number(stock_quantity);
    }
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined)
      updateData.meta_description = meta_description;
    if (status !== undefined) {
      updateData.status = status;
      // Set publishedAt if status changes to published and it wasn't published before
      if (status === "published" && !product.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (visibility !== undefined) updateData.visibility = visibility;
    if (weight !== undefined) updateData.weight = weight;
    if (weight_unit !== undefined) updateData.weight_unit = weight_unit;

    // Handle images
    if (Array.isArray(images)) {
      // Process images array
      updateData.images = images.map((img: any, index: number) => ({
        public_id: img.public_id || `product_${sku}_${Date.now()}_${index}`,
        url: img.url || "",
        is_primary: img.is_primary || (index === 0 && !thumbnail),
      }));

      // Update thumbnail
      if (thumbnail !== undefined) {
        updateData.thumbnail = thumbnail;
      } else {
        // Find primary image or use first image
        const primaryImage = images.find((img: any) => img.is_primary);
        updateData.thumbnail =
          primaryImage?.url || images[0]?.url || product.thumbnail;
      }
    }

    // Handle categories
    updateData.categories = categories;

    // Handle sizes
    if (Array.isArray(sizes)) {
      updateData.sizes = sizes.map((size) => ({
        title: size.title || "",
        price: Number(size.price) || 0,
        stock_quantity: Number(size.stock_quantity) || 0,
      }));
    }

    // Handle colors
    if (Array.isArray(colors)) {
      updateData.colors = colors.map((color) => ({
        title: color.title || "",
        price: Number(color.price) || 0,
        stock_quantity: Number(color.stock_quantity) || 0,
      }));
    }

    // Handle keywords
    if (Array.isArray(keywords)) {
      updateData.keywords = keywords;
    }

    // Handle dimensions
    if (
      length !== undefined ||
      width !== undefined ||
      height !== undefined ||
      dimension_unit !== undefined
    ) {
      updateData.dimensions = {
        length:
          length !== undefined ? length : product.dimensions?.length || "",
        width: width !== undefined ? width : product.dimensions?.width || "",
        height:
          height !== undefined ? height : product.dimensions?.height || "",
        unit:
          dimension_unit !== undefined
            ? dimension_unit
            : product.dimensions?.unit || "cm",
      };
    }

    // Update product
    product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      products,
    });
  },
);

/* =====================================================================================================*/
/* =========================== Delete Product (delete) (/delete/product/:id) ============================== */
/* ==================================================================================================== */
export const deleteProduct = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Find product to be deleted
    const product = await Product.findById(id);

    if (!product) {
      return next(ErrorHandler("Product not found", 404, res, next));
    }

    if (product.purchase_count > 0) {
      return next(
        ErrorHandler(
          `Cannot delete product with purchase history. Product has ${product.purchase_count} purchases.`,
          400,
          res,
          next,
        ),
      );
    }

    product.status = "archived";
    product.deletedAt = new Date();
    product.visibility = "hidden";
    await product.save();

    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      products,
    });
  },
);

/* =====================================================================================================*/
/* =========================== Delete Archeve Product (put) (/delete/products)======================== */
/* ==================================================================================================== */
export const deleteProducts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { deletedProducts } = req.body;

    if (!Array.isArray(deletedProducts) || deletedProducts.length === 0) {
      return next(
        ErrorHandler(
          "Please provide an array of product IDs to delete",
          400,
          res,
          next,
        ),
      );
    }

    // Find all archived and hidden products from the provided list
    const productsToDelete = await Product.find({
      _id: { $in: deletedProducts },
      status: "archived",
      visibility: "hidden",
      deletedAt: { $exists: true }, // Ensure they are marked as deleted
    });

    if (productsToDelete.length === 0) {
      return next(
        ErrorHandler(
          "No archived and hidden products found to delete permanently",
          404,
          res,
          next,
        ),
      );
    }

    // Check if any product has purchase history
    const productsWithPurchases = productsToDelete.filter(
      (product) => product.purchase_count > 0,
    );

    if (productsWithPurchases.length > 0) {
      const productInfo = productsWithPurchases
        .map(
          (p) => `${p.title} (SKU: ${p.sku}) - ${p.purchase_count} purchase(s)`,
        )
        .join(", ");

      return next(
        ErrorHandler(
          `Cannot permanently delete products with purchase history: ${productInfo}`,
          400,
          res,
          next,
        ),
      );
    }

    // Get SKUs for logging/debugging
    const productSKUs = productsToDelete.map((p) => p.sku);

    // Permanently delete products from database
    const deleteResult = await Product.deleteMany({
      _id: { $in: deletedProducts },
      status: "archived",
      visibility: "hidden",
      deletedAt: { $exists: true },
    });

    // Get remaining products (non-deleted ones)
    const products = await Product.find({
      deletedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    // Get remaining archived products (for admin view)
    const archivedProducts = await Product.find({
      status: "archived",
      deletedAt: { $exists: true },
    }).sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} product(s) permanently deleted`,
      deletedCount: deleteResult.deletedCount,
      deletedSKUs: productSKUs,
      products, // Active products
      archivedProducts, // Remaining archived products
    });
  },
);

/* =====================================================================================================*/
/* =========================== Restore Deleted Product (patch) (/restore/products)======================== */
/* ==================================================================================================== */
export const restoreProducts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { restoreProducts } = req.body;
    if (!Array.isArray(restoreProducts) || restoreProducts.length === 0) {
      return next(
        ErrorHandler(
          "Please provide an array of product IDs to restore",
          400,
          res,
          next,
        ),
      );
    }

    // Find all archived products from the provided list
    const productsToRestore = await Product.find({
      _id: { $in: restoreProducts },
      status: "archived",
      deletedAt: { $exists: true },
    });

    if (productsToRestore.length === 0) {
      return next(
        ErrorHandler("No archived products found to restore", 404, res, next),
      );
    }

    // Restore all products - set status to draft and remove deletedAt
    const restoreResult = await Product.updateMany(
      {
        _id: { $in: restoreProducts },
        status: "archived",
        deletedAt: { $exists: true },
      },
      {
        $set: {
          status: "draft",
          visibility: "visible",
          updatedAt: new Date(),
        },
        $unset: {
          deletedAt: 1,
        },
      },
    );

    // Get all products for response
    const activeProducts = await Product.find({
      deletedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `${restoreResult.modifiedCount} product(s) restored successfully`,
      products: activeProducts,
    });
  },
);

/* =====================================================================================================*/
/* =========================== Get User Product (get) (/get/user/products) ============================ */
/* ==================================================================================================== */
export const getUserProducts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      q,
      category,
      sub,
    } = req.query;

    // Helper function to capitalize first letter of each word and replace hyphens with spaces
    const formatCategory = (str: string) => {
      // First, replace hyphens with spaces
      let formatted = str.replace(/-/g, ' ');
      // Then capitalize each word
      return formatted.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };

    // Build search query
    const searchQuery: any = {
      status: "published",
      visibility: { $ne: "hidden" },
      deletedAt: { $exists: false },
    };

    // Text search if query parameter exists
    if (q && typeof q === 'string' && q.trim()) {
      searchQuery.$text = { $search: q.trim() };
    }

    // Category filter - format to match database format
    if (category && typeof category === 'string' && category.trim()) {
      const formattedCategory = formatCategory(category.trim());

      if (sub && typeof sub === 'string' && sub.trim()) {
        const formattedSub = formatCategory(sub.trim());

        // Option 1: If categories is an object (not array)
        searchQuery['categories.main_category'] = formattedCategory;
        searchQuery['categories.sub_category'] = formattedSub;

        // Option 2: If categories is an array of objects, use $elemMatch
        // searchQuery.categories = {
        //   $elemMatch: {
        //     main_category: formattedCategory,
        //     sub_category: formattedSub
        //   }
        // };

        console.log("Filtering by:", { main: formattedCategory, sub: formattedSub });
      } else {
        searchQuery['categories.main_category'] = formattedCategory;
        console.log("Filtering by main category:", formattedCategory);
      }
    } else if (sub && typeof sub === 'string' && sub.trim()) {
      const formattedSub = formatCategory(sub.trim());
      searchQuery['categories.sub_category'] = formattedSub;
      console.log("Filtering by sub category:", formattedSub);
    }

    // Fetch products
    let productsQuery = Product.find(searchQuery);

    if (q && typeof q === 'string' && q.trim()) {
      productsQuery = productsQuery
        .select({ score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } });
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    const products = await productsQuery.lean();

    console.log(`Found ${products.length} products`);
    if (products.length === 0) {
      console.log("Search query used:", JSON.stringify(searchQuery, null, 2));
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  }
);

/* =====================================================================================================*/
/* ================== Get User Single Product (get) (/get/user/single/product/:id) ==================== */
/* ==================================================================================================== */
export const getUserSingleProduct = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        return next(ErrorHandler("Product not found", 404, res, next));
      }
      res.status(200).json({
        success: true,
        product,
      });
    } catch (error: any) {
      console.error("Error fetching product:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch product",
      });
    }
  },
);

    

/* =====================================================================================================*/
/* ================== Get Products By Subcategory (get) (/get/products/by/subcategory) =============== */
/* ==================================================================================================== */
export const getProductsBySubcategory = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sub_category, excludeId, limit = 8 } = req.query;

      // Validate sub_category
      if (!sub_category) {
        return next(
          ErrorHandler("Subcategory parameter is required", 400, res, next)
        );
      }

      // Build query
      const query: any = {
        "categories.sub_category": sub_category,
        status: "published",
        visibility: { $ne: "hidden" },
        deletedAt: { $exists: false },
      };

      // Exclude current product if excludeId is provided
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      // Fetch products
      const products = await Product.find(query)
        .limit(Number(limit))
        .sort({ createdAt: -1, purchase_count: -1 }); // Sort by newest first and then by popularity

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error: any) {
      console.error("Error fetching products by subcategory:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch products by subcategory",
      });
    }
  }
);
