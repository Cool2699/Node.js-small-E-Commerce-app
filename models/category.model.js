import { Schema, model } from "mongoose";

const categorySchema = Schema({
    name: String,
});

categorySchema.virtual("id").get(function () {
    return this._id.toHexString();
});

categorySchema.set("toJSON", {
    virtuals: true,
});

export const Category = model("Category", categorySchema);
