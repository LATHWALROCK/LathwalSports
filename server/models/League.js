const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({
    position: {
        type: Number,
        required: false,
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "sport",
            required: true,
        },
        tournament: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "tournament",
            required: true,
        },
        leagueImageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        season: {
            type: String,
            trim: true,
        },
        shared: {
            type: Boolean,
            default: false,
        },
        teams: [teamSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("League", leagueSchema);