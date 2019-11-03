const Review = require(`../models/Review`);
const Bootcamp = require(`../models/Bootcamp`);
const asyncHandler = require(`../middleware/async`);
const ErrorResponse = require(`../utils/errorResponse`);

// @desc        Get all reviews
// @route       GET /api/v1/reviews
// @route       GET /api/v1/bootcamps/:bootcampId/reviews
// @access      Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }

  const reviews = await query;

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

// @desc        Get single review
// @route       GET /api/v1/reviews/:id
// @access      Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!review) {
    return next(
      new ErrorResponse(`No review found with id of ${req.params.id}`, 404)
    );
  }

  return res.status(200).json({
    success: true,
    count: review.length,
    data: review,
  });
});

// @desc        Create review
// @route       POST /api/v1/bootcamps/:bootcampId/reviews
// @access      Private
exports.createReview = asyncHandler(async (req, res, next) => {
  // Populate body of the request with relational data that it requires
  req.body.bootcamp = req.params.bootcampId;
  // This (req.user) will be provided by middleware
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp found with id ${req.params.bootcampId}`)
    );
  }

  const review = await Review.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Added review to a bootcamp",
    count: review.length,
    data: review,
  });
});

// @desc        Update review
// @route       PUT /api/v1/reviews/:id
// @access      Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(
        `Not found. Unable to update review ${req.params.id}.`,
        404
      )
    );
  }

  // Only allow review owner to update the review
  // course.user is an ObjectID so we need to parse it to string for comparison
  if (review.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is NOT authorized to update a review ${req.params.id}. Only an owner ${review.user} of the Review can modify it`,
        401
      )
    );
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    count: review.length,
    data: review,
  });
});

// @desc        DELETE review
// @route       DELETE /api/v1/reviews/:id
// @access      Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(
        `Not found. Unable to update review ${req.params.id}.`,
        404
      )
    );
  }

  // Only allow Review owner to update the Course
  // course.user is an ObjectID so we need to parse it to string for comparison
  if (review.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is NOT authorized to DELETE a review ${req.params.id}. Only an owner ${review.user} of the Review can modify it`,
        401
      )
    );
  }

  await review.remove();

  return res.status(200).json({
    success: true,
    message: `DELETED review ${req.params.id} from database.`,
    data: review,
  });
});
