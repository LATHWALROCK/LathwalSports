const express = require("express")
const router = express.Router()

const {
    createTournament,
    getTournament,
    deleteTournament
} = require("../controllers/Tournament")

router.post("/createTournament", createTournament)
router.get("/getTournament",getTournament)
router.delete("/deleteTournament", deleteTournament);

module.exports = router