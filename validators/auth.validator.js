import { body, validationResult } from "express-validator";

export const registerValidation = [
    body("email")
        .isEmail()
        .withMessage((value, { req }) => req.t("enterValidEmail")),
    body("password")
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t("passwordTooSmall")),

    body("role").optional().isIn(["admin", "user"]),
    body("userName")
        .notEmpty()
        .withMessage((value, { req }) => req.t("userNameRequired")),
    body("city")
        .notEmpty()
        .withMessage((value, { req }) => req.t("cityRequired")),
    body("postalCode")
        .notEmpty()
        .withMessage((value, { req }) => req.t("postalCodeRequired")),
    body("addressLine1")
        .notEmpty()
        .withMessage((value, { req }) => req.t("addressRequired")),
    body("addressLine1").optional(),
    body("phoneNumber")
        .notEmpty()
        .withMessage((value, { req }) => req.t("phoneNumberRequired"))
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage((value, { req }) => req.t("phoneNumberInvalid")),
];

export const loginValidation = [
    body("email")
        .isEmail()
        .withMessage((value, { req }) => req.t("enterValidEmail")),
    body("password")
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t("passwordTooSmall")),
];

export const updateProfileValidation = [
    body("email")
        .optional()
        .isEmail()
        .withMessage((value, { req }) => req.t("enterValidEmail")),
    body("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t("passwordTooSmall")),
    body("phoneNumber")
        .optional()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage((value, { req }) => req.t("phoneNumberInvalid")),

    body("role").optional().isIn(["admin", "user"]),
    body("userName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage((value, { req }) => req.t("userNameRequired")),
    body("city")
        .optional()
        .trim()
        .notEmpty()
        .withMessage((value, { req }) => req.t("cityRequired")),
    body("postalCode")
        .optional()
        .trim()
        .notEmpty()
        .withMessage((value, { req }) => req.t("postalCodeRequired")),
    body("addressLine1")
        .optional()
        .trim()
        .notEmpty()
        .withMessage((value, { req }) => req.t("addressRequired")),
    body("addressLine1").optional(),
];

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
