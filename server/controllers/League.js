const League = require("../models/League");
const cloudinary = require("cloudinary").v2;

exports.createLeague = async (req, res) => {
  try {
    const { name, year, sport, tournament } = req.body;

    if (!name || !year || !sport || !tournament) {
      return res.status(400).json({
        success: false,
        message: "Name, year, sport and tournament are required",
      });
    }

    // check league logo
    const leagueFile = req.files?.image;
    if (!leagueFile) {
      return res.status(400).json({
        success: false,
        message: "League logo is required",
      });
    }

    const leagueUpload = await cloudinary.uploader.upload(
      leagueFile.tempFilePath,
      { folder: "leagues" }
    );
    const leagueImageUrl = leagueUpload.secure_url;

    // handle teams from req.body
    const teams = [];
    const teamKeys = Object.keys(req.body).filter((key) =>
      key.startsWith("teams[")
    );

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

      teams.push({
        team: teamId,
        position: position ? Number(position) : idx + 1,
      });
    }

    // save league
    const league = await League.create({
      name,
      year,
      sport,
      tournament,
      leagueImageUrl,
      teams,
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

    const leagues = await League.find({ sport, tournament })
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
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "League name is required",
      });
    }

    const deletedLeague = await League.findOneAndDelete({ name, _id });

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
