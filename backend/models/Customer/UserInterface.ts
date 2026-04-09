import { Document, Types } from "mongoose";



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
  trackingNumber?: string;
  estimatedDelivery?: Date;
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
  orders: IOrder[];
  phone: string;
}

export default IUser;
export { IOrder, IOrderItem};