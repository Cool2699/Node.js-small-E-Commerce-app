import express from "express";
import { Product } from "../models/product.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import { getFileURL, handleUploadError, uploadMultiple } from "../middleware/upload.middleware.js";
import { adminOnly } from "../middleware/roles..middleware.js";

const router = express.Router();

router.post("/", adminOnly, uploadMultiple, handleUploadError, async (req, res) => {
    try {
        let imageURLs = [];
        if (req.files && req.files.length > 0) {
            imageURLs = req.files.map((file) => getFileURL(req, file.filename));
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
});

export default router;
