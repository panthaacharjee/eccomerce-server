import { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order/OrderModel"; 
import  User  from "../models/Customer/UserModel"; 
import ErrorHandler from "../utils/errorhandler";

const catchAsyncError = require("../middleware/catchAsyncError")

const generateOrderId = async (userId?: string, maxRetries = 3): Promise<string> => {
    for (let i = 0; i < maxRetries; i++) {
        // Add userId to make ID more unique for guests
        const prefix = userId ? userId.slice(-6) : 'GUEST';
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderId = `ORD-${prefix}-${timestamp}-${random}`;

        // Add a small random delay to reduce race conditions
        if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        }

        // Check if ID exists
        const existingOrder = await Order.findOne({ orderId });
        if (!existingOrder) {
            return orderId;
        }
    }

    // If all retries failed, use crypto for guaranteed uniqueness
    const crypto = require('crypto');
    const uniqueId = crypto.randomBytes(8).toString('hex').toUpperCase();
    const fallbackId = `ORD-${Date.now()}-${uniqueId}`;
    return fallbackId;
};

// Helper function to calculate totals
const calculateTotals = (items: any[], shippingFee: number, taxRate: number = 0) => {
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        return sum + itemTotal;
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + shippingFee + tax;

    return { subtotal, tax, total };
};

// Helper function to validate payment details based on payment method
const validatePaymentDetails = (paymentMethod: any, mobilePayment?: any, bankPayment?: any): string | null => {
    if (paymentMethod.type === 'mobile') {
        if (!mobilePayment) return 'Mobile payment details are required';
        if (!mobilePayment.mobileNumber) return 'Mobile number is required';
        if (!mobilePayment.transactionId) return 'Transaction ID is required';
        if (!mobilePayment.provider) return 'Mobile payment provider is required';
        if (!mobilePayment.amount || mobilePayment.amount <= 0) return 'Valid amount is required';
    }

    if (paymentMethod.type === 'bank') {
        if (!bankPayment) return 'Bank payment details are required';
        if (!bankPayment.bankName) return 'Bank name is required';
        if (!bankPayment.accountNumber) return 'Account number is required';
        if (!bankPayment.transactionId) return 'Transaction ID is required';
        if (!bankPayment.amount || bankPayment.amount <= 0) return 'Valid amount is required';
    }

    return null;
};

