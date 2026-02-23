import ApplicationSpecialNeed from "../models/ApplicationSpecialNeed.js";

/**
 * GET Special Needs
 */
export const getSpecialNeedsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const data = await ApplicationSpecialNeed.findOne({ studentId });

        if (!data) {
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * SAVE / UPDATE
 */
export const saveSpecialNeeds = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { hasSpecialNeeds, specialNeedsDescription } = req.body;

        if (!["yes", "no"].includes(hasSpecialNeeds)) {
            return res.status(400).json({
                success: false,
                message: "Invalid value for hasSpecialNeeds"
            });
        }

        const saved = await ApplicationSpecialNeed.findOneAndUpdate(
            { studentId },
            {
                studentId,
                hasSpecialNeeds,
                specialNeedsDescription:
                    hasSpecialNeeds === "yes"
                        ? specialNeedsDescription.trim()
                        : ""
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Saved successfully",
            data: saved
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};