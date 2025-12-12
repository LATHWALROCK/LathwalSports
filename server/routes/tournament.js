const express = require("express")
const router = express.Router()

const {
    createTournament,
    getTournament,
    deleteTournament,
    getTournamentBySport,
    getTournamentByTournamentId,
    updateTournament
} = require("../controllers/Tournament")

router.post("/createTournament", createTournament)
router.get("/getTournament",getTournament)
router.get("/getTournamentBySport",getTournamentBySport)
router.get("/getTournamentByTournamentId",getTournamentByTournamentId)
router.put("/updateTournament", updateTournament)
router.delete("/deleteTournament", deleteTournament)

module.exports = router