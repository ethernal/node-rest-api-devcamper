const express = require(`express`);
const router = express.Router();

router.get(`/`, (req, res) => {
  res.status(200).send({ success: true, msg: `Show all bootcamps` });
});

router.get(`/:id`, (req, res) => {
  res
    .status(200)
    .send({ success: true, msg: `Display bootcamp with id:${req.params.id}` });
});

router.post(`/`, (req, res) => {
  res.status(200).send({ success: true, msg: `Add new bootcamp` });
});

router.put(`/:id`, (req, res) => {
  res
    .status(200)
    .send({ success: true, msg: `Update bootcamp with id:${req.params.id}` });
});

router.delete(`/:id`, (req, res) => {
  res
    .status(200)
    .send({ success: true, msg: `Remove bootcamp with id:${req.params.id}` });
});

module.exports = router;
