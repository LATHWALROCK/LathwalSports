const Sport = require("../models/Sport")
const cloudinary = require("cloudinary").v2;

exports.createSport = async (req, res) => {
    try {
        const { name } = req.body;
        const file = req.files?.image;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required",
            });
        }

        const folder = "sports";
        const options = { folder };
        const result = await cloudinary.uploader.upload(file.tempFilePath, options);
        const imageUrl = result.secure_url;

        // Handle empty strings from FormData
        const cleanName = name && name.trim() ? name.trim() : null;

        if (!cleanName) {
            return res.status(403).json({
                success: false,
                message: "Sport name is required",
            });
        }

        const sport = await Sport.create({
            name: cleanName,
            imageUrl
        });

        return res.status(200).json({
            success: true,
            sport,
            message: "Sport created successfully",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Sport cannot be created. Please try again.",
        });
    }
}

exports.getSport = async (req, res) => {
    try {
        const sports = await Sport.find({})
            .sort({ name: 1 });;
        res.status(200).json(
            {
                success: true,
                data: sports,
                message: 'All sports data are fetched'
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

exports.updateSport = async (req, res) => {
    try {
        const { _id, name } = req.body;
        const file = req.files?.image;

        if (!_id || !name) {
            return res.status(400).json({
                success: false,
                message: "Sport ID and name are required",
            });
        }

        // Handle empty strings from FormData
        const cleanName = name && name.trim() ? name.trim() : null;

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Sport name is required",
            });
        }

        // Prepare update data
        const updateData = {
            name: cleanName
        };

        // Handle image upload if provided
        if (file) {
            const folder = "sports";
            const options = { folder };
            const result = await cloudinary.uploader.upload(file.tempFilePath, options);
            updateData.imageUrl = result.secure_url;
        }

        const updatedSport = await Sport.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });

        if (!updatedSport) {
            return res.status(404).json({
                success: false,
                message: "Sport not found",
            });
        }

        return res.status(200).json({
            success: true,
            sport: updatedSport,
            message: "Sport updated successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating sport",
        });
    }
}

exports.deleteSport = async (req, res) => {
    try {
        const { name, _id } = req.body;
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Sport is required",
            });
        }

        const deletedSport = await Sport.findOneAndDelete({ _id });

        if (!deletedSport) {
            return res.status(404).json({
                success: false,
                message: "Sport not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Sport '${name}' deleted successfully`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting sport",
        });
    }
}