import express from "express";
import { Product } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import {
    getFileURL,
    handleUploadError,
    uploadMultiple,
} from "../middleware/upload.middleware.js";
import { adminOnly, userAndAdmin } from "../middleware/roles..middleware.js";
import {
    createProductValidation,
    handleValidationErrors,
} from "../validators/product-validator.js";

const router = express.Router();

router.post(
    "/",
    adminOnly,
    createProductValidation,
    handleValidationErrors,
    uploadMultiple,
    handleUploadError,
    async (req, res) => {
        try {
            let imageURLs = [];
            if (req.files && req.files.length > 0) {
                imageURLs = req.files.map((file) =>
                    getFileURL(req, file.filename)
                );
            }

            let newProduct = new Product({
                title: req.body.title,
                price: parseFloat(req.body.price),
                category: req.body.category,
                countInStock: parseInt(req.body.countInStock),
                description: req.body.description,
                images: imageURLs,
            });
            newProduct = await newProduct.save();
            return res.status(201).json({
                success: true,
                message: req.t("productCreatedSuccessfully"),
                date: newProduct,
            });
        } catch (error) {
            handleRouteError(res, error);
        }
    }
);

router.get("/", userAndAdmin, async (req, res) => {
    try {
        const search = req.query.search;
        const categoryID = req.query.categoryID;

        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (categoryID) {
            filter.category = categoryID;
        }

        const totalCount = await Product.countDocuments(filter);
        const sharedDataResponse = {
            page,
            limit,
            totalProducts: totalCount,
            totalPages: Math.ceil(totalCount / limit),
        };

        const productsList = await Product.find(filter).skip(skip).limit(limit);
        if (!productsList || productsList.length == 0) {
            return res
                .status(201)
                .send({
                    message: req.t("noProducts"),
                    data: [],
                    ...sharedDataResponse,
                });
        }

        res.send({
            data: productsList,
            ...sharedDataResponse,
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

export default router;
