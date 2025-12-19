const express = require("express")
const router = express.Router()

const {
    createTeam,
    getTeam,
    getTeamBySport,
    getTeamBySportAndTournament,
    getTeamById,
    getTeamsByCityAndSport,
    getTeamsByCountryAndSport,
    updateTeam,
    deleteTeam
} = require("../controllers/Team")

router.post("/createTeam", createTeam)
router.get("/getTeam",getTeam)
router.get("/getTeamBySport", getTeamBySport);
router.get("/getTeamBySportAndTournament", getTeamBySportAndTournament);
router.get("/getTeamById", getTeamById);
router.get("/getTeamsByCityAndSport", getTeamsByCityAndSport);
router.get("/getTeamsByCountryAndSport", getTeamsByCountryAndSport);
router.put("/updateTeam", updateTeam);
router.delete("/deleteTeam", deleteTeam);

module.exports = router