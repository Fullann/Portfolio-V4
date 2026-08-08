const AppError = require('../utils/AppError');

const sendErrorDev = (err, req, res) => {
  console.error('Erreur (Dev):', err);
  return res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status || 'error',
      message: err.message
    });
  }
  
  // Programming or other unknown error: don't leak error details
  console.error('Erreur Critique (Prod):', err);
  return res.status(500).json({
    status: 'error',
    message: 'Une erreur interne du serveur est survenue'
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    // Dans certains cas (ZodError par exemple), on pourrait formater l'erreur ici avant l'envoi
    sendErrorProd(err, req, res);
  }
};

module.exports = errorHandler;
