const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const moment = require('moment');
const path = require('path');
const { Parser } = require('json2csv');
const Log = require('../models/log');

const fields = ['logType', 'message', 'data', 'sentFromUser', 'sentFromFile', 'sentFromMethod', 'createdAt'];
const opts = {fields};
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), uploadLog);
});

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
    const drive = google.drive({
        version: 'v3', 
        auth
    });
    
    Log.find({createdAt: { $lt: Date.now() }}, (err, logs) => {
        if (err) {
          const log = {
            logType: 'Error',
            message: err,
            sentFromFile: 'Server',
            sentFromMethod: 'Find Old Logs'
          };
          Log.create(log, (err) => {
            if (err) {
              console.log(err);
            }
          });
        } else {
          if (logs.length > 0) {
            let csv;
            try {
              const parser = new Parser(opts);
              csv = parser.parse(logs);            
              const dateTime = moment().format('DD-MM-YYYY');
              const filePath = path.join(__dirname, "..", "logs", "Log " + dateTime + ".csv");
            
              fs.writeFile(filePath, csv, async function (err) {
                if (err) {
                  return console.log(err);
                } else {
                  await drive.files.create({
                      requestBody: {
                          name: `Log ${moment().format('DD-MM-YYYY')}`,
                          mimeType: 'text/csv'    
                      },
                      media: {
                          mimeType: 'text/csv',
                          body: fs.createReadStream(filePath)
                      }
                  }, (err) => {
                      if (err) {
                          console.log(err);
                      }
                  });
                  fs.unlinkSync(filePath); // delete file
                  Log.deleteMany({createdAt: { $lt: Date.now() }}, (err) => {
                    if (err) {
                        console.log(err);
                    }
                  });
                  return console.log('Log file upload sequence finished.');
                }
              });
            } catch (err) {
              const log = {
                logType: 'Error',
                message: err,
                sentFromFile: 'Server',
                sentFromMethod: 'Convert to CSV'
              };
              Log.create(log, (err) => {
                if (err) {
                  console.log(err);
                }
              });
            }
          }
        }
    });
}

module.exports = {
    SCOPES,
    uploadLog,
};
