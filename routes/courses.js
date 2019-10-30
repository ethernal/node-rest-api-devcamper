const express = require(`express`);
const {
  getCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
} = require(`../controllers/courses`);

const Course = require(`../models/Course`);
const advancedResults = require(`../middleware/advancedResults`);

// mergeParams:true is requires if re-routing is supposed to work properly
// it merges the URL parameters
const router = express.Router({ mergeParams: true });

// these routes are re-routed from Bootcamp router so their route is:
// `/bootcamps/:bootcampId/courses/:id`
// courses in the above comes from base route for this router
router
  .route(`/`)
  .get(
    advancedResults(Course, {
      path: `bootcamp`,
      select: `name description`,
    }),
    getCourses
  )
  .post(addCourse);
router
  .route(`/:id`)
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

module.exports = router;
