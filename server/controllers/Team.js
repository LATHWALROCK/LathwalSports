const Team = require("../models/Team")
const cloudinary = require("cloudinary").v2;

exports.createTeam = async (req, res) => {
    try {
        const { name, city, country, sport, type, tournament, inactive } = req.body;
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

        // Handle empty strings from FormData
        const cleanName = name && name.trim() ? name.trim() : null;
        const cleanSport = sport && sport.trim() ? sport.trim() : null;
        const cleanType = type && type.trim() ? type.trim() : null;
        const cleanCity = city && city.trim() ? city.trim() : null;
        const cleanCountry = country && country.trim() ? country.trim() : null;
        const cleanTournament = tournament && tournament.trim() ? tournament.trim() : null;


        if (!cleanName || !cleanSport || !cleanType) {
            const missingFields = [];
            if (!cleanName) missingFields.push("name");
            if (!cleanSport) missingFields.push("sport");
            if (!cleanType) missingFields.push("type");

            return res.status(403).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
        }


        // City is required for League teams, Country is required for National teams
        if (cleanType === "League") {
            if (!cleanCity) {
                return res.status(403).json({
                    success: false,
                    message: "City is required for League teams",
                });
            }

            if (!cleanTournament) {
                return res.status(403).json({
                    success: false,
                    message: "Tournament is required for League teams",
                });
            }
        }

        if (cleanType === "National") {
            if (!cleanCountry) {
                return res.status(403).json({
                    success: false,
                    message: "Country is required for National teams",
                });
            }
        }

        const team = await Team.create({
            name: cleanName,
            city: cleanType === "League" ? cleanCity : undefined,
            country: cleanType === "National" ? cleanCountry : undefined,
            imageUrl,
            sport: cleanSport,
            type: cleanType,
            tournament: cleanType === "League" ? cleanTournament : undefined,
            inactive: inactive === "true" || inactive === true
        });
        return res.status(200).json({
            success: true,
            team,
            message: "Team created successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Team cannot be created. Please try again.",
        });
    }
};

exports.getTeam = async (req, res) => {
    try {
        const teams = await Team.find({})
            .populate("sport")
            .populate("tournament")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: 'All teams data fetched in alphabetical order'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'Server error'
        });
    }
};

exports.getTeamBySportAndTournament = async (req, res) => {
    try {
        const { sport, tournament } = req.query;
        const teams = await Team.find({sport, tournament})
            .populate("sport")
            .populate("tournament")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: 'All teams data fetched in alphabetical order'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'Server error'
        });
    }
};

exports.getTeamBySport = async (req, res) => {
    try {
        const { sport } = req.query;
        const teams = await Team.find({ sport, type: "National" })
            .populate("sport")
            .populate("tournament")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: 'National teams for sport fetched successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'Server error'
        });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const { _id, name } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Team name is required",
            });
        }

        const deletedTeam = await Team.findOneAndDelete({ _id });

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

exports.updateTeam = async (req, res) => {
    try {
        const { _id, name, city, country, sport, type, tournament, inactive } = req.body;
        const file = req.files?.image;

        if (!_id || !name || !sport || !type) {
            return res.status(400).json({
                success: false,
                message: "Team ID, name, sport, and type are required for update",
            });
        }

        // Handle empty strings from FormData
        const cleanName = name && name.trim() ? name.trim() : null;
        const cleanSport = sport && sport.trim() ? sport.trim() : null;
        const cleanType = type && type.trim() ? type.trim() : null;
        const cleanCity = city && city.trim() ? city.trim() : null;
        const cleanCountry = country && country.trim() ? country.trim() : null;
        const cleanTournament = tournament && tournament.trim() ? tournament.trim() : null;

        // Validation for required fields
        if (!cleanName || !cleanSport || !cleanType) {
            const missingFields = [];
            if (!cleanName) missingFields.push("name");
            if (!cleanSport) missingFields.push("sport");
            if (!cleanType) missingFields.push("type");

            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
            });
        }

        // City is required for League teams, Country is required for National teams
        if (cleanType === "League") {
            if (!cleanCity) {
                return res.status(400).json({
                    success: false,
                    message: "City is required for League teams",
                });
            }
            if (!cleanTournament) {
                return res.status(400).json({
                    success: false,
                    message: "Tournament is required for League teams",
                });
            }
        }

        if (cleanType === "National") {
            if (!cleanCountry) {
                return res.status(400).json({
                    success: false,
                    message: "Country is required for National teams",
                });
            }
        }

        // Prepare update data
        const updateData = {
            name: cleanName,
            sport: cleanSport,
            type: cleanType,
            inactive: inactive === "true" || inactive === true
        };

        if (cleanType === "League") {
            updateData.city = cleanCity;
            updateData.country = undefined;
            updateData.tournament = cleanTournament;
        } else if (cleanType === "National") {
            updateData.country = cleanCountry;
            updateData.city = undefined;
            updateData.tournament = undefined;
        }

        // Handle image upload if provided
        if (file) {
            const folder = "teams";
            const options = { folder };
            const result = await cloudinary.uploader.upload(file.tempFilePath, options);
            updateData.imageUrl = result.secure_url;
        }

        const updatedTeam = await Team.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });

        if (!updatedTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        return res.status(200).json({
            success: true,
            team: updatedTeam,
            message: "Team updated successfully",
        });
    } catch (error) {
        console.error("UPDATE TEAM ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Team cannot be updated. Please try again.",
        });
    }
}