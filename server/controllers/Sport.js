const Sport = require("../models/Sport")

exports.createSport = async (req, res) => {
    try {
        const {
            name
        } = req.body

        if (
            !name
        ) {
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            })
        }

        const sport = await Sport.create({
            name
        })

        return res.status(200).json({
            success: true,
            sport,
            message: "Sport created successfully",
        })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Sport cannot be created. Please try again.",
        })
    }
}

exports.getSport = async (req, res) => {
    try {
        const sports = await Sport.find({});
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

exports.deleteSport = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Sport name is required",
            });
        }

        const deletedSport = await Sport.findOneAndDelete({ name });

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