const express = require("express")
const router = express.Router()

const {
    createSport,
    getSport
} = require("../controllers/Sport")

router.post("/createSport", createSport)
router.get("/getSport",getSport)

module.exports = router