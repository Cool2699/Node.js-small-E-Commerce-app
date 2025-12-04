import { body, validationResult } from "express-validator";

export const createProductValidation = [
    body("title")
        .notEmpty()
        .withMessage(
            (value, { req }) =>
                req.t("productTitleRequired") || "Product title is required"
        )
        .isLength({ min: 2, max: 100 })
        .withMessage(
            (value, { req }) =>
                req.t("productTitleLength") ||
                "Product title must be between 2 and 100 characters"
        )
        .trim(),

    body("category")
        .notEmpty()
        .withMessage(
            (value, { req }) =>
                req.t("categoryRequired") || "Category is required"
        )
        .isMongoId()
        .withMessage(
            (value, { req }) =>
                req.t("invalidCategoryId") || "Invalid category ID"
        ),

    body("price")
        .notEmpty()
        .withMessage(
            (value, { req }) => req.t("priceRequired") || "Price is required"
        )
        .isFloat({ min: 0 })
        .withMessage(
            (value, { req }) =>
                req.t("pricePositive") || "Price must be a positive number"
        ),

    body("description")
        .notEmpty()
        .withMessage(
            (value, { req }) =>
                req.t("descriptionRequired") || "Description is required"
        )
        .isLength({ min: 5, max: 1000 })
        .withMessage(
            (value, { req }) =>
                req.t("descriptionLength") ||
                "Description must be between 5 and 1000 characters"
        )
        .trim(),

    body("countInStock")
        .notEmpty()
        .withMessage(
            (value, { req }) =>
                req.t("stockCountRequired") || "Stock count is required"
        )
        .isInt({ min: 0, max: 99999 })
        .withMessage(
            (value, { req }) =>
                req.t("stockCountRange") ||
                "Stock count must be between 0 and 99999"
        ),

    body("rating.count")
        .optional()
        .isInt({ min: 0 })
        .withMessage(
            (value, { req }) =>
                req.t("ratingCountPositive") ||
                "Rating count must be a positive integer"
        ),
];

export const updateProductValidation = [
    body("title")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage(
            (value, { req }) =>
                req.t("productTitleLength") ||
                "Product title must be between 2 and 100 characters"
        )
        .trim(),

    body("category")
        .optional()
        .isMongoId()
        .withMessage(
            (value, { req }) =>
                req.t("invalidCategoryId") || "Invalid category ID"
        ),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage(
            (value, { req }) =>
                req.t("pricePositive") || "Price must be a positive number"
        ),

    body("description")
        .optional()
        .isLength({ min: 5, max: 1000 })
        .withMessage(
            (value, { req }) =>
                req.t("descriptionLength") ||
                "Description must be between 5 and 1000 characters"
        )
        .trim(),

    body("countInStock")
        .optional()
        .isInt({ min: 0, max: 99999 })
        .withMessage(
            (value, { req }) =>
                req.t("stockCountRange") ||
                "Stock count must be between 0 and 99999"
        ),
];

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    next();
};
