import express from "express";
import { Product } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import {
    getFileURL,
    handleUploadError,
    uploadMultiple,
} from "../middleware/upload.middleware.js";
import { adminOnly } from "../middleware/roles..middleware.js";
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

router.get("/", async (req, res) => {
    try {
        const search = req.query.search;
        const categoryID = req.query.categoryID;
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

        const productsList = await Product.find(filter);
        if (!productsList || productsList.length == 0) {
            return res.status(201).send({ message: req.t("noProducts") });
        }
        res.send(productsList);
    } catch (error) {
        handleRouteError(res, error);
    }
});

export default router;
