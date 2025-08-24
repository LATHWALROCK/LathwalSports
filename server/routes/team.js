const express = require("express")
const router = express.Router()

const {
    createTeam,
    getTeam,
    deleteTeam
} = require("../controllers/Team")

router.post("/createTeam", createTeam)
router.get("/getTeam",getTeam)
router.delete("/deleteTeam", deleteTeam);

module.exports = router