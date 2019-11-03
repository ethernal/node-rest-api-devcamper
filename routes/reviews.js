const express = require(`express`);
const Review = require(`../models/Review`);

const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require(`../controllers/reviews`);

// mergeParams:true is required if re-routing is supposed to work properly
// it merges the URL parameters
const router = express.Router({ mergeParams: true });

// must be added if you want to use advanced reviews in routes
const advancedResults = require(`../middleware/advancedResults`);
const { protect, authorize } = require(`../middleware/auth`);

// these routes are re-routed from Bootcamp router so their route is:
// `/bootcamps/:bootcampId/courses/:id`
// courses in the above comes from base route for this router
router
  .route(`/`)
  .get(
    advancedResults(Review, {
      path: `bootcamp`,
      select: `name description`,
    }),
    getReviews
  )
  .post(createReview);

router
  .route(`/:id`)
  .get(getReview)
  .put(updateReview)
  .delete(deleteReview);

module.exports = router;
