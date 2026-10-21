const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamIdentifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sport",
      required: true,
    },
    type: {
      type: String,
      enum: ["National", "League"],
      required: true,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tournament",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("team", teamSchema);