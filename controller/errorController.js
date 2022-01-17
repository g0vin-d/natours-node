const AppError = require('../utils/appError');

const handlerCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate Field value "${err.keyValue.name}", please use another one!`;
  return new AppError(message, 400);
};

const handlerValidationErrorDB = (err) => {
  const message = Object.keys(err.errors)
    .map((key) => err.errors[key].message)
    .join(', ');
  // const { message } = err;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid Token! Please log in again!!!', 401);

const handleTokenExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  // a) For API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // b) For Rendering
  return res.status(err.statusCode).render('error', {
    title: 'Something went Wrong!!!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // a) For API
    // Operational, trusted errors: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // programming or other unknown errors: don't leak error details
    }
    // 1) log error - this will be seen in deployment console
    console.log(`Error 💥`, err);

    // 2) send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!!!',
    });
  }
  // b) for rendering
  // Operational, trusted errors: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went Wrong!!!',
      msg: err.message,
    });
  }
  // programming or other unknown errors: don't leak error details
  // 1) log error - this will be seen in deployment console
  console.log(`Error 💥`, err);

  // 2) send generic message
  return res.status(500).render('error', {
    title: 'Something went Wrong!!!',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;

    // CastError - invalid id
    if (error.name === 'CastError') {
      error = JSON.parse(JSON.stringify(error));
      error = handlerCastErrorDB(error);
    }

    // MongoErro code - 11000 (duplicate fields)
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    // ValidationError
    if (error.name === 'ValidationError') {
      error = JSON.parse(JSON.stringify(error));
      error = handlerValidationErrorDB(error);
    }

    //JsonWebTokenError
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();

    //TokenExpiredError
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, req, res);
  }
};
