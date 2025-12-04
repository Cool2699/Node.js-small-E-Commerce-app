import express from "express";
import { OrderModel } from "../models/order.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import {
    adminOnly,
    userAndAdmin,
    userOnly,
} from "../middleware/roles..middleware.js";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { orderStatuses } from "../constants/order.constants.js";

const router = express.Router();

router.post("/", userAndAdmin, async (req, res) => {
    try {
        const { orderItems } = req.body;
        const { auth: currentUser } = req;

        const validation = validateOrderItems(orderItems, req.t);
        if (validation.error) {
            return res.status(400).json({
                message: validation.message,
                ...(validation.invalidId && {
                    invalidId: validation.invalidId,
                }),
            });
        }

        const productIds = orderItems.map((item) => item.product);
        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
            return res.status(404).json({
                message: req.t("productsNotFound"),
            });
        }

        const orderItemsWithPrices = [];
        for (const item of orderItems) {
            const product = products.find(
                (p) => p._id.toString() === item.product
            );
            if (product.countInStock < item.quantity) {
                return res.status(400).json({
                    message: req.t("insufficientStock"),
                    productName: product.title,
                    availableStock: product.countInStock,
                    requestedQuantity: item.quantity,
                });
            }

            orderItemsWithPrices.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price,
            });
        }

        const totalPrice = orderItemsWithPrices.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        const newOrder = new OrderModel({
            orderItems: orderItemsWithPrices,
            user: currentUser.id,
            totalPrice,
        });

        const savedOrder = await newOrder.save();

        for (const item of orderItemsWithPrices) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { countInStock: -item.quantity },
            });
        }

        const populatedOrder = await OrderModel.findById(savedOrder._id)
            .populate(
                "user",
                "userName email phone city postalCode addressLine1 addressLine2"
            )
            .populate(
                "orderItems.product",
                "title price images countInStock rating views"
            );

        res.status(201).json({
            success: true,
            message: req.t("orderCreatedSuccessfully"),
            data: populatedOrder,
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

function validateOrderItems(orderItems, t) {
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length == 0) {
        return {
            error: true,
            message: t("orderItemsRequired"),
        };
    }

    for (const item of orderItems) {
        if (!item.product || !item.quantity) {
            return {
                error: true,
                message: t("orderItemsValidation"),
            };
        }

        if (!mongoose.Types.ObjectId.isValid(item.product)) {
            return {
                error: true,
                message: t("invalidProductId"),
                invalidId: item.product,
            };
        }

        if (typeof item.quantity !== "number" || item.quantity < 1) {
            return {
                error: true,
                message: t("quantityMustBeAtLeast1"),
            };
        }

        if (!Number.isInteger(item.quantity)) {
            return {
                error: true,
                message: t("quantityMustBeInteger"),
            };
        }
    }

    return { error: false };
}

router.get("/", async (req, res) => {
    try {
        const { auth: currentUser } = req;
        const isAdmin = currentUser.role === "admin";

        //Pagination params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        //Search param
        const search = req.query.search || "";

        const filter = {};
        if (!isAdmin) {
            filter.user = currentUser.id;
        }

        if (search) {
            filter.$or = [{ status: { $regex: search, $options: "i" } }];
        }

        const skip = (page - 1) * limit;

        const totalOrders = await OrderModel.countDocuments(filter);
        const orderList = await OrderModel.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalOrders / limit);

        res.json({
            data: orderList,
            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                limit,
            },
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

router.get("/:id", userAndAdmin, async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id)
            .populate(
                "user",
                "userName email phone city postalCode addressLine1 addressLine2"
            )
            .populate(
                "orderItems.product",
                "title price images countInStock rating views"
            );

        if (!order) {
            return res.status(404).json({
                message: req.t("orderNotFound"),
            });
        }

        const { auth: currentUser } = req;
        if (
            currentUser.role !== "admin" &&
            currentUser.id !== order.user._id.toString()
        ) {
            return res.status(403).json({
                message: req.t("accessDeniedOwnOrdersOnly"),
            });
        }

        return res.json(order);
    } catch (error) {
        handleRouteError(res, error);
    }
});

router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const order = await OrderModel.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(403).json({
                message: req.t("orderNotFound"),
            });
        }

        return res.json({
            message: req.t("orderDeletedSuccessfully"),
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

router.patch("/:id/change-status", adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                message: req.t("statusRequired"),
            });
        }

        if (!orderStatuses.includes(status)) {
            return res.status(400).json({
                message: req.t("invalidStatus"),
            });
        }

        const updatedOrder = await OrderModel.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(403).json({
                message: req.t("orderNotFound"),
            });
        }

        res.json({
            message: req.t("orderStatusUpdatedSuccessfully"),
            data: updatedOrder,
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

router.patch("/:id/cancel-order", userOnly, async (req, res) => {
    const { auth: currentUser } = req;
    const orderId = req.params.id;

    const order = await OrderModel.findById(orderId);
    if (!order) {
        return res.status(403).json({
            message: req.t("orderNotFound"),
        });
    }

    if (order.user.toString() !== currentUser.id) {
        return res.status(403).json({
            message: req.t("accessDeniedOwnOrdersOnly"),
        });
    }

    const status = order.status;
    if (status === "cancelled") {
        return res.status(400).json({
            message: req.t("orderAlreadyCancelled"),
        });
    }

    if (status === "shipped" || status === "delivered") {
        return res.status(400).json({
            message: req.t("cannotCancelOrder"),
        });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
        req.params.id,
        { status: "cancelled" },
        { new: true }
    );

    for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: item.quantity },
        });
    }

    return res.json({
        message: req.t("orderCancelledSuccessfully"),
        data: updatedOrder
    })
});

export default router;
