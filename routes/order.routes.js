import express from "express";
import { OrderModel } from "../models/order.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import { userAndAdmin } from "../middleware/roles..middleware.js";
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";

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

export default router;
