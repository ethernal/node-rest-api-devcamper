const Course = require(`../models/Course`);
const Bootcamp = require(`../models/Bootcamp`);
const asyncHandler = require(`../middleware/async`);
const ErrorResponse = require(`../utils/errorResponse`);

// @desc        Get all courses associated with a bootcamp (ID) or all available courses in all bootcamps
// @route       GET /api/v1/courses
// @route       GET /api/v1/bootcamps/:bootcampId/courses
// @access      Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  // When asking for all courses in a bootcamp limit results to Courses associated with bootcampId
  // else return all Courses with pagination etc.
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      message: `Found ${courses.length} courses for bootcamp ${req.params.bootcampId}`,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
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
    message: `Found course with ID: ${req.params.id}`,
    count: 1,
    data: course,
  });
});

// @desc        Add a single course to a specific bootcamp (ID), must be an owner and publisher
// @route       POST /api/v1/bootcamps/:bootcampId/courses
// @access      Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  const bootcampId = req.params.bootcampId;
  req.body.bootcamp = bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of: ${bootcampId}`, 404)
    );
  }
  const beforeCreate = await Course.countDocuments();

  // Only allow Bootcamp owner to create Courses
  // bootcamp.user is an ObjectID so we need to parse it to string for comparison
  if (bootcamp.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is NOT authorized to add a course to the bootcamp ${req.params.id}. Only an owner ${bootcamp.user} of the Bootcamp can modify it`,
        401
      )
    );
  }

  // Add new course to the bootcamp
  const course = await Course.create(req.body);

  // This is just for fun
  const afterCreate = (await Course.countDocuments()) - beforeCreate;

  res.status(201).json({
    success: true,
    message: `Created new Course ${req.body.name} with ID: ${course._id}`,
    count: afterCreate,
    data: course,
  });
});

// @desc        Update course
// @route       POST /api/v1/courses/:id
// @access      Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let course = await Course.findById(id);

  if (!course) {
    return next(
      new ErrorResponse(`No course found with the id of: ${id}`, 404)
    );
  }

  // Only allow Course owner to update the Course
  // course.user is an ObjectID so we need to parse it to string for comparison
  if (course.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is NOT authorized to update a course ${req.params.id}. Only an owner ${course.user} of the Course can modify it`,
        401
      )
    );
  }

  course = await Course.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: `Updated course ${req.params.id}`,
    data: course,
  });
});

// @desc        Delete course
// @route       DELETE /api/v1/courses/:id
// @access      Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);

  if (!course) {
    return next(
      new ErrorResponse(`No course found with the id of: ${id}`, 404)
    );
  }

  // Only allow Course owner to delete the Course
  // course.user is an ObjectID so we need to parse it to string for comparison
  if (course.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is NOT authorized to DELETE a course ${req.params.id}. Only an owner ${course.user} of the Course can modify it`,
        401
      )
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    message: `DELETED a course with ID: ${req.params.id}`,
    data: course,
  });
});
