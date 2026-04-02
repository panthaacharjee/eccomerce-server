import { NextFunction } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import IUser from '../Customer/UserInterface';


export interface Order {
    user: IUser;
    orderId: string;
    items: OrderItem[];
    deliveryInfo: DeliveryInfo;
    billingInfo: BillingInfo | null;
    shippingMethod: ShippingMethod;
    paymentMethod: PaymentMethod;
    mobilePayment?: MobilePaymentDetails | null;
    bankPayment?: BankPaymentDetails | null;
    subtotal: number;
    shippingFee: number;
    tax: number;
    total: number;
    orderDate: string;
    currency: string;
    orderStatus?: OrderStatus;
    userId?: string;
    notes?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    updatedAt?: string;
    
}

export interface OrderItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    thumbnail: string;
    total: number;
}


export interface DeliveryInfo {
    firstName: string;
    lastName: string;
    country: string;
    streetAddress: string;
    apartment?: string;
    city: string;
    district: string;
    postcode: string;
    phone: string;
    email: string;
    orderNotes?: string;
}

export interface BillingInfo {
    sameAsDelivery: boolean;
    firstName: string;
    lastName: string;
    streetAddress: string;
    apartment?: string;
    city: string;
    district: string;
    postcode: string;
    phone: string;
    email: string;
}

export interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    fee: number;
    estimatedDelivery: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: "cod" | "mobile" | "bank";
    details?: {
        provider?: string;
        accountNumber?: string;
        transactionId?: string;
    };
}

export interface MobilePaymentDetails {
    mobileNumber: string;
    transactionId: string;
    provider: "bkash" | "nagad" | "rocket";
    amount: number;
    paymentTime?: string;
    verified?: boolean;
}

export interface BankPaymentDetails {
    bankName: "dutch" | "city" | "brac";
    accountNumber: string;
    transactionId: string;
    accountHolderName?: string;
    routingNumber?: string;
    branch?: string;
    amount: number;
    verified?: boolean;
}

export type OrderStatus =
    | "pending"
    | "processing"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";



// Extend the interface with Document for Mongoose
export interface IOrder extends Document, Omit<Order, 'orderId' | 'items' | 'deliveryInfo' | 'billingInfo' | 'shippingMethod' | 'paymentMethod' | 'mobilePayment' | 'bankPayment'> {
    user: IUser;
    orderId: string;
    items: IOrderItem[];
    deliveryInfo: IDeliveryInfo;
    billingInfo: IBillingInfo | null;
    shippingMethod: IShippingMethod;
    paymentMethod: IPaymentMethod;
    mobilePayment?: IMobilePaymentDetails | null;
    bankPayment?: IBankPaymentDetails | null;
}

export interface IOrderItem extends Document, OrderItem { }
export interface IDeliveryInfo extends Document, DeliveryInfo { }
export interface IBillingInfo extends Document, BillingInfo { }
export interface IShippingMethod extends Document, ShippingMethod { }
export interface IPaymentMethod extends Document, PaymentMethod { }
export interface IMobilePaymentDetails extends Document, MobilePaymentDetails { }
export interface IBankPaymentDetails extends Document, BankPaymentDetails { }

// Order Item Schema
const OrderItemSchema = new Schema<IOrderItem>({
    id: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String },
    thumbnail: { type: String, required: true },
    total: { type: Number, required: true, min: 0 }
}, { _id: false });

// Delivery Info Schema
const DeliveryInfoSchema = new Schema<IDeliveryInfo>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    country: { type: String, required: true },
    streetAddress: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postcode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    orderNotes: { type: String }
}, { _id: false });

// Billing Info Schema
const BillingInfoSchema = new Schema<IBillingInfo>({
    sameAsDelivery: { type: Boolean, default: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postcode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true }
}, { _id: false });

// Shipping Method Schema
const ShippingMethodSchema = new Schema<IShippingMethod>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 },
    estimatedDelivery: { type: String, required: true }
}, { _id: false });

