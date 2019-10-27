const express = require(`express`);
const { getCourses } = require(`../controllers/courses`);

// mergeParams:true is requires if re-routing is supposed to work properly
// it merges the URL parameters
const router = express.Router({ mergeParams: true });

router.route(`/`).get(getCourses);

module.exports = router;
