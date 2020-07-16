const Course = require("../models/course");
const User = require("../models/user");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
var path = require("path");
const CustomError = require("../helpers/customError");
const authenticationMiddleware = require("../middlewares/authentication");
const authorizationMiddleware = require("../middlewares/authorization");
//get all courses
router.get(
  "/",
  authenticationMiddleware,
  authorizationMiddleware,
  async (req, res, next) => {
    const courses = await Course.find().populate("categoryId");
    res.send(courses);
  }
);
//filter & pagination
router.get("/filters&Pagination", async (req, res, next) => {
  const q = req.query;

  const pageNo = parseInt(q.pageNo);
  const size = parseInt(q.size);
  if (q.catsId) {
    const catsArr = q.catsId.split(",");
    const filters = await Course.find({ categoryId: { $in: catsArr } })
      .skip(size * (pageNo - 1))
      .limit(size)
      .populate("categoryId");
    filters.map((c) => {
      if (c.img) {
        const file = path.resolve(__dirname,'public',`${c.img}`);

        var bitmap = fs.readFileSync(file);
        const img = new Buffer(bitmap).toString("base64");
        c["img"] = img;
      }
      return c;
    });
    const coursesCount = await Course.find({
      categoryId: { $in: catsArr },
    }).count();

    res.json({ filters, coursesCount });
  } else {
    const filters = await Course.find({})
      .skip(size * (pageNo - 1))
      .limit(size)
      .populate("categoryId");
    filters.map((c) => {
      if (c.img) {
        const file = path.resolve(__dirname, 'public',`${c.img}`);
        var bitmap = fs.readFileSync(file);
        const img = new Buffer(bitmap).toString("base64");
        c["img"] = img;
      }
      return c;
    });
    const coursesCount = await Course.find({}).count();
    res.json({ filters, coursesCount });
  }
});
//get course by id
router.get("/:id", authenticationMiddleware, async (req, res, next) => {
  const { id } = req.params;
  let enrolled = false;
  const isEnrolled = req.user.enrolledCourses.find(
    (c) => c.courseId.toString() === id.toString()
  );
  if (isEnrolled) {
    enrolled = true;
  } else {
    enrolled = false;
  }
  const course = await Course.findById(id).populate("categoryId");
  let img = "";
  if (course.img) {
    const file = path.resolve(__dirname, 'public',`${c.img}`);
    var bitmap = fs.readFileSync(file);
    img = new Buffer(bitmap).toString("base64");
  }

  res.json({ course, enrolled, img });
});
//get enrolled course by id
router.get(
  "/:cid/enrolledCourse",
  authenticationMiddleware,
  async (req, res, next) => {
    const currentEnrolledCourse = await User.findById(req.user._id).populate({
      path: "enrolledCourses",
      populate: {
        path: "courseId",
      },
    });
    const course = currentEnrolledCourse.enrolledCourses.find(
      (c) => c._id == req.params.cid
    );
    res.send(course);
  }
);
//add course
router.post(
  "/",
  authenticationMiddleware,
  authorizationMiddleware,
  async (req, res, next) => {
    const course = new Course(req.body);
    await course.save();
    res.json(course);
  }
);

//edit course
router.patch(
  "/:id",
  authenticationMiddleware,
  authorizationMiddleware,
  async (req, res, next) => {
    const { id } = req.params;

    const {
      title,
      description,
      duration,
      payment,
      points,
      categoryId,
      materials,
      img,
    } = req.body;
    const course = await Course.findByIdAndUpdate(
      id,
      {
        title,
        description,
        duration,
        payment,
        points,
        categoryId,
        materials,
        img,
      },
      { new: true, omitUndefined: true, runValidators: true }
    );
    res.json(course);
  }
);
//delete course
router.delete(
  "/:id",
  authenticationMiddleware,
  authorizationMiddleware,
  async (req, res, next) => {
    const { id } = req.params;
    var course = await Course.findByIdAndRemove(id);
    res.json(course);
  }
);

//enroll & unenroll
router.post("/:id/enroll", authenticationMiddleware, async (req, res, next) => {
  const { id } = req.params;
  // const user= await User.find({_id:req.user._id}).populate({
  //     path: "enrolledCourses"
  //   });
  if (!req.user.enrolledCourses.some((c) => c.courseId.toString() === id))
    await User.updateOne(
      { _id: req.user._id },
      { $push: { enrolledCourses: { courseId: id } } }
    );
  else
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { enrolledCourses: { courseId: id } } }
    );

  res.send(id);
});
//upload file
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
var upload = multer({ storage: storage }).single("file");
router.post("/upload", function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).send(req.file);
  });
});
module.exports = router;
