const League = require("../models/League");
const cloudinary = require("cloudinary").v2;

exports.createLeague = async (req, res) => {
  try {
    let { name, year, season, sport, tournament, shared } = req.body;

    if (!season && year) {
      season = String(year);
    }
    if (!year && season) {
      const m = String(season).match(/(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/);
      if (m) {
        year = m[2] ? (m[2].length === 4 ? Number(m[2]) : Number(m[1].slice(0, 2) + m[2])) : Number(m[1]);
      } else {
        year = parseInt(season, 10);
      }
    }

    if (!name || !year || !sport || !tournament) {
      return res.status(400).json({
        success: false,
        message: "Name, season/year, sport and tournament are required",
      });
    }

    // check league logo
    let leagueImageUrl = req.body.leagueImageUrl || req.body.imageUrl || "";
    const leagueFile = req.files?.image;
    if (leagueFile) {
      const leagueUpload = await cloudinary.uploader.upload(
        leagueFile.tempFilePath,
        { folder: "leagues" }
      );
      leagueImageUrl = leagueUpload.secure_url;
    }

    // If no logo uploaded, fallback to tournament logo
    if (!leagueImageUrl) {
      const TournamentModel = require("../models/Tournament");
      const tourDoc = await TournamentModel.findById(tournament);
      if (tourDoc && tourDoc.imageUrl) {
        leagueImageUrl = tourDoc.imageUrl;
      } else {
        leagueImageUrl = "https://placehold.co/200x200/121826/ffffff?text=Trophy";
      }
    }

    // handle teams from req.body (optional - can be empty)
    const teams = [];
    const teamKeys = Object.keys(req.body).filter((key) =>
      key.startsWith("teams[")
    );

    // Only process teams if team keys exist
    if (teamKeys.length > 0) {
      // extract unique indexes
      const indexes = [
        ...new Set(teamKeys.map((k) => k.match(/teams\[(\d+)\]/)[1])),
      ];

      for (let idx of indexes) {
        const teamId = req.body[`teams[${idx}][team]`];
        const position = req.body[`teams[${idx}][position]`];

        if (!teamId) {
          return res.status(400).json({
            success: false,
            message: `Missing team reference at index ${idx}`,
          });
        }

        const teamObj = { team: teamId };
        if (position !== undefined && position !== null && position !== "") {
          teamObj.position = Number(position);
        }
        teams.push(teamObj);
      }
    }

    // save league
    const league = await League.create({
      name,
      year: Number(year),
      season: season || String(year),
      sport,
      tournament,
      leagueImageUrl,
      teams,
      shared: shared === "true" || shared === true,
    });

    return res.status(201).json({
      success: true,
      message: "League created successfully",
      data: league,
    });
  } catch (error) {
    console.error("CREATE LEAGUE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "League cannot be created. Please try again.",
    });
  }
};

exports.getLeague = async (req, res) => {
  try {
    const { sport, tournament } = req.query;
    const filter = {};
    if (sport) filter.sport = sport;
    if (tournament) filter.tournament = tournament;

    const leagues = await League.find(filter)
      .populate("teams.team")
      .populate("sport")
      .populate("tournament")
      .sort({ year: -1 });

    res.status(200).json({
      success: true,
      data: leagues,
      message: "All leagues data fetched in order of year",
    });
  } catch (err) {
    console.error("GET LEAGUE ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: "Server error",
    });
  }
};

exports.deleteLeague = async (req, res) => {
  try {
    const { name, _id } = req.body;
    if (!_id && !name) {
      return res.status(400).json({
        success: false,
        message: "League ID or name is required",
      });
    }

    const query = _id ? { _id } : { name };
    const deletedLeague = await League.findOneAndDelete(query);

    if (!deletedLeague) {
      return res.status(404).json({
        success: false,
        message: "League not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `League '${name}' deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE LEAGUE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting League",
    });
  }
};

exports.updateLeague = async (req, res) => {
  try {
    let { _id, name, year, season, sport, tournament, shared } = req.body;

    if (!season && year) {
      season = String(year);
    }
    if (!year && season) {
      const m = String(season).match(/(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/);
      if (m) {
        year = m[2] ? (m[2].length === 4 ? Number(m[2]) : Number(m[1].slice(0, 2) + m[2])) : Number(m[1]);
      } else {
        year = parseInt(season, 10);
      }
    }

    if (!_id || !name || !year || !sport || !tournament) {
      return res.status(400).json({
        success: false,
        message: "League ID, name, season/year, sport and tournament are required for update",
      });
    }

    // Handle teams from req.body (optional - can be empty)
    const teams = [];
    const teamKeys = Object.keys(req.body).filter((key) =>
      key.startsWith("teams[")
    );

    // Only process teams if team keys exist
    if (teamKeys.length > 0) {
      // Extract unique indexes
      const indexes = [
        ...new Set(teamKeys.map((k) => k.match(/teams\[(\d+)\]/)[1])),
      ];

      for (let idx of indexes) {
        const teamId = req.body[`teams[${idx}][team]`];
        const position = req.body[`teams[${idx}][position]`];

        if (!teamId) {
          return res.status(400).json({
            success: false,
            message: `Missing team reference at index ${idx}`,
          });
        }

        const teamObj = { team: teamId };
        if (position !== undefined && position !== null && position !== "") {
          teamObj.position = Number(position);
        }
        teams.push(teamObj);
      }
    }

    // Prepare update data
    const updateData = {
      name,
      year: Number(year),
      season: season || String(year),
      sport,
      tournament,
      teams,
      shared: shared === "true" || shared === true,
    };

    // Handle image upload if provided
    const leagueFile = req.files?.image;
    if (leagueFile) {
      const leagueUpload = await cloudinary.uploader.upload(
        leagueFile.tempFilePath,
        { folder: "leagues" }
      );
      updateData.leagueImageUrl = leagueUpload.secure_url;
    }

    const updatedLeague = await League.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedLeague) {
      return res.status(404).json({
        success: false,
        message: "League not found",
      });
    }

    return res.status(200).json({
      success: true,
      league: updatedLeague,
      message: "League updated successfully",
    });
  } catch (error) {
    console.error("UPDATE LEAGUE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "League cannot be updated. Please try again.",
    });
  }
};

exports.getLeagueByTeam = async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: "Team ID is required",
      });
    }

    // Find all leagues where the team participated
    const leagues = await League.find({
      "teams.team": teamId
    })
      .populate("teams.team")
      .populate("sport")
      .populate("tournament")
      .sort({ year: 1 });

    res.status(200).json({
      success: true,
      data: leagues,
      message: "Leagues fetched successfully",
    });
  } catch (err) {
    console.error("GET LEAGUE BY TEAM ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: "Server error",
    });
  }
};