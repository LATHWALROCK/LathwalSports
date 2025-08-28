const express = require("express")
const router = express.Router()

const {
    createTournament,
    getTournament,
    deleteTournament,
    getTournamentBySport,
    getTournamentByTournamentId
} = require("../controllers/Tournament")

router.post("/createTournament", createTournament)
router.get("/getTournament",getTournament)
router.get("/getTournamentBySport",getTournamentBySport)
router.get("/getTournamentByTournamentId",getTournamentByTournamentId)
router.delete("/deleteTournament", deleteTournament)

module.exports = router