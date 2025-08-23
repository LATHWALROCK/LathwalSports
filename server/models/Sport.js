const mongoose = require("mongoose")

const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("sport", sportSchema)