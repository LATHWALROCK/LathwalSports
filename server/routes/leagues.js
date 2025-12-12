const express = require("express")
const router = express.Router()

const {
    createLeague,
    getLeague,
    deleteLeague,
    updateLeague
} = require("../controllers/League")

router.post("/createLeague", createLeague)
router.get("/getLeague",getLeague)
router.put("/updateLeague", updateLeague)
router.delete("/deleteLeague",deleteLeague)

module.exports = router