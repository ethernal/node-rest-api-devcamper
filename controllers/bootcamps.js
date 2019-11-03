const Bootcamp = require(`../models/Bootcamp`);
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const path = require("path");

// @desc        Get all bootcamps
// @route       GET /api/v1/bootcamps
// @access      Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
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
  // Add user to request.body
  // Since this route is protected and requires user to be logged in, value of req.user.id MUST be valid
  req.body.user = req.user.id;

  // Check if user already created a bootcamp

  const hasPublishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  // Allow only one bootcamp per user unless it is an admin user
  if (hasPublishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `The user with id ${req.user.id} already published a Bootcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    msg: `Created new bootcamp`,
    data: bootcamp,
  });
});

// @desc        Update bootcamp
// @route       PUT /api/v1/bootcamps/:id
// @access      Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Only allow updates on Bootcamp if done by the owner - user who created it or admin
  // bootcamp.user is an ObjectID so we need to parse it to string for comparison
  if (bootcamp.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update the bootcamp ${req.params.id}. Only an owner ${bootcamp.user} of the Bootcamp can make edits it it`,
        401
      )
    );
  }

  await bootcamp.update(req.body, {
    new: true,
    runValidators: true,
  });

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
  // Note that findByIdAndDelete will not trigger pre('remove') middleware
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Only allow delete on Bootcamp if done by the owner - user who created it or admin
  // bootcamp.user is an ObjectID so we need to parse it to string for comparison
  if (bootcamp.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to DELETE the bootcamp ${req.params.id}. Only an owner ${bootcamp.user} of the Bootcamp can make edits it it`,
        401
      )
    );
  }

  bootcamp.remove();

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

// @desc        Upload photo for bootcamp
// @route       PUT /api/v1/bootcamps/:id/photo
// @access      Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  // Note that findByIdAndDelete will not trigger pre('remove') middleware
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Only allow photo upload on Bootcamp if done by the owner - user who created it or admin
  // bootcamp.user is an ObjectID so we need to parse it to string for comparison
  if (bootcamp.user.toString() != req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is NOT authorized to UPLOAD PHOTO the bootcamp ${req.params.id}. Only an owner ${bootcamp.user} of the Bootcamp can make edits it it`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // make sure it is a photo
  if (!file.mimetype.startsWith(`image`)) {
    return next(
      new ErrorResponse(
        `Please upload an image file instead of ${file.mimetype}`,
        400
      )
    );
  }

  //set a limit for file upload

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image smaller than ${process.env.MAX_FILE_UPLOAD}. You tried to upload ${file.size}`,
        400
      )
    );
  }

  // create custom filename

  file.name = `photo_${bootcamp.id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    return res.status(200).json({
      success: true,
      msg: `Uploaded the photo to ${req.params.id}`,
      data: file.name,
    });
  });
});
