import express from "express";
import User from "../models/user.model.js";
import {
    registerValidation,
    loginValidation,
    handleValidationErrors,
} from "../validators/auth.validator.js";
import { generateToken } from "../helpers/jwt.js";
import { handleRouteError } from "../helpers/error-handling.js";

const router = express.Router();

router.post(
    "/register",
    registerValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const user = new User(req.body);

            const { email } = req.body;
            const existingUserByEmail = await User.findOne({ email });
            if (existingUserByEmail) {
                return res.status(400).json({
                    success: false,
                    message: req.t("emailAlreadyExists"),
                });
            }

            await user.save();

            const token = generateToken(user);

            res.status(201).json({
                success: true,
                message: req.t("userRegisteredSuccessfully"),
                data: user.toJSON(),
                token: token,
            });
        } catch (error) {
            handleRouteError(res, error);
        }
    }
);

router.post(
    "/login",
    loginValidation,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email, password } = req.body;
            const userData = await User.findOne({ email });
            if (!userData) {
                return res.status(400).json({
                    success: false,
                    message: req.t("emailDoesNotExist"),
                });
            }

            const isPasswordCorrect = await userData.comparePassword(password);
            if (!isPasswordCorrect) {
                return res.status(401).json({
                    success: false,
                    message: req.t("incorrectPassword"),
                });
            }

            res.json({
                success: true,
                message: req.t("loginSuccessful"),
                data: {
                    user: userData.toJSON(),
                    token: generateToken(userData),
                },
            });
        } catch (error) {
            handleRouteError(res, error);
        }
    }
);

router.get("/profile", async (req, res) => {
    try {
        const user = await User.findById(req.auth.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: req.t("userNotFound"),
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

router.put("/profile", async (req, res) => {
    try {
        const userId = req.auth.id;
        const requestBody = req.body;

        if (requestBody.email) {
            const existingUserByEmail = await User.findOne({
                email: requestBody.email,
                _id: { $ne: userId },
            });

            if (existingUserByEmail) {
                return res.status(400).json({
                    success: false,
                    message: req.t("emailAlreadyExists"),
                });
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: req.t("userNotFound"),
            });
        }

        Object.keys(requestBody).forEach((key) => {
            user[key] = requestBody[key];
        });

        await user.save();

        res.json({
            success: true,
            message: req.t("profileUpdatedSuccessfully"),
            data: user,
        });
    } catch (error) {
        handleRouteError(res, error);
    }
});

export default router;
