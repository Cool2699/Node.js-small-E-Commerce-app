const roleAuth = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.auth) {
                return res.status(401).json({
                    success: false,
                    message: req.t("authenticationRequired"),
                });
            }

            if (!allowedRoles.includes(req.auth.role)) {
                return res.status(403).json({
                    success: false,
                    message: req.t("insufficientPermissions"),
                });
            }

            next();
        } catch (error) {
            console.error("Role authorization error:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };
};

const adminOnly = roleAuth(["admin"]);
const userOnly = roleAuth(["user"]);
const userAndAdmin = roleAuth(["admin", "user"]);

export { adminOnly, userOnly, userAndAdmin };
