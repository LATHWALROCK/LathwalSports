const express = require("express")
const router = express.Router()

const {
    createLeague,
    getLeague,
    getLeagueByTeam,
    deleteLeague,
    updateLeague
} = require("../controllers/League")

router.post("/createLeague", createLeague)
router.get("/getLeague",getLeague)
router.get("/getLeagueByTeam", getLeagueByTeam)
router.put("/updateLeague", updateLeague)
router.delete("/deleteLeague",deleteLeague)

module.exports = router