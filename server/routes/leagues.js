const express = require("express")
const router = express.Router()

const {
    createLeague,
    getLeague,
    deleteLeague
} = require("../controllers/League")

router.post("/createLeague", createLeague)
router.get("/getLeague",getLeague)
router.delete("/deleteLeague",deleteLeague)

module.exports = router