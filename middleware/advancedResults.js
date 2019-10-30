const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  const requestQuery = { ...req.query };

  //Exclude fields from query
  const removeFields = ["select", "sort", "page", "limit"];

  removeFields.forEach(param => delete requestQuery[param]);

  //Create Query String from req.query JSON object to manipulate it later
  let queryString = JSON.stringify(requestQuery);

  // Regexp matches globally (`/g` - does not stop processing at first instance) words (\b \b - word boundary) from list of (gt, gte...)
  // Match will replace all matching occurrence with same occurrence but with added '$' sign so that it works as MongoDB function
  queryString = queryString.replace(
    /\b(gt|gte|gt|gte|lt|lte|in)\b/g,
    match => `$${match}`
  );

  //TODO: read more on populate
  // Add the field courses to all  models.
  // If there are no courses in virtual fields the property will be empty.
  query = model.find(JSON.parse(queryString));

  // Select fields only if select was passed to the query (note that we removed select from a copy object but not from the oryginal one)
  if (req.query.select) {
    const fields = req.query.select.replace(",", " ");
    // Add Mongoose select fields to the query that will be sent to the DB, this will return only the selected fields
    query = query.select(fields);
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.replace(",", " ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Populate
  if (populate) {
    query = query.populate(populate);
  }

  // Execurte Query
  const results = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
