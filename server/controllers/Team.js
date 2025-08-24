const Team = require("../models/Team")
const cloudinary = require("cloudinary").v2;

exports.createTeam = async (req, res) => {
    try {
        const { name, city } = req.body;

        // check file
        const file = req.files?.image;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required",
            });
        }
        const folder = "teams";
        const options = { folder };
        const result = await cloudinary.uploader.upload(file.tempFilePath, options);
        const imageUrl = result.secure_url;

        if (!name || !city || !imageUrl) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            });
        }
        const team = await Team.create({
            name,
            city,
            imageUrl
        });

        return res.status(200).json({
            success: true,
            team,
            message: "Team created successfully",
        });
    } catch (error) {
        console.error("CREATE Team ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Team cannot be created. Please try again.",
        });
    }
};

exports.getTeam = async (req, res) => {
    try {
        const teams = await Team.find({});
        res.status(200).json(
            {
                success: true,
                data: teams,
                message: 'All teams data are fetched'
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

exports.deleteTeam = async (req, res) => {
    try {
        const { name, city } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Team name is required",
            });
        }

        const deletedTeam = await Team.findOneAndDelete({ name,city });

        if (!deletedTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Team '${name}' deleted successfully`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting team",
        });
    }
}