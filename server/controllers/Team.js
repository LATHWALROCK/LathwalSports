const Team = require("../models/Team");
const League = require("../models/League");
const cloudinary = require("cloudinary").v2;

exports.createTeam = async (req, res) => {
    try {
        const { name, teamIdentifier, isCurrent, city, country, sport, type, tournament } = req.body;
        let imageUrl = req.body.imageUrl || "";
        const file = req.files?.image;

        if (file) {
            const folder = "teams";
            const options = { folder };
            const result = await cloudinary.uploader.upload(file.tempFilePath, options);
            imageUrl = result.secure_url;
        }

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Team logo image is required",
            });
        }

        // Handle empty strings from FormData
        const cleanName = name && name.trim() ? name.trim() : null;
        const cleanSport = sport && sport.trim() ? sport.trim() : null;
        const cleanType = type && type.trim() ? type.trim() : "National";
        const cleanCity = city && city.trim() ? city.trim() : null;
        const cleanCountry = country && country.trim() ? country.trim() : null;
        const cleanTournament = tournament && tournament.trim() ? tournament.trim() : null;

        if (!cleanName || !cleanSport) {
            return res.status(403).json({
                success: false,
                message: "Team name and sport are required",
            });
        }

        // Common identifier: user-provided or slugified from name
        const cleanIdentifier = teamIdentifier && teamIdentifier.trim()
            ? teamIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        const shouldBeCurrent = isCurrent === undefined || isCurrent === "true" || isCurrent === true;

        if (shouldBeCurrent) {
            // Update older versions sharing this common identifier
            await Team.updateMany({ teamIdentifier: cleanIdentifier }, { isCurrent: false });
        }

        const team = await Team.create({
            teamIdentifier: cleanIdentifier,
            name: cleanName,
            imageUrl,
            isCurrent: shouldBeCurrent,
            city: cleanCity || undefined,
            country: cleanCountry || undefined,
            sport: cleanSport,
            type: cleanType,
            tournament: cleanTournament || undefined,
        });

        return res.status(200).json({
            success: true,
            team,
            message: "Team created successfully",
        });
    } catch (error) {
        console.error("CREATE TEAM ERROR:", error);
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
            .sort({ isCurrent: -1, name: 1 })
            .lean();

        // Calculate dynamic active years based on tournament editions
        const leagues = await League.find({}, { year: 1, teams: 1 }).lean();
        const teamYearMap = {};
        leagues.forEach((l) => {
            if (!l.teams || !Array.isArray(l.teams)) return;
            l.teams.forEach((t) => {
                const tmId = String(t.team);
                if (!teamYearMap[tmId]) teamYearMap[tmId] = [];
                if (typeof l.year === "number") teamYearMap[tmId].push(l.year);
            });
        });

        const teamsWithYears = teams.map((tm) => {
            const years = teamYearMap[String(tm._id)] || [];
            const minYear = years.length > 0 ? Math.min(...years) : null;
            const maxYear = years.length > 0 ? Math.max(...years) : null;
            return {
                ...tm,
                from: minYear,
                to: tm.isCurrent ? null : maxYear,
                firstYear: minYear,
                lastYear: maxYear,
                editionsCount: years.length,
                activeYears: [...new Set(years)].sort((a, b) => a - b),
            };
        });

        res.status(200).json({
            success: true,
            data: teamsWithYears,
            message: 'All teams data fetched'
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

exports.getTeamTimeline = async (req, res) => {
    try {
        const { teamIdentifier, _id } = req.query;
        let identifier = teamIdentifier;
        if (!identifier && _id) {
            const tm = await Team.findById(_id);
            if (tm) identifier = tm.teamIdentifier;
        }

        if (!identifier) {
            return res.status(400).json({ success: false, message: "Team identifier is required" });
        }

        const timeline = await Team.find({ teamIdentifier: identifier })
            .populate("sport")
            .populate("tournament")
            .lean();

        // Calculate active years dynamically for each era based on tournament editions
        const timelineWithYears = await Promise.all(
            timeline.map(async (tm) => {
                const editions = await League.find({ "teams.team": tm._id }, { year: 1 }).lean();
                const years = editions.map(l => l.year).filter(y => typeof y === "number");
                const minYear = years.length > 0 ? Math.min(...years) : null;
                const maxYear = years.length > 0 ? Math.max(...years) : null;
                return {
                    ...tm,
                    from: minYear,
                    to: tm.isCurrent ? null : maxYear,
                    firstYear: minYear,
                    lastYear: maxYear,
                    editionsCount: years.length,
                    activeYears: [...new Set(years)].sort((a, b) => a - b),
                };
            })
        );

        // Sort chronologically by first edition year (earliest first, current last if ongoing)
        timelineWithYears.sort((a, b) => {
            if (a.firstYear && b.firstYear) return a.firstYear - b.firstYear;
            if (a.firstYear) return -1;
            if (b.firstYear) return 1;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        return res.status(200).json({
            success: true,
            data: timelineWithYears,
            message: "Team timeline fetched successfully",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getTeamBySportAndTournament = async (req, res) => {
    try {
        const { sport, tournament } = req.query;
        const query = {};
        if (sport) query.sport = sport;
        if (tournament) query.tournament = tournament;

        const teams = await Team.find(query)
            .populate("sport")
            .populate("tournament")
            .sort({ isCurrent: -1, name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: 'Teams fetched successfully'
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
        const teams = await Team.find({ sport })
            .populate("sport")
            .populate("tournament")
            .sort({ isCurrent: -1, name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: 'Teams for sport fetched successfully'
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
        const query = _id ? { _id } : { name };

        const deletedTeam = await Team.findOneAndDelete(query);

        if (!deletedTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Team deleted successfully`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting team",
        });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { _id, name, teamIdentifier, isCurrent, city, country, sport, type, tournament } = req.body;
        const file = req.files?.image;

        if (!_id || !name || !sport) {
            return res.status(400).json({
                success: false,
                message: "Team ID, name, and sport are required for update",
            });
        }

        const cleanName = name.trim();
        const cleanSport = sport.trim();
        const cleanType = type ? type.trim() : "National";

        const updateData = {
            name: cleanName,
            sport: cleanSport,
            type: cleanType,
            city: city ? city.trim() : undefined,
            country: country ? country.trim() : undefined,
            tournament: tournament ? tournament.trim() : undefined,
        };

        if (teamIdentifier) {
            updateData.teamIdentifier = teamIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }
        if (isCurrent !== undefined) {
            updateData.isCurrent = isCurrent === "true" || isCurrent === true;
            if (updateData.isCurrent && updateData.teamIdentifier) {
                await Team.updateMany(
                    { teamIdentifier: updateData.teamIdentifier, _id: { $ne: _id } },
                    { isCurrent: false }
                );
            }
        }

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
};

exports.getTeamById = async (req, res) => {
    try {
        const { _id } = req.query;
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Team ID is required",
            });
        }

        const team = await Team.findById(_id)
            .populate("sport")
            .populate("tournament")
            .lean();

        if (!team) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        // Calculate dynamic active years based on tournament editions
        const leagues = await League.find({ "teams.team": _id }, { year: 1 }).lean();
        const years = leagues.map(l => l.year).filter(y => typeof y === "number");
        const minYear = years.length > 0 ? Math.min(...years) : null;
        const maxYear = years.length > 0 ? Math.max(...years) : null;

        team.from = minYear;
        team.to = team.isCurrent ? null : maxYear;
        team.firstYear = minYear;
        team.lastYear = maxYear;
        team.editionsCount = years.length;
        team.activeYears = [...new Set(years)].sort((a, b) => a - b);

        res.status(200).json({
            success: true,
            data: team,
            message: "Team data fetched successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: "Server error",
        });
    }
};

exports.getTeamsByCityAndSport = async (req, res) => {
    try {
        const { city, sport } = req.query;
        if (!city || !sport) {
            return res.status(400).json({
                success: false,
                message: "City and sport are required",
            });
        }

        const teams = await Team.find({ city, sport, type: "League" })
            .populate("sport")
            .populate("tournament")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: "Teams fetched successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: "Server error",
        });
    }
};

exports.getTeamsByCountryAndSport = async (req, res) => {
    try {
        const { country, sport } = req.query;
        if (!country || !sport) {
            return res.status(400).json({
                success: false,
                message: "Country and sport are required",
            });
        }

        const teams = await Team.find({ country, sport, type: "National" })
            .populate("sport")
            .populate("tournament")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: teams,
            message: "Teams fetched successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: "Server error",
        });
    }
};