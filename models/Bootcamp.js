const mongoose = require(`mongoose`);
const slugify = require(`slugify`);
const geocoder = require(`../utils/geocoder`);
const colors = require("colors");
const asyncHandler = require("../middleware/async");

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `Please add a name`],
      unique: true,
      trim: true,
      maxlength: [50, `Name can not be more than 50 characters`],
    },
    slug: String,
    description: {
      type: String,
      required: [true, `Please add a description`],
      maxlength: [500, `Description can not be more than 500 characters`],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        `Please use a valid URL with HTTP or HTTPS`,
      ],
    },
    phone: {
      type: String,
      maxlength: [20, `Phone number can not be longer than 20 characters`],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        `Please add a valid email`,
      ],
    },
    address: {
      type: String,
      required: [true, `Please add an address`],
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: [`Point`],
      },
      coordinates: {
        type: [Number],
        index: `2dsphere`,
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        `Web Development`,
        `Mobile Development`,
        `UI/UX`,
        `Data Science`,
        `Business`,
        `Other`,
      ],
    },
    averageRating: {
      type: Number,
      min: [1, `Rating must be at least 1`],
      max: [10, `Rating must can not be more than 10`],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: `no-photo.jpg`,
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// You need to use function keyword instead of arrow functions as `function` has different scope that is needed for this kind of middleware.

BootcampSchema.pre(`save`, function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Geocode & create location field
BootcampSchema.pre("save", async function(next) {
  console.log(`Finding GeoCoded location point for: "${this.address}"`);
  const loc = geocoder
    .geocode(this.address)
    .then(() => {
      this.location = {
        type: "Point",
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode,
      };

      // Do not save address in DB
      //this.address = undefined;

      next();
    })
    .catch(error => {
      if (error.name === "HttpError" && error.code === "EAI_AGAIN") {
        console.log(
          `Proxy error. Cannot connect to the host. ${error.message}`.red
            .inverse
        );
      }
    });
});

// Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre("remove", async function(next) {
  console.log(
    `Courses are being removed from bootcamp ${this._id}`.red.inverse
  );
  await this.model("Course").deleteMany({ bootcamp: this._id });
  next();
});
// Reverse populate with virtuals

// The virtual field will be called `courses`
BootcampSchema.virtual("courses", {
  ref: "Course", // reference `Course` Model
  localField: `_id`, // Save local filed with name `_id`
  foreignField: `bootcamp`, // Course.bootcamp references the Bootcamp that a course belongs to
  justOne: false, // will return an array of courses assigned to this bootcamp
});

module.exports = mongoose.model(`Bootcamp`, BootcampSchema);
