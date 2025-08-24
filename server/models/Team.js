const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
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
  },
  { timestamps: true }
)

module.exports = mongoose.model("team", teamSchema)