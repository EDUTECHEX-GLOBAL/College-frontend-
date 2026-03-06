import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true,
            ref: 'Student'
        },
        hasSpecialNeeds: {
            type: String,
            enum: ["yes", "no"],
            required: true
        },
        specialNeedsDescription: {
            type: String,
            default: ""
        },
        // Additional fields for enhanced functionality
        specialNeeds: [{
            type: String,
            enum: ["physical", "visual", "hearing", "learning", "medical", "mental", "temporary", "other"]
        }],
        requiredArrangements: [{
            type: String,
            enum: ["extraTime", "separateRoom", "reader", "scribe", "largePrint", "braille", "computer", "breaks"]
        }],
        otherNeedsDescription: {
            type: String,
            default: ""
        },
        // Metadata
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: {
            type: Date
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    { timestamps: true }
);

// Index for faster queries
schema.index({ studentId: 1 });
schema.index({ status: 1 });

export default mongoose.model("ApplicationSpecialNeed", schema);