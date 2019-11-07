const mongoose = require(`mongoose`);

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, `Please add a title for the review`],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, `Please add contents of the review`],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, `Please add a rating between 1 and 10`],
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

// Allow only one Review per Bootcamp for user using DB index
// this is different than verfying in code and in my opinion less flexible
// but shows a different way how to approach such problem/spec.
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Define a static function in a schema for Average Cost
ReviewSchema.statics.setAverageRating = async function(bootcampId) {
  // Find all bootcamps with specific ID
  // Creating a group with
  // calculated averege rating based on `rating` value in each one using $avg MongoDB function
  const aggregateObject = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);
  try {
    // Save average rating as models property
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: aggregateObject[0].averageRating,
    });
  } catch (error) {
    console.error(error);
  }
};

// Call setAverageRating after save
ReviewSchema.post(`save`, function() {
  this.constructor.setAverageRating(this.bootcamp);
});
ReviewSchema.pre(`remove`, function() {
  this.constructor.setAverageRating(this.bootcamp);
});

module.exports = mongoose.model(`Review`, ReviewSchema);
