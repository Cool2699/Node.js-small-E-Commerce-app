export const handleRouteError = (res, error) => {
    console.error("Error occured: ", error);
    res.status(500).json({
        success: false,
        message: error.message,
    });
};
