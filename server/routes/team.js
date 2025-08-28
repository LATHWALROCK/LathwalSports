const express = require("express")
const router = express.Router()

const {
    createTeam,
    getTeam,
    getTeamBySportAndTournament,
    deleteTeam
} = require("../controllers/Team")

router.post("/createTeam", createTeam)
router.get("/getTeam",getTeam)
router.get("/getTeamBySportAndTournament", getTeamBySportAndTournament);
router.delete("/deleteTeam", deleteTeam);

module.exports = router