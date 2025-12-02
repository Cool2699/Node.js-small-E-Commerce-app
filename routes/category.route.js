import { Router } from "express";
import { Category } from "../models/category.model.js";
import { adminOnly } from "../middleware/roles..middleware.js";

const router = Router();

router.post("/", adminOnly, async (req, res) => {
    try {
        if (!req.body.name || req.body.name.trim().length < 3) {
            return res.status(400).send({
                message: req.t("categoryNameValidation"),
            });
        }
        const newCategory = await Category.create(req.body);
        return res.status(201).send(newCategory);
    } catch (error) {
        return res.status(400).send({ message: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const categoriesList = await Category.find();
        if (!categoriesList || categoriesList.length === 0) {
            return res.status(404).send({ message: req.t("noCategories") });
        }
        res.send(categoriesList);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.delete("/:id", adminOnly, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).send({ message: req.t("categoryNotFound") });
        }
        res.send({ message: req.t("categoryDeletedSuccessfully") });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.put("/:id", adminOnly, async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body);
        if (!category) {
            return res.status(404).send({ message: req.t("categoryNotFound") });
        }
        res.send({ message: req.t("categoryUpdatedSuccessfully") });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

export default router;
