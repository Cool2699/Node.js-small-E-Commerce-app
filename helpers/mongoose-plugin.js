export const addCommonVirtuals = (schema) => {
    // _id => id
    schema.virtual("id").get(function () {
        return this._id.toHexString();
    });

    schema.set("toJSON", {
        virtuals: true,
    });
};
