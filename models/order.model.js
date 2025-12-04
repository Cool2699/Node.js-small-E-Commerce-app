import mongoose from "mongoose";
import { addCommonVirtuals } from "../helpers/mongoose-plugin.js";

const orderItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
        max: [999, "Quantity cannot exceed 999"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
    },
});

const orderSchema = mongoose.Schema(
    {
        orderItems: [orderItemSchema],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: {
                values: [
                    "pending",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                ],
                message:
                    'Status must be one of: "pending", "processing", "shipped", "delivered", "cancelled"',
            },
            default: "pending",
        },
        totalPrice: {
            type: Number,
            required: [true, "Total price is required"],
        },
    },
    {
        timestamps: true,
    }
);

orderSchema.methods.calculateTotalPrice = function () {
    return this.orderItems.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
};

orderSchema.pre("save", function (next) {
    if (this.isModified("orderItems") || !this.totalPrice) {
        this.totalPrice = this.calculateTotalPrice();
    }

    next();
});

orderSchema.plugin(addCommonVirtuals);

export const OrderModel = mongoose.model("Order", orderSchema);
