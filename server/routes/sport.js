const express = require("express");
const router = express.Router();

const {
  createSport,
  getSport,
  updateSport,
  deleteSport
} = require("../controllers/Sport");

// Routes
router.post("/createSport", createSport);
router.get("/getSport", getSport);
router.put("/updateSport", updateSport);
router.delete("/deleteSport", deleteSport);

module.exports = router;