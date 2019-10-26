const Bootcamp = require(`../models/Bootcamp`);
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");

// @desc        Get all bootcamps
// @route       GET /api/v1/bootcamps
// @access      Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  const bootcamps = await Bootcamp.find();
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

// @desc        Get single bootcamp
// @route       GET /api/v1/bootcamps/:id
// @access      Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    // MUST return as we will get an error saying that Headers are already sent:
    // Error: Cannot set headers after they are sent to the client
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// @desc        Create new bootcamp
// @route       POST /api/v1/bootcamps
// @access      Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    msg: `Created new bootcamp`,
    data: bootcamp,
  });
});

// @desc        Create new bootcamp
// @route       PUT /api/v1/bootcamps/:id
// @access      Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  return res.status(200).json({
    success: true,
    msg: `Updated bootcamp ${req.params.id}`,
    data: bootcamp,
  });
});

// @desc        Delete single bootcamp
// @route       DELETE /api/v1/bootcamps/:id
// @access      Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  return res.status(200).json({
    success: true,
    msg: `Deleted bootcamp ${req.params.id}`,
    data: bootcamp,
  });
});

// @desc        Get bootcamps in radius
// @route       GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access      Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get latitude and longitude from geocoder

  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  /*
  Calculate radius using radians
  Divide distance by radius of the Earth
  Earth radius is: 3963 miles or 6378 kilometers
  */

  const radius = distance / 6378;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [lng, lat] }, radius },
  });

  if (!bootcamps) {
    return next(
      new ErrorResponse(
        `No Bootcamps found within radius of ${radius} from ${zipcode}`,
        404
      )
    );
  }
  return res.status(200).json({
    success: true,
    msg: `Found bootcamps with search area radius.`,
    count: bootcamps.length,
    data: bootcamps,
  });
});
