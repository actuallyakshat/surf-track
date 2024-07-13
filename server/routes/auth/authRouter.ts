import {
  login,
  register,
  validateToken,
} from "../../controllers/auth/authController";

const express = require("express");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/validateToken", validateToken);

module.exports = router;
