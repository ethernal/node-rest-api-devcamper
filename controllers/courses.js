const Course = require(`../models/Course`);
const Bootcamp = require(`../models/Bootcamp`);
const asyncHandler = require(`../middleware/async`);
const ErrorResponse = require(`../utils/errorResponse`);

// @desc        Get all courses
// @route       GET /api/v1/courses
// @route       GET /api/v1/bootcamps/:bootcampId/courses
// @access      Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  let query;

  if (req.params.bootcampId) {
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    query = Course.find();
  }

  const courses = await query;

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

// @desc        Get a single courses
// @route       GET /api/v1/courses/:id
// @access      Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    count: 1,
    data: course,
  });
});

// @desc        Add a single courses
// @route       POST /api/v1/bootcamps/:bootcampId/courses
// @access      Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  const bootcampId = req.params.bootcampId;
  req.body.bootcamp = bootcampId;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of: ${bootcampId}`, 404)
    );
  }
  const beforeCreate = await Course.countDocuments();

  // Add new course to the bootcamp
  const course = await Course.create(req.body);

  // This is just for fun
  const afterCreate = (await Course.countDocuments()) - beforeCreate;

  res.status(201).json({
    success: true,
    count: afterCreate,
    data: course,
  });
});
