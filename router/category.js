const Category = require("../models/category");
const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authentication");
const authorizationMiddleware = require("../middlewares/authorization");
const Course = require("../models/course");
//get all categories
router.get("/", async (req, res, next) => {
  const categories = await Category.find();
  res.json(categories);
});


// add category
router.post("/",authenticationMiddleware,authorizationMiddleware, async (req, res, next) => {
  const { title } = req.body;
  const category = new Category({ title });

  await category.save();
  res.json(category);
});
//get category by id
router.get("/:id", authenticationMiddleware,authorizationMiddleware, async (req, res, next) => {
  const { id } = req.params;
const category=await Category.findById(id) 
res.json(category)
})
//edit category
router.patch("/:id", authenticationMiddleware,authorizationMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;
  const category = await Category.findByIdAndUpdate(
    id,
    { title },
    { new: true, omitUndefined: true, runValidators: true }
  );
  res.json(category);
});
//delete category
router.delete("/:id", authenticationMiddleware,authorizationMiddleware, async (req, res, next) => {
  const { id } = req.params;
  var category = await Category.findByIdAndRemove(id);
  res.json(category);
});

module.exports = router;
