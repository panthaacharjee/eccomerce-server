import { Schema, model } from "mongoose";
import IUser from "./UserInterface";



const orderItemSchema = new Schema(
  {
    productName: {
      type: String,
    },
    variantId: {
      type: String,
    },
    quantity: {
      type: Number,
      min: 1,
    },
    price: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["delivered", "cancelled", "returned"],
    },
  }
);

const orderSchema = new Schema(
  {
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: {
      type: String,
    },
    estimatedDelivery: {
      type: Date,
    },
  }
);

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    account: {
      type: String,
      default: "Regular",
    },
    authentication: {
      password: {
        type: String,
        select: false,
      },
      sessionToken: {
        type: String,
        select: false,
      },
    },
    image: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "User",
      enum: ["User", "Admin", "Moderator"],
    },
    orders: [orderSchema],
    phone: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);



const User = model<IUser>("User", userSchema);
export default User;