// models/Product.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  ean?: string;
  title: string;
  description: string;
  price: number;
  cost_price?: number;
  currency: string;
  stock_quantity: number;
  images: ProductImage[];
  thumbnail: string;
  categories: Category;
  sizes: ProductSizes[];
  colors?: ProductColors[];
  weight: string;
  weight_unit: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
    unit: string;
  };
  meta_title?: string;
  meta_description?: string;
  keywords: string[];
  status: string;
  visibility: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  view_count: number;
  purchase_count: number;
  review: ProductReviews[];
}

export interface ProductImage {
  public_id: string;
  url: string;
  is_primary: boolean;
}

export interface Category {
  main_category: string;
  sub_category: string;
}

export interface ProductSizes {
  title: string;
  price: number;
  stock_quantity: number;
}

export interface ProductColors {
  title: string;
  price: number;
  stock_quantity: number;
}

export interface ProductReviews {
  rating: number;
  image: string;
  comment: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },
    ean: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    cost_price: {
      type: Number,
      min: [0, "Cost price must be positive"],
    },
    currency: {
      type: String,
      default: "BDT",
      enum: ["BDT", "USD", "EUR", "GBP", "JPY", "CAD", "AUD"],
    },
    stock_quantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity must be positive"],
      default: 0,
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        is_primary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    thumbnail: {
      type: String,
    },
    categories: {
      main_category: String,
      sub_category: String,
    },
    sizes: [
      {
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Price must be positive"],
        },
        stock_quantity: {
          type: Number,
          required: true,
          min: [0, "Stock quantity must be positive"],
          default: 0,
        },
      },
    ],
    colors: [
      {
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Price must be positive"],
        },
        stock_quantity: {
          type: Number,
          required: true,
          min: [0, "Stock quantity must be positive"],
          default: 0,
        },
      },
    ],
    weight: {
      type: String,
    },
    weight_unit: {
      type: String,
      enum: ["kg", "g", "lb", "oz"],
      default: "kg",
    },
    dimensions: {
      length: {
        type: String,
      },
      width: {
        type: String,
      },
      height: {
        type: String,
      },
      unit: {
        type: String,
        enum: ["cm", "m", "in", "ft"],
        default: "cm",
      },
    },
    meta_title: {
      type: String,
    },
    meta_description: {
      type: String,
    },
    keywords: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    visibility: {
      type: String,
      enum: ["visible", "hidden", "search_only"],
      default: "visible",
    },
    publishedAt: {
      type: Date,
    },
    view_count: {
      type: Number,
      default: 0,
    },
    purchase_count: {
      type: Number,
      default: 0,
    },
    review: [
      {
        rating: {
          type: Number,
          required: true,
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating must be at most 5"],
        },
        image: {
          type: String,
        },
        comment: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);


ProductSchema.index({ status: 1 });
ProductSchema.index({ "categories.name": 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock_quantity: 1 });
ProductSchema.index({ title: "text", description: "text", keywords: "text" });

const Product = mongoose.model<IProduct>("product", ProductSchema);
export default Product;
