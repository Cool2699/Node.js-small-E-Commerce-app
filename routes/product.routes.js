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
    updateProductValidation,
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

router.put(
    "/:id",
    adminOnly,
    updateProductValidation,
    handleValidationErrors,
    uploadMultiple,
    handleUploadError,
    async (req, res) => {
        try {
            const existingProduct = await Product.findById(req.params.id);
            if (!existingProduct) {
                return res.status(404).send({
                    message: req.t("productNotFound"),
                });
            }

            const updateData = {};
            const requestBody = req.body;
            Object.keys(requestBody).forEach((key) => {
                updateData[key] = requestBody[key];
            });

            if (req.files && req.files.length > 0) {
                const imageURLs = req.files.map((file) => {
                    getFileURL(req, file.filename);
                });

                if (req.body.replaceImages) {
                    updateData.images = imageURLs;
                } else {
                    updateData.images = [
                        ...existingProduct.images,
                        ...imageURLs,
                    ];
                    S;
                }
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            ).populate("category");

            return res.status(200).json({
                success: true,
                message: req.t("productUpdatedSuccessfully"),
                data: updatedProduct,
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

        const productsList = await Product.find(filter)
            .skip(skip)
            .limit(limit)
            .populate("category");
        if (!productsList || productsList.length == 0) {
            return res.status(401).send({
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

router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                $inc: { views: 1 },
            },
            { new: true }
        ).populate("category");

        if (!product) {
            return res.status(401).send({
                message: req.t("productNotFound"),
            });
        }

        return res.send(product);
    } catch (error) {
        handleRouteError(res, error);
    }
});

router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send({
                message: req.t("productNotFound"),
            });
        }

        return res.send({ message: req.t("productDeletedSuccessfully") });
    } catch (error) {
        handleRouteError(res, error);
    }
});

export default router;
