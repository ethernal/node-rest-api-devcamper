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
      required: [true, `Please add a description of a Bootcamp`],
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
        `Please add a valid email address`,
      ],
    },
    address: {
      type: String,
      required: [true, `Please add an address of a Bootcamp`],
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
      max: [10, `Rating cannot be more than 10`],
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
    user: {
      type: mongoose.Schema.ObjectId,
      ref: `User`,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Allow virtual = computed properties (https://mongoosejs.com/docs/tutorials/virtuals.html)
    // :bomb: these properties are not stored in MongoDB so they cannot be queried
    // https://mongoosejs.com/docs/tutorials/virtuals.html#virtuals-in-json
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

      // If you do not want to save address in DB uncomment the following line
      // I leave it here as Proxy interferes with external services and it is not possible ot retrieve location data
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

// Cascade delete all associated courses when a bootcamp is deleted
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
