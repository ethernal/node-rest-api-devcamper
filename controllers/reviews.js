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
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(
        `Not found. Unable to update review ${req.params.id}.`,
        404
      )
    );
  }

  await review.update(req.body);

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
  const review = await Review.findById(req.params.id);

  if (!review) {
    next(
      new ErrorResponse(
        `Not found. Unable to delete review ${req.params.id}.`,
        404
      )
    );
  }

  review.remove();

  return res.status(200).json({
    success: true,
    message: `Deleted review ${req.params.id}`,
    count: review.length,
    data: review,
  });
});
