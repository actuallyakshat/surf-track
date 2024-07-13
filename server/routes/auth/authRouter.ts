import { login, register } from "../../controllers/auth/authController";

const express = require("express");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;
