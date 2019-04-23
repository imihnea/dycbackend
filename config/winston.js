const winston = require('winston');
const { format } = require('logform');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const readline = require('readline');
const {google} = require('googleapis');
const moment = require('moment');

// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: `./logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 5,
    colorize: false,
  },
  user: {
    level: 'info',
    filename: `./logs/user.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 5,
    colorize: false,
  },
  product: {
    level: 'info',
    filename: `./logs/product.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 5,
    colorize: false,
  },
  deal : {
    level: 'info',
    filename: `./logs/deal.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 5,
    colorize: false,
  },
  review: {
    level: 'info',
    filename: `./logs/review.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 5,
    colorize: false,
  },
  error: {
    level: 'error',
    filename: `./logs/err.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 5,
    colorize: false,
  },
  warning: {
    level: 'warn',
    filename: `./logs/warn.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520,
    maxFiles: 5,
    colorize: false,
  },
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
        new winston.transports.File(options.file),
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const userLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        new winston.transports.File(options.user),
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const productLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        new winston.transports.File(options.product),
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const dealLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        new winston.transports.File(options.deal),
    ],
    exitOnError: false
});

const reviewLogger = winston.createLogger({
    format: format.printf(info => info.message),
    transports: [
        new winston.transports.File(options.review),
    ],
    exitOnError: false, // do not exit on handled exceptions
});

const errorLogger = winston.createLogger({
    format: format.printf(error => error.message),
    transports: [
        new winston.transports.File(options.error),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false
});

const warnLogger = winston.createLogger({
    format: format.printf(warn => warn.message),
    transports: [
        new winston.transports.File(options.warning)
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
const files = ['app.log', 'deal.log', 'err.log', 'product.log', 'review.log', 'user.log', 'warn.log'];

async function createArchive() {
    const output = fs.createWriteStream(path.join(__dirname, '..', '/logs.zip'));
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.pipe(output);    
    let filePath = '';
    await files.forEach(async (file) => {
        filePath = path.join(__dirname, '..', '/logs', '/', file);
        await archive.append(fs.createReadStream(filePath), {name: file});
    });
    await archive.finalize();
}

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

function authorizeUpload() {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), uploadLog);
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  
/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function uploadLog(auth) {
    await createArchive();
    const drive = google.drive({
        version: 'v3', 
        auth
    });
    await drive.files.create({
        requestBody: {
            name: `Logs ${moment().format('DD-MM-YYYY')}`,
            mimeType: 'application/zip'    
        },
        media: {
            mimeType: 'application/zip',
            body: fs.createReadStream(path.join(__dirname, '..', '/logs.zip'))
        }
    }, (err) => {
        if (err) {
            // Weird error - everything works but it's still being thrown
            // console.log(err);
        } else {
            console.log('Logs uploaded');
            fs.unlinkSync(path.join(__dirname, '..', '/logs.zip')); // delete file
            files.forEach(file => {
                fs.truncate(path.join(__dirname, '..', `/logs/${file}`), 0, (err) => { if (err) {console.log(err)} });
            });
            console.log('Logs cleared');
        }
    });
}

module.exports = {logger, userLogger, productLogger, dealLogger, reviewLogger, errorLogger, warnLogger, authorizeUpload};
