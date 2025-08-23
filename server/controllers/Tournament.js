const Tournament = require("../models/Tournament")
const cloudinary = require("cloudinary").v2;

exports.createTournament = async (req, res) => {
    try {
        const { name, sport, type } = req.body;

        // check file
        const file = req.files?.image;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required",
            });
        }
        const folder = "tournaments";
        const options = { folder };
        const result = await cloudinary.uploader.upload(file.tempFilePath, options);
        const imageUrl = result.secure_url;

        if (!name || !sport || !imageUrl || !type) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            });
        }
        const tournament = await Tournament.create({
            name,
            sport,
            imageUrl,
            type
        });

        return res.status(200).json({
            success: true,
            tournament,
            message: "Tournament created successfully",
        });
    } catch (error) {
        console.error("CREATE TOURNAMENT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Tournament cannot be created. Please try again.",
        });
    }
};

exports.getTournament = async (req, res) => {
    try {
        const { sport } = req.query;
        const tournaments = await Tournament.find({ sport: sport });
        res.status(200).json(
            {
                success: true,
                data: tournaments,
                message: 'All tournaments data are fetched'
            }
        )
    }
    catch (err) {
        console.error(err);
        console.log(err);
        res.status(500).json(
            {
                success: false,
                error: err.message,
                message: 'Server error'
            }
        )
    }
}