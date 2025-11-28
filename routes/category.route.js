const express = require("express");
const { Category } = require("../models/category.model");

const router = express.Router();

router.post("/", async (req, res) => {
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
            return res.send({message: req.t("noCategories")})
        }
        res.send(categoriesList);
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
});

module.exports = router;
