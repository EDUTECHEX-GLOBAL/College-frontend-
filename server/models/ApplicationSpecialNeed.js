import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true
        },
        hasSpecialNeeds: {
            type: String,
            enum: ["yes", "no"],
            required: true
        },
        specialNeedsDescription: {
            type: String
        }
    },
    { timestamps: true }
);

export default mongoose.model("ApplicationSpecialNeed", schema);