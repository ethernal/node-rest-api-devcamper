const express = require(`express`);
const Review = require(`../models/Review`);

const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require(`../controllers/reviews`);

// MergeParams:true is required if re-routing is supposed to work properly
// it merges the URL parameters
const router = express.Router({ mergeParams: true });

// Must be added if you want to use advanced reviews in routes
const advancedResults = require(`../middleware/advancedResults`);
const { protect, authorize } = require(`../middleware/auth`);

// These routes are re-routed from Bootcamp router so their route is:
// `/bootcamps/:bootcampId/reviews/[:id]`
// reviews in the above comes from base route for this router
router
  .route(`/`)
  .get(
    // Populate Review with Bootcamp name and description
    advancedResults(Review, {
      path: `bootcamp`,
      select: `name description`,
    }),
    getReviews
  )
  .post(protect, authorize(`user`, `admin`), createReview);

router
  .route(`/:id`)
  .get(getReview)
  .put(protect, authorize(`user`, `admin`), updateReview)
  .delete(protect, authorize(`user`, `admin`), deleteReview);

module.exports = router;
