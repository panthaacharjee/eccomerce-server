import { Document, Types } from "mongoose";

// Address subdocument interface
interface IAddress {
  _id?: Types.ObjectId;
  type: "shipping" | "billing" | "both";
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label: "home" | "work" | "other";
}

// Payment method subdocument interface
interface IPaymentMethod {
  _id?: Types.ObjectId;
  type: string;
  provider: string;
  lastFourDigits: string;
  expiryDate: string;
  isDefault: boolean;
  billingAddress: IAddress;
}

// Order item subdocument interface
interface IOrderItem {
  _id?: Types.ObjectId;
  productName: string;
  variantId: string;
  quantity: number;
  price: number;
  status: "delivered" | "cancelled" | "returned";
}

// Order subdocument interface
interface IOrder {
  _id?: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  orderDate: Date;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: IAddress;
  billingAddress: IAddress;
  paymentMethod: IPaymentMethod;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

// Return item subdocument interface
interface IReturnItem {
  _id?: Types.ObjectId;
  productId: string;
  reason: "wrong_item" | "defective" | "size_issue";
  status: "requested" | "approved" | "refunded";
}

// Return subdocument interface
interface IReturn {
  _id?: Types.ObjectId;
  returnId: string; // UUID
  orderId: string; // UUID
  items: IReturnItem[];
  returnDate: Date;
  refundAmount: number;
}

// Main User interface
interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  account: string;
  authentication: {
    password: string;
    sessionToken: string;
  };
  image?: {
    public_id: string;
    url: string;
  };
  role: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryAddress: IAddress;
  billingAddress: IAddress;
  paymentMethod: IPaymentMethod;
  orders: IOrder[];
  returns: IReturn[];
  phone: string;
}

export default IUser;
export { IAddress, IPaymentMethod, IOrder, IOrderItem, IReturn, IReturnItem };