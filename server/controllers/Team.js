const Team = require("../models/Team");
const League = require("../models/League");
const cloudinary = require("cloudinary").v2;

exports.createTeam = async (req, res) => {
    try {
        const {
            name,
            teamIdentifier,
            isCurrent,
            city,
            country,
            sport,
            type,
            tournament,
            tournaments,
            groupIdentifier,
            groupName,
        } = req.body;
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

        // Clean tournaments array
        let cleanTournaments = [];
        if (tournaments) {
            if (Array.isArray(tournaments)) {
                cleanTournaments = tournaments.filter(Boolean);
            } else if (typeof tournaments === "string") {
                try {
                    const parsed = JSON.parse(tournaments);
                    if (Array.isArray(parsed)) cleanTournaments = parsed.filter(Boolean);
                    else if (tournaments.trim()) cleanTournaments = [tournaments.trim()];
                } catch (e) {
                    cleanTournaments = tournaments.split(",").map((s) => s.trim()).filter(Boolean);
                }
            }
        }
        if (cleanTournament && !cleanTournaments.includes(cleanTournament)) {
            cleanTournaments.push(cleanTournament);
        }

        // Clean Group / Ownership details (only for non-National teams)
        let cleanGroupIdentifier = undefined;
        let cleanGroupName = undefined;
        if (cleanType !== "National") {
            cleanGroupIdentifier = groupIdentifier && groupIdentifier.trim()
                ? groupIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                : groupName && groupName.trim()
                ? groupName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                : undefined;
            cleanGroupName = groupName && groupName.trim() ? groupName.trim() : undefined;
        }

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
            // Update older versions sharing this common identifier in the SAME sport
            await Team.updateMany({ teamIdentifier: cleanIdentifier, sport: cleanSport }, { isCurrent: false });
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
            tournament: cleanTournament || (cleanTournaments.length > 0 ? cleanTournaments[0] : undefined),
            tournaments: cleanTournaments,
            groupIdentifier: cleanGroupIdentifier,
            groupName: cleanGroupName,
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
            .populate("tournaments")
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
        const { teamIdentifier, _id, sport } = req.query;
        let identifier = teamIdentifier;
        let targetSport = sport;

        if (_id) {
            const tm = await Team.findById(_id);
            if (tm) {
                if (!identifier) identifier = tm.teamIdentifier;
                if (!targetSport) targetSport = tm.sport;
            }
        }

        if (!identifier) {
            return res.status(400).json({ success: false, message: "Team identifier is required" });
        }

        const query = { teamIdentifier: identifier };
        if (targetSport) {
            query.sport = targetSport;
        }

        const timeline = await Team.find(query)
            .populate("sport")
            .populate("tournament")
            .populate("tournaments")
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
        if (tournament) {
            query.$or = [{ tournament: tournament }, { tournaments: tournament }];
        }

        const teams = await Team.find(query)
            .populate("sport")
            .populate("tournament")
            .populate("tournaments")
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
            .populate("tournaments")
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
        const {
            _id,
            name,
            teamIdentifier,
            isCurrent,
            city,
            country,
            sport,
            type,
            tournament,
            tournaments,
            groupIdentifier,
            groupName,
        } = req.body;
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

        const updateSet = {
            name: cleanName,
            sport: cleanSport,
            type: cleanType,
        };
        const updateUnset = {};

        // City & Country
        if (city && city.trim()) {
            updateSet.city = city.trim();
        } else if (city !== undefined) {
            updateUnset.city = 1;
        }

        if (country && country.trim()) {
            updateSet.country = country.trim();
        } else if (country !== undefined) {
            updateUnset.country = 1;
        }

        // Handle tournaments array
        if (tournaments !== undefined) {
            let cleanTournaments = [];
            if (Array.isArray(tournaments)) {
                cleanTournaments = tournaments.filter(Boolean);
            } else if (typeof tournaments === "string") {
                try {
                    const parsed = JSON.parse(tournaments);
                    if (Array.isArray(parsed)) cleanTournaments = parsed.filter(Boolean);
                    else if (tournaments.trim()) cleanTournaments = [tournaments.trim()];
                } catch (e) {
                    cleanTournaments = tournaments.split(",").map((s) => s.trim()).filter(Boolean);
                }
            }
            if (tournament && tournament.trim() && !cleanTournaments.includes(tournament.trim())) {
                cleanTournaments.push(tournament.trim());
            }
            updateSet.tournaments = cleanTournaments;
            if (cleanTournaments.length > 0) {
                updateSet.tournament = cleanTournaments[0];
            } else {
                updateUnset.tournament = 1;
            }
        } else if (tournament !== undefined) {
            if (tournament && tournament.trim()) {
                updateSet.tournament = tournament.trim();
            } else {
                updateUnset.tournament = 1;
            }
        }

        // Handle Group / Ownership details
        if (cleanType === "National") {
            updateUnset.groupIdentifier = 1;
            updateUnset.groupName = 1;
        } else if (groupIdentifier !== undefined || groupName !== undefined) {
            const gId = groupIdentifier && groupIdentifier.trim()
                ? groupIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                : groupName && groupName.trim()
                ? groupName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                : "";

            if (gId) {
                updateSet.groupIdentifier = gId;
                updateSet.groupName = groupName && groupName.trim() ? groupName.trim() : gId;
            } else {
                updateUnset.groupIdentifier = 1;
                updateUnset.groupName = 1;
            }
        }

        if (teamIdentifier) {
            updateSet.teamIdentifier = teamIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }
        if (isCurrent !== undefined) {
            updateSet.isCurrent = isCurrent === "true" || isCurrent === true;
            if (updateSet.isCurrent) {
                const targetIdentifier = updateSet.teamIdentifier;
                if (targetIdentifier) {
                    await Team.updateMany(
                        { teamIdentifier: targetIdentifier, sport: cleanSport, _id: { $ne: _id } },
                        { isCurrent: false }
                    );
                } else {
                    const existingTeam = await Team.findById(_id);
                    if (existingTeam && existingTeam.teamIdentifier) {
                        await Team.updateMany(
                            { teamIdentifier: existingTeam.teamIdentifier, sport: cleanSport, _id: { $ne: _id } },
                            { isCurrent: false }
                        );
                    }
                }
            }
        }

        if (file) {
            const folder = "teams";
            const options = { folder };
            const result = await cloudinary.uploader.upload(file.tempFilePath, options);
            updateSet.imageUrl = result.secure_url;
        }

        const updateQuery = { $set: updateSet };
        if (Object.keys(updateUnset).length > 0) {
            updateQuery.$unset = updateUnset;
        }

        const updatedTeam = await Team.findByIdAndUpdate(_id, updateQuery, { new: true, runValidators: true })
            .populate("sport")
            .populate("tournament")
            .populate("tournaments");

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
            .populate("tournaments")
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
            .populate("tournaments")
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
            .populate("tournaments")
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