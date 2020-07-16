const User = require("../models/user");
const Course = require("../models/course");
const express = require("express");
const router = express.Router();
const fs = require("fs");
var path = require("path");
const CustomError = require("../helpers/customError");

const authenticationMiddleware = require("../middlewares/authentication");
const authorizationMiddleware = require("../middlewares/authorization");
const validationMiddleware = require("../middlewares/validation");
const { check } = require("express-validator");

let validations = [
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters!"),
  check("email").isEmail().withMessage("Ivalid email!"),
  check("userType").optional().isIn(["user", "admin"]),
];

//get users
router.get(
  "/",
  authenticationMiddleware,
  authorizationMiddleware,
  async (req, res, next) => {
    const users = await User.find({ userType: "user" });
    res.send(users);
  }
);

router.post(
  "/registeration",
  validationMiddleware(validations[0], validations[1], validations[2]),
  async (req, res, next) => {
    const { fullName, email, password, userType } = req.body;
    if (userType === "user") {
      const user = new User({ fullName, email, password, userType });

      const matchEmail = await user.compareEmail(email);
      if (matchEmail.length > 0)
        throw CustomError(400, "This email is already exists!");

      await user.save();
      const token = await user.generateToken();
      res.json({ user, token });
    } else {
      throw CustomError(401, "admin doesn't allow to register");
    }
  }
);
router.post(
  "/addAdmin",
  authenticationMiddleware,
  authorizationMiddleware,
  validationMiddleware(validations[0], validations[1], validations[2]),
  async (req, res, next) => {
    const { fullName, email, password, userType } = req.body;
    if (userType === "admin") {
      const user = new User({ fullName, email, password, userType });

      const matchEmail = await user.compareEmail(email);
      if (matchEmail.length > 0)
        throw CustomError(400, "This email is already exists!");

      await user.save();
      res.json(user);
    } else {
      throw CustomError(401, "user doesn't allow to be added");
    }
  }
);
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw CustomError(404, "Sorry, Email or Password is incorrect!");

  if (user.disable !== false) throw CustomError(401, `Sorry, you are disabled`);

  const match = await user.comparePassword(password);
  if (!match) throw CustomError(404, "Sorry, Email or Password is incorrect!");

  const token = await user.generateToken();
  res.json({ user, token });
});

router.get("/profile/:id", authenticationMiddleware, async (req, res, next) => {
  const currentUser = await User.findById(req.params.id).populate({
    path: "enrolledCourses",
    populate: {
      path: "courseId",
      populate: {
        path: "categoryId",
      },
    },
  });
  if(currentUser.img){
    const file = path.resolve(__dirname,'public',`${currentUser.img}`);
        
        var bitmap = fs.readFileSync(file);
        const img = new Buffer(bitmap).toString("base64");
        currentUser["img"] = img;

  }
  currentUser.enrolledCourses.map((c) => {
    if(c.courseId){

      if (c.courseId.img) {
        const file = path.resolve(__dirname, 'public',`${c.courseId.img}`);
        
        var bitmap = fs.readFileSync(file);
        const img = new Buffer(bitmap).toString("base64");
        c.courseId["img"] = img;
      }
    }
      return c;
    });
    res.send(currentUser);
});

router.get("/profile", authenticationMiddleware, async (req, res, next) => {
  const currentUser = await User.findById(req.user._id).populate({
    path: "enrolledCourses",
    populate: {
      path: "courseId",
      populate: {
        path: "categoryId",
      },
    },
  });
  if(currentUser.img)
  {

    const file = path.resolve(__dirname,'public',`${currentUser.img}`);
  var bitmap = fs.readFileSync(file);
  const img = new Buffer(bitmap).toString("base64");
  currentUser.img=img
}
  res.send(currentUser);
});

//disable & enable
router.post(
  "/:id/disable",
  authenticationMiddleware,
  async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user.disable === false)
      await User.updateOne({ _id: id }, { disable: true });
    else await User.updateOne({ _id: id }, { disable: false });

    res.send(id);
  }
);

router.patch("/:id", authenticationMiddleware, async (req, res, next) => {
  const { id } = req.params;

  const { fullName, email, points, enrolledCourses,img } = req.body;
  const user = await User.findByIdAndUpdate(
    id,
    { fullName, email, points, enrolledCourses,img },
    { new: true, omitUndefined: true, runValidators: true }
  );
  res.json(user);
});

router.delete(
  "/:id",
  authenticationMiddleware,
  authorizationMiddleware,
  async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findOneAndDelete(id);
    res.json(user);
  }
);
module.exports = router;