/* =====================================================================================================*/
/* ================================ Create Order (POST) (/order/create) ==========================*/
/* ==================================================================================================== */
export const createOrder = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        // Retry mechanism for duplicate order IDs
        const maxAttempts = 2;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const {
                    shippingInfo,
                    orderItems,
                    billingInfo,
                    shippingMethod,
                    paymentMethod,
                    mobilePayment,
                    bankPayment,
                    currency = 'BDT',
                    notes,
                    taxRate = 0
                } = req.body;

                // Validate required fields
                if (!shippingInfo) {
                    return next(ErrorHandler('Shipping information is required', 400, res, next));
                }

                if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
                    return next(ErrorHandler('Order items are required and must be a non-empty array', 400, res, next));
                }

                // Validate shipping info fields
                const requiredShippingFields = ['firstName', 'lastName', 'email', 'phone', 'streetAddress', 'city', 'postcode', 'country'];
                for (const field of requiredShippingFields) {
                    if (!shippingInfo[field]) {
                        return next(ErrorHandler(`Shipping info ${field} is required`, 400, res, next));
                    }
                }

                // Validate shipping method
                if (!shippingMethod?.id || !shippingMethod?.name || shippingMethod.fee === undefined) {
                    return next(ErrorHandler('Valid shipping method with id, name, and fee is required', 400, res, next));
                }

                // Validate payment method
                if (!paymentMethod?.id || !paymentMethod?.name || !paymentMethod?.type) {
                    return next(ErrorHandler('Valid payment method with id, name, and type is required', 400, res, next));
                }

                // Validate order items
                for (let i = 0; i < orderItems.length; i++) {
                    const item = orderItems[i];
                    const itemId = item.id || item._id || item.productId || item.variantId;
                    const itemTitle = item.title || item.name || item.productName;
                    const itemPrice = item.price !== undefined ? item.price : null;
                    const itemQuantity = item.quantity !== undefined ? item.quantity : null;

                    if (!itemId) {
                        return next(ErrorHandler(`Order item ${i}: product/variant id is required`, 400, res, next));
                    }
                    if (!itemTitle) {
                        return next(ErrorHandler(`Order item ${i}: title/name is required`, 400, res, next));
                    }
                    if (itemPrice === null || isNaN(Number(itemPrice))) {
                        return next(ErrorHandler(`Order item ${i}: valid price is required`, 400, res, next));
                    }
                    if (itemQuantity === null || isNaN(Number(itemQuantity)) || Number(itemQuantity) <= 0) {
                        return next(ErrorHandler(`Order item ${i}: valid quantity > 0 is required`, 400, res, next));
                    }
                }

                // Validate payment details
                const paymentError = validatePaymentDetails(paymentMethod, mobilePayment, bankPayment);
                if (paymentError) {
                    return next(ErrorHandler(paymentError, 400, res, next));
                }

                // Calculate totals
                const { subtotal, tax, total } = calculateTotals(
                    orderItems,
                    shippingMethod.fee || 0,
                    taxRate
                );

                // Generate guest user ID based on email and timestamp
                const guestUserId = `guest_${shippingInfo.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

                // Generate unique order ID
                const orderId = await generateOrderId(guestUserId);

                // Map order items
                const mappedOrderItems = orderItems.map((item: any) => {
                    const itemId = item.id || item._id || item.productId || item.variantId;
                    const itemPrice = Number(item.price);
                    const itemQuantity = Number(item.quantity);

                    return {
                        
                        id: itemId,
                        title: item.title || item.name || item.productName,
                        price: itemPrice,
                        quantity: itemQuantity,
                        thumbnail: item.thumbnail || item.image || item.imageUrl || "",
                        total: itemPrice * itemQuantity,
                        selectedSize: item.selectedSize || item.size || undefined
                    };
                });

                // Prepare delivery info
                const deliveryInfoData = {
                    firstName: shippingInfo.firstName,
                    lastName: shippingInfo.lastName,
                    country: shippingInfo.country || "Bangladesh",
                    streetAddress: shippingInfo.streetAddress,
                    apartment: shippingInfo.apartment || "",
                    city: shippingInfo.city,
                    district: shippingInfo.district || "",
                    postcode: shippingInfo.postcode,
                    phone: shippingInfo.phone,
                    email: shippingInfo.email,
                    orderNotes: notes || shippingInfo.orderNotes || ""
                };

                // Prepare billing info
                const billingInfoData = billingInfo ? {
                    sameAsDelivery: billingInfo.sameAsDelivery || false,
                    firstName: billingInfo.sameAsDelivery ? shippingInfo.firstName : billingInfo.firstName,
                    lastName: billingInfo.sameAsDelivery ? shippingInfo.lastName : billingInfo.lastName,
                    streetAddress: billingInfo.sameAsDelivery ? shippingInfo.streetAddress : billingInfo.streetAddress,
                    apartment: billingInfo.sameAsDelivery ? (shippingInfo.apartment || "") : (billingInfo.apartment || ""),
                    city: billingInfo.sameAsDelivery ? shippingInfo.city : billingInfo.city,
                    district: billingInfo.sameAsDelivery ? (shippingInfo.district || "") : (billingInfo.district || ""),
                    postcode: billingInfo.sameAsDelivery ? shippingInfo.postcode : billingInfo.postcode,
                    phone: billingInfo.sameAsDelivery ? shippingInfo.phone : billingInfo.phone,
                    email: billingInfo.sameAsDelivery ? shippingInfo.email : billingInfo.email
                } : null;

                // Prepare shipping method
                const shippingMethodData = {
                    id: shippingMethod.id,
                    name: shippingMethod.name,
                    description: shippingMethod.description || "",
                    fee: Number(shippingMethod.fee),
                    estimatedDelivery: shippingMethod.estimatedDelivery || ""
                };

                // Prepare payment method
                const paymentMethodData = {
                    id: paymentMethod.id,
                    name: paymentMethod.name,
                    type: paymentMethod.type,
                    details: paymentMethod.type === 'mobile' && mobilePayment ? {
                        provider: mobilePayment.provider,
                        accountNumber: mobilePayment.mobileNumber,
                        transactionId: mobilePayment.transactionId
                    } : paymentMethod.type === 'bank' && bankPayment ? {
                        provider: bankPayment.bankName,
                        accountNumber: bankPayment.accountNumber,
                        transactionId: bankPayment.transactionId
                    } : {}
                };
                

                const orderData: any = {
                    user: req.user ? req.user._id : null,
                    orderId,
                    items: mappedOrderItems,
                    deliveryInfo: deliveryInfoData,
                    billingInfo: billingInfoData,
                    shippingMethod: shippingMethodData,
                    paymentMethod: paymentMethodData,
                    subtotal,
                    shippingFee: shippingMethod.fee,
                    tax,
                    total,
                    orderDate: new Date().toISOString(),
                    currency,
                    orderStatus: paymentMethod.type === 'cod' ? 'pending' : 'processing',
                    notes: notes || "",
                    trackingNumber: shippingMethod.trackingNumber || "",
                    estimatedDelivery: shippingMethod.estimatedDelivery || "",
                    // Optional: Store guest info for reference
                    guestInfo: {
                        email: shippingInfo.email,
                        phone: shippingInfo.phone,
                        guestId: guestUserId
                    }
                };

                // Add payment details if applicable
                if (paymentMethod.type === 'mobile' && mobilePayment) {
                    orderData.mobilePayment = {
                        mobileNumber: mobilePayment.mobileNumber,
                        transactionId: mobilePayment.transactionId,
                        provider: mobilePayment.provider,
                        amount: mobilePayment.amount || subtotal,
                        paymentTime: mobilePayment.paymentTime || new Date().toISOString(),
                        verified: false
                    };
                }

                if (paymentMethod.type === 'bank' && bankPayment) {
                    orderData.bankPayment = {
                        bankName: bankPayment.bankName,
                        accountNumber: bankPayment.accountNumber,
                        transactionId: bankPayment.transactionId,
                        accountHolderName: bankPayment.accountHolderName || "",
                        routingNumber: bankPayment.routingNumber || "",
                        branch: bankPayment.branch || "",
                        amount: bankPayment.amount || subtotal,
                        verified: false
                    };
                }

                // Create order directly without user association
                const order = await Order.create(orderData);

                // Return the created order
                return res.status(201).json({
                    success: true,
                    message: 'Order created successfully',
                    order,
                    orderId: order.orderId,
                    orderStatus: order.orderStatus,
                    total: order.total,
                    estimatedDelivery: order.estimatedDelivery
                });

            } catch (error: any) {
                // Handle duplicate order ID with retry
                if (error.code === 11000 && error.keyPattern?.orderId && attempt < maxAttempts - 1) {
                    console.log(`Duplicate order ID detected. Retrying... (Attempt ${attempt + 1}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }

                // Handle validation errors
                if (error.name === 'ValidationError') {
                    const messages = Object.values(error.errors).map((err: any) => err.message);
                    return next(ErrorHandler(`Validation Error: ${messages.join(', ')}`, 400, res, next));
                }

                // Log and pass other errors
                console.error('Order creation error:', error);
                throw error;
            }
        }

        // If all retry attempts exhausted
        return next(ErrorHandler('Failed to create order after multiple attempts. Please try again.', 500, res, next));
    }
);

