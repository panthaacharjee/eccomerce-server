const expressRoute = require("express");
const router = expressRoute.Router();
const {
  registerUser,
  loginUser,
  logout,
  getUser,
  getAllUsers,
  loginAdmin,
} = require("../controllers/authController");

const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/register/user").post(registerUser);
router.route("/login/user").post(loginUser);
router.route("/logout").get(logout);
router.route("/get/user").get(isAuthenticatedUser, getUser);

router.route("/login/admin").post(loginAdmin);
router.route("/get/users").get( getAllUsers);

module.exports = router;
