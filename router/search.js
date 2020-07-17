const User = require("../models/user");
const Course = require("../models/course");
const express = require("express");
const router = express.Router();
const fs = require("fs");
var path = require("path");
const authenticationMiddleware = require("../middlewares/authentication");

// Search by course name
router.get("/courses", authenticationMiddleware, async (req, res, next) => {
  const currentUsers = await Course.find().select("_id title categoryId img").populate({
    path: "categoryId",
  });
 const users= currentUsers.map((u) => {
    
      if (u.img) {
          const file = path.resolve(__dirname, 'public',`${u.img}`);
          
          var bitmap = fs.readFileSync(file);
          const img = new Buffer(bitmap).toString("base64");
          u["img"] = img;
        }
        return u
    });
    
  res.json(users);
});

module.exports = router;
