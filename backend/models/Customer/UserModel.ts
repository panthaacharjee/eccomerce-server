import { Schema, model } from "mongoose";
import IUser from "./UserInterface";

const addressSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["shipping", "billing", "both"],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      enum: ["home", "work", "other"],
      required: true,
    },
  },
  { _id: true }
);

const paymentMethodSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    lastFourDigits: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    billingAddress: addressSchema,
  },
  { _id: true }
);

const orderItemSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["delivered", "cancelled", "returned"],
      required: true,
    },
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
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
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    paymentMethod: paymentMethodSchema,
    trackingNumber: {
      type: String,
    },
    estimatedDelivery: {
      type: Date,
    },
  },
  { _id: true }
);

const returnItemSchema = new Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      enum: ["wrong_item", "defective", "size_issue"],
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "refunded"],
      default: "requested",
    },
  },
  { _id: true }
);

const returnSchema = new Schema(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    items: [returnItemSchema],
    returnDate: {
      type: Date,
      default: Date.now,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
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
    deliveryAddress: addressSchema,
    billingAddress: addressSchema,
    paymentMethod: paymentMethodSchema,
    orders: [orderSchema],
    returns: [returnSchema],
    phone: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ "deliveryAddress.isDefault": 1 });
userSchema.index({ "billingAddress.isDefault": 1 });
userSchema.index({ "paymentMethod.isDefault": 1 });

const User = model<IUser>("User", userSchema);
export default User;