// Payment Method Schema
const PaymentMethodSchema = new Schema<IPaymentMethod>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['cod', 'mobile', 'bank'], required: true },
    details: {
        provider: { type: String },
        accountNumber: { type: String },
        transactionId: { type: String }
    }
}, { _id: false });

// Mobile Payment Details Schema
const MobilePaymentDetailsSchema = new Schema<IMobilePaymentDetails>({
    mobileNumber: { type: String, required: true },
    transactionId: { type: String, required: true },
    provider: { type: String, enum: ['bkash', 'nagad', 'rocket'], required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentTime: { type: String },
    verified: { type: Boolean, default: false }
}, { _id: false });

// Bank Payment Details Schema
const BankPaymentDetailsSchema = new Schema<IBankPaymentDetails>({
    bankName: { type: String, enum: ['dutch', 'city', 'brac'], required: true },
    accountNumber: { type: String, required: true },
    transactionId: { type: String, required: true },
    accountHolderName: { type: String },
    routingNumber: { type: String },
    branch: { type: String },
    amount: { type: Number, required: true, min: 0 },
    verified: { type: Boolean, default: false }
}, { _id: false });

// Main Order Schema
const OrderSchema = new Schema<IOrder>({
    user:{
        type: Schema.Types.ObjectId,
        ref:"user"
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: [(items: IOrderItem[]) => items.length > 0, 'Order must have at least one item']
    },
    deliveryInfo: {
        type: DeliveryInfoSchema,
        required: true
    },
    billingInfo: {
        type: BillingInfoSchema,
        default: null
    },
    shippingMethod: {
        type: ShippingMethodSchema,
        required: true
    },
    paymentMethod: {
        type: PaymentMethodSchema,
        required: true
    },
    mobilePayment: {
        type: MobilePaymentDetailsSchema,
        default: null
    },
    bankPayment: {
        type: BankPaymentDetailsSchema,
        default: null
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    tax: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    orderDate: {
        type: String,
        required: true,
        default: () => new Date().toISOString()
    },
    currency: {
        type: String,
        required: true,
        default: 'BDT',
        uppercase: true,
        maxlength: 3
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    userId: {
        type: String,
        index: true
    },
    notes: {
        type: String
    },
    trackingNumber: {
        type: String
    },
    estimatedDelivery: {
        type: String
    },
    updatedAt: {
        type: String
    }
}, {
    timestamps: true, // This will add createdAt and updatedAt automatically
    versionKey: '__v'
});

// Index for better query performance
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ userId: 1, orderDate: -1 });
OrderSchema.index({ orderStatus: 1 });

// Method to calculate total
OrderSchema.methods.calculateTotal = function (): number {
    const subtotal = this.items.reduce((sum: number, item: IOrderItem) => sum + item.total, 0);
    return subtotal + (this.shippingFee || 0) + (this.tax || 0);
};

// Static method to find orders by user
OrderSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId }).sort({ orderDate: -1 });
};

// Virtual for formatted order date
OrderSchema.virtual('formattedOrderDate').get(function () {
    return new Date(this.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Ensure virtuals are included in JSON output
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

// Create and export the model
export const Order = mongoose.model<IOrder>('Order', OrderSchema);

// Export individual models if needed
export const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
export const DeliveryInfo = mongoose.model<IDeliveryInfo>('DeliveryInfo', DeliveryInfoSchema);
export const BillingInfo = mongoose.model<IBillingInfo>('BillingInfo', BillingInfoSchema);
export const ShippingMethod = mongoose.model<IShippingMethod>('ShippingMethod', ShippingMethodSchema);
export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);
export const MobilePaymentDetails = mongoose.model<IMobilePaymentDetails>('MobilePaymentDetails', MobilePaymentDetailsSchema);
export const BankPaymentDetails = mongoose.model<IBankPaymentDetails>('BankPaymentDetails', BankPaymentDetailsSchema);