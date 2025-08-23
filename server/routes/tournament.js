const express = require("express")
const router = express.Router()

const {
    createTournament,
    getTournament
} = require("../controllers/Tournament")

router.post("/createTournament", createTournament)
router.get("/getTournament",getTournament)

module.exports = router