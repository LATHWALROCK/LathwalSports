const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
        required: true,
        min: 1,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
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