/* =====================================================================================================*/
/* ================================ Get Order by ID (GET) (/order/:id) ===========================*/
/* ==================================================================================================== */
export const getOrderById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const order = await Order.findOne({ 
      $or: [
        { _id: id },
        { orderId: id }
      ]
    });

    if (!order) {
      return next(ErrorHandler('Order not found', 404, res, next));
    }

    res.status(200).json({
      success: true,
      order
    });
  }
);

/* =====================================================================================================*/
/* ================================ Get User Orders (GET) (/order/user) ==================*/
/* ==================================================================================================== */
export const getUserOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
        const orders = await Order.find({ user: req.user._id }).sort({ orderDate: -1 });
    res.status(200).json({
      success: true,
      orders,
    });
  }
);


/* =====================================================================================================*/
/* ================================== Get Admin Orders (GET) (/order/admin) ============================*/
/* ==================================================================================================== */
export const getAdminOrders = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const orders = await Order.find().sort({ orderDate: -1 });
        res.status(200).json({
            success: true,
            orders,
        });
    }
);



/* =====================================================================================================*/
/* ================================ Update Order Status (PUT) (/order/:id/status) ================*/
/* ==================================================================================================== */
export const updateOrderStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const initialOrder = await Order.findOne({orderId: id });

    const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return next(ErrorHandler('Invalid order status', 400, res, next));
    }

    const order = await Order.findByIdAndUpdate(
      initialOrder?._id,
      {
        orderStatus: status,
        updatedAt: new Date().toISOString(),
        $push: {
          statusHistory: {
            status,
            notes,
            timestamp: new Date().toISOString()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return next(ErrorHandler('Order not found', 404, res, next));
    }

    const orders  = await Order.find().sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      orders
    });
  }
);
