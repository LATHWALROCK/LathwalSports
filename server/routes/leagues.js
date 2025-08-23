const express = require("express")
const router = express.Router()

const {
    createLeague,
    getLeague
} = require("../controllers/League")

router.post("/createLeague", createLeague)
router.get("/getLeague",getLeague)

module.exports = router