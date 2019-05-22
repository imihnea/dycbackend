const winston = require('winston');
const {LoggingWinston} = require('@google-cloud/logging-winston');
const { format } = require('logform');

const loggingWinston = new LoggingWinston();

// define the custom settings for each transport (file, console)
const options = {
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

// instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        // loggingWinston,
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const userLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        // loggingWinston,
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const productLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        // loggingWinston,
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const dealLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        // loggingWinston,
    ],
    exitOnError: false
});

const reviewLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        // loggingWinston,
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const errorLogger = winston.createLogger({
    format: format.printf(error => error.message),
    transports: [
        new winston.transports.Console(options.console),
        // loggingWinston,
    ],
    exitOnError: false
});

const warnLogger = winston.createLogger({
    format: format.printf(warn => warn.message),
    transports: [
        // loggingWinston,
    ],
    exitOnError: false
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

userLogger.stream = {
    write: function(message, encoding) {
        userLogger.info(message);
    }
};

productLogger.stream = {
    write: function(message, encoding) {
        productLogger.info(message);
    }
};

dealLogger.stream = {
    write: function(message, encoding) {
        dealLogger.info(message);
    }
};

reviewLogger.stream = {
    write: function(message, encoding) {
        reviewLogger.info(message);
    }
};

errorLogger.stream = {
    write: function(message, encoding) {
        errorLogger.error(message);
    }
};

warnLogger.stream = {
    write: function(message, encoding) {
        warnLogger.warn(message);
    }
};

module.exports = {logger, userLogger, productLogger, dealLogger, reviewLogger, errorLogger, warnLogger};
