const router = require("express").Router();

const {
  forgotPassword,
  resetPassword,
} = require("../controllers/resetPassword");
const { restrict } = require("../middlewares/auth.middlewares");

router.get("/reset-password", (req, res) => {
  res.render("reset-password", { token: req.query.token });
});

router.get("/update-password", (req, res) => {
  res.render("update-password", { user: req.user });
});

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
