
const expressOrderRoute = require("express");
const orderRouter = expressOrderRoute.Router();

import { createOrder, getOrderById, getUserOrders, getAdminOrders, updateOrderStatus } from "../controllers/orderController";
const  { isAuthenticatedUser } = require("../middleware/auth");


orderRouter.route("/order/create").post(isAuthenticatedUser, createOrder);
orderRouter.route("/order/:id").get(getOrderById);
// orderRouter.route("/orders/me").get(isAuthenticatedUser, getUserOrders);
orderRouter.route("/orders/me").get(isAuthenticatedUser, getUserOrders);
orderRouter.route("/admin/orders").get( getAdminOrders);
orderRouter.route("/order/:id/status").put(updateOrderStatus);  

module.exports = orderRouter;
