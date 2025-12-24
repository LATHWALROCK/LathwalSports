const Tournament = require("../models/Tournament")
const cloudinary = require("cloudinary").v2;

exports.createTournament = async (req, res) => {
    try {
        const { name, sport, type } = req.body;
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

        if (!name || !sport || !type || !imageUrl) {
            return res.status(403).json({
                success: false,
                message: "All fields are required",
            });
        }
        const tournament = await Tournament.create({
            name,
            sport,
            type,
            imageUrl
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
        const tournaments = await Tournament.find({}).populate("sport")
        .sort({sport:1})
        .sort({name:1});
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

exports.getTournamentByTournamentId = async (req, res) => {
    try {
        const { _id } = req.query;
        const tournaments = await Tournament.find({ _id }).populate("sport");
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

exports.getTournamentBySport = async (req, res) => {
    try {
        const { sport } = req.query;
        const tournaments = await Tournament.find({ sport }).populate("sport");
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

exports.updateTournament = async (req, res) => {
    try {
        const { _id, name, sport, type } = req.body;
        const file = req.files?.image;

        if (!_id || !name || !sport || !type) {
            return res.status(400).json({
                success: false,
                message: "Tournament ID, name, sport, and type are required",
            });
        }

        // Handle empty strings from FormData
        const cleanName = name && name.trim() ? name.trim() : null;

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Tournament name is required",
            });
        }

        // Prepare update data
        const updateData = {
            name: cleanName,
            sport,
            type
        };

        // Handle image upload if provided
        if (file) {
            const folder = "tournaments";
            const options = { folder };
            const result = await cloudinary.uploader.upload(file.tempFilePath, options);
            updateData.imageUrl = result.secure_url;
        }

        const updatedTournament = await Tournament.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true }).populate("sport");

        if (!updatedTournament) {
            return res.status(404).json({
                success: false,
                message: "Tournament not found",
            });
        }

        return res.status(200).json({
            success: true,
            tournament: updatedTournament,
            message: "Tournament updated successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating tournament",
        });
    }
}

exports.deleteTournament = async (req, res) => {
    try {
        const { name, _id } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Tournament name is required",
            });
        }

        const deletedTournament = await Tournament.findOneAndDelete({ _id });

        if (!deletedTournament) {
            return res.status(404).json({
                success: false,
                message: "Tournament not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Tournament '${name}' deleted successfully`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting sport",
        });
    }
}
