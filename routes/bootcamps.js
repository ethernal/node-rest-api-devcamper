const express = require(`express`);
// authorize MUST be used **after** protect as protect sets up the user in the request and authorize uses that property
const { protect, authorize } = require(`../middleware/auth`);

const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require(`../controllers/bootcamps`);

const Bootcamp = require(`../models/Bootcamp`);
const advancedResults = require(`../middleware/advancedResults`);

// Include other resource routers
const courseRouter = require(`./courses`);
const reviewRouter = require(`./reviews`);

const router = express.Router();

// Re-route into other resource routers
// Forces `:/bootcampId/courses` route to be handled by courseRouter
router.use(`/:bootcampId/courses`, courseRouter);

// Re-route into other resource routers
// Forces `:/bootcampId/courses` route to be handled by courseRouter
router.use(`/:bootcampId/reviews`, reviewRouter);

router.route(`/radius/:zipcode/:distance`).get(getBootcampsInRadius);

router
  .route(`/`)
  .get(advancedResults(Bootcamp, `courses`), getBootcamps)
  .post(protect, authorize(`publisher`, `admin`), createBootcamp);

router
  .route(`/:id`)
  .get(getBootcamp)
  .put(protect, authorize(`publisher`, `admin`), updateBootcamp)
  .delete(protect, authorize(`publisher`, `admin`), deleteBootcamp);

router
  .route(protect, authorize(`publisher`, `admin`), `/:id/photo`)
  .put(bootcampPhotoUpload);

module.exports = router;
