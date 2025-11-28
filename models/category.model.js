import { Schema, model } from "mongoose";
import { addCommonVirtuals } from "../helpers/mongoose-plugin.js";

const categorySchema = Schema({
    name: String,
});

categorySchema.plugin(addCommonVirtuals);

export const Category = model("Category", categorySchema);
