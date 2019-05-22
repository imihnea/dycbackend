const { errorLogger } = require('./winston');
const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});

// REQUIRES TESTING
function withdraw(req, cost) {
    if (req) {
        client.getAccount('primary', function(err, account) {
            if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - client.getAccount\r\n${err.message}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
                client.getSellPrice({'currency': 'RON'}, function(err, sellPrice) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - client.getSellPrice\r\n${err.message}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                        account.sell({
                            'amount': `${cost}`,
                            'currency': 'BTC'
                        }, (err, sell) => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - account.sell\r\n${err.message}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                console.log(sell);
                                if (process.env.NODE_ENV === 'production') {
                                    logger.info(`Sold ${cost} for ${cost * sellPrice} RON; Paid on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            }
                        });     
                    }
                });
            }
        });
    } else {
        client.getAccount('primary', function(err, account) {
            if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - client.getAccount\r\n${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
                client.getSellPrice({'currency': 'RON'}, function(err, sellPrice) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - client.getSellPrice\r\n${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                        account.sell({
                            'amount': `${cost}`,
                            'currency': 'BTC'
                        }, (err, sell) => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - account.sell\r\n${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                console.log(sell);
                                if (process.env.NODE_ENV === 'production') {
                                    logger.info(`Sold ${cost} for ${cost * sellPrice} RON; Paid on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            }
                        });     
                    }
                });
            }
        });
    }
};

module.exports = { withdraw };
