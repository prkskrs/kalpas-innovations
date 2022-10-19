import express from "express"
const router = express.Router()

// import controllers
import {signUp, verifyOtp, login} from "../controllers/userController.js"

router.route("/signUp").post(signUp)
router.route("/verifyOtp").post(verifyOtp)
router.route("/login").post(login)


export default router;