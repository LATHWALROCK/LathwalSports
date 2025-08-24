const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({
    position: {
        type: Number,
        required: true,
        min: 1,
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "team",
        required: true,
      },
});

const leagueSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        year: {
            type: Number,
            required: true,
        },
        sport: {
            type: String,
            required: true,
            trim: true,
        },
        tournament: {
            type: String,
            required: true,
            trim: true,
        },
        leagueImageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        teams: [teamSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("League", leagueSchema);