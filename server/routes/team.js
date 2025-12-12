const express = require("express")
const router = express.Router()

const {
    createTeam,
    getTeam,
    getTeamBySport,
    getTeamBySportAndTournament,
    updateTeam,
    deleteTeam
} = require("../controllers/Team")

router.post("/createTeam", createTeam)
router.get("/getTeam",getTeam)
router.get("/getTeamBySport", getTeamBySport);
router.get("/getTeamBySportAndTournament", getTeamBySportAndTournament);
router.put("/updateTeam", updateTeam);
router.delete("/deleteTeam", deleteTeam);

module.exports = router