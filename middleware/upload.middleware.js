import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "public/uploads";

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `product-${uniqueSuffix}${extension}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error(req.t("imageFilesAllowedOnly")));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

const getFileURL = (req, filename) => {
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}/public/uploads/${filename}`;
};

const uploadSingle = upload.single("image");
const uploadMultiple = upload.array("images", 10);

const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                return res.status(400).json({
                    success: false,
                    message: req.t("fileSizeLimit"),
                });
            case "LIMIT_FILE_COUNT":
                return res.status(400).json({
                    success: false,
                    message: req.t("fileCountLimit"),
                });
            case "LIMIT_UNEXPECTED_FILE":
                return res.status(400).json({
                    success: false,
                    message: req.t("unexpectedFile"),
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: req.t("uploadError"),
                });
        }
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
    next();
};

export { uploadSingle, uploadMultiple, getFileURL, handleUploadError };
