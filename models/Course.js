const mongoose = require(`mongoose`);

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, `Please add a course title`],
  },
  description: {
    type: String,
    required: [true, `Please add a course description`],
  },
  weeks: {
    type: String,
    required: [true, `Please add number of weeks the course will take`],
  },
  tuition: {
    type: Number,
    required: [true, `Please add a tuition cost`],
  },
  minimumSkill: {
    type: String,
    required: [true, `Please add a minimum skill level required`],
    enum: [`beginner`, `intermediate`, `advanced`],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: `Bootcamp`,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: `User`,
    required: true,
  },
});

// Define a static function (available to all instances of this object) in a schema for Average Cost
CourseSchema.statics.setAverageCost = async function(bootcampId) {
  const aggregateObject = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(aggregateObject[0].averageCost / 10) * 10,
    });
  } catch (error) {
    console.error(error);
  }
};

// Call setAverageCost after save
CourseSchema.post(`save`, function() {
  this.constructor.setAverageCost(this.bootcamp);
});
CourseSchema.pre(`remove`, function() {
  this.constructor.setAverageCost(this.bootcamp);
});

module.exports = mongoose.model(`Course`, CourseSchema);
