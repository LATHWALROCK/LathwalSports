const League = require("../models/League")
const cloudinary = require("cloudinary").v2;

exports.createLeague = async (req, res) => {
    try {
        const { name, year, sport, tournament } = req.body;
        
        console.log(sport);
        console.log(tournament);
    
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
    
        // handle teams
        const teams = [];
    
        // req.body.teams will come as fields like teams[0][name], teams[0][city], ...
        const teamKeys = Object.keys(req.body).filter((key) =>
          key.startsWith("teams[")
        );
    
        // extract indexes
        const indexes = [...new Set(teamKeys.map((k) => k.match(/teams\[(\d+)\]/)[1]))];
    
        for (let idx of indexes) {
          const name = req.body[`teams[${idx}][name]`];
          const city = req.body[`teams[${idx}][city]`];
          const position = req.body[`teams[${idx}][position]`];
    
          if (!name || !city || !position) {
            return res.status(400).json({
              success: false,
              message: `Missing fields for team ${idx}`,
            });
          }
    
          let imageUrl = "";
          const teamFile = req.files?.[`teams[${idx}][image]`];
          if (teamFile) {
            const uploadResult = await cloudinary.uploader.upload(
              teamFile.tempFilePath,
              { folder: "teams" }
            );
            imageUrl = uploadResult.secure_url;
          }
    
          teams.push({
            name,
            city,
            position: Number(position),
            image: imageUrl,
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
        const { sport } = req.query;
        const { tournament } = req.query;
        const leagues = await League.find({ sport: sport, tournament: tournament });
        res.status(200).json(
            {
                success: true,
                data: leagues,
                message: 'All leagues data are fetched'
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

exports.deleteLeague = async (req, res) => {
    try {
        const { name, sport, tournament } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "League name is required",
            });
        }

        const deletedLeague = await League.findOneAndDelete({ name,sport,tournament });

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
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting League",
        });
    }
}