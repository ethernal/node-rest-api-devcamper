const Bootcamp = require(`../models/Bootcamp`);
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");

// @desc        Get all bootcamps
// @route       GET /api/v1/bootcamps
// @access      Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;

  const requestQuery = { ...req.query };

  //Exclude fields from query
  const removeFields = ["select", "sort", "page", "limit"];

  removeFields.forEach(param => delete requestQuery[param]);

  //Create Query String from req.query JSON object to manipulate it later
  let queryString = JSON.stringify(requestQuery);

  // Regexp matches globally (`/g` - does not stop processing at first instance) words (\b \b - word boundary) from list of (gt, gte...)
  // Match will replace all matching occurrence with same occurrence but with added '$' sign so that it works as MongoDB function
  queryString = queryString.replace(
    /\b(gt|gte|gt|gte|lt|lte|in)\b/g,
    match => `$${match}`
  );

  //TODO: read more on populate
  // Add the field courses to all Bootcamp models.
  // If there are no courses in virtual fields the property will be empty.
  query = Bootcamp.find(JSON.parse(queryString)).populate("courses");

  // Select fields only if select was passed to the query (note that we removed select from a copy object but not from the oryginal one)
  if (req.query.select) {
    const fields = req.query.select.replace(",", " ");
    // Add Mongoose select fields to the query that will be sent to the DB, this will return only the selected fields
    query = query.select(fields);
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.replace(",", " ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Execurte Query
  const bootcamps = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination,
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
  // Note that findByIdAndDelete will not trigger pre('remove') middleware
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
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
