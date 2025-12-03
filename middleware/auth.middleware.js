import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const publicRoutes = [
    "POST:/api/v1/auth/login", 
    "POST:/api/v1/auth/register",
    "GET:/public/uploads",    
];

export const authMiddleware = (req, res, next) => {
    try {
        const method = req.method;
        const path = req.path;
        const route = `${method}:${path}`;
        if (publicRoutes.includes(route)) {
            return next();
        }

        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: req.t("tokenRequired"),
            });
        }

        const decoded = jwt.verify(token, process.env.SECRET);
        req.auth = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            userName: decoded.userName,
            phoneNumber: decoded.phoneNumber,
        };
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: req.t("invalidToken"),
        });
    }
};
