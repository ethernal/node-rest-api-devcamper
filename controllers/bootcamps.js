// @desc        Get all bootcamps
// @route       GET /api/v1/bootcamps
// @access      Public
exports.getBootcamps = (req, res, next) => {
  res.status(200).send({ success: true, msg: `Show all bootcamps` });
};

// @desc        Get single bootcamp
// @route       GET /api/v1/bootcamps/:id
// @access      Public
exports.getBootcamp = (req, res, next) => {
  res.status(200).send({ success: true, msg: `Show single bootcamps` });
};

// @desc        Create new bootcamp
// @route       POST /api/v1/bootcamps
// @access      Private
exports.createBootcamp = (req, res, next) => {
  // Code here
};

// @desc        Create new bootcamp
// @route       PUT /api/v1/bootcamps
// @access      Private
exports.updateBootcamp = (req, res, next) => {
  // Code here
};

// @desc        Delete single bootcamp
// @route       DELETE /api/v1/bootcamps/:id
// @access      Private
exports.deleteBootcamp = (req, res, next) => {
  // Code here
};
