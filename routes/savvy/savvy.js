var https = require('https');

var SAVVY_SECRET = 'secf30f5f307df6c75bbd17b3043c1d81c5';

function getAddress(orderId, token, callback) {
  var callbackUrl = 'https://dyc.herokuapp.com/savvy/callback/' + orderId;
  var lock_address = 3600;
  var url = 'https://api.savvy.io/v3/' + token.toLowerCase() + '/payment/' + encodeURI(callbackUrl) + '?token=' + SAVVY_SECRET + '&lock_address=' + lock_address;

  https.get(url, function (res) {
    var rawData = '';
    res.on('data', function (chunk) { rawData += chunk; });

    res.on('end', function () {
      var response = JSON.parse(rawData);
      if (response.success) {
        callback(response.data.address);
      }
    });
  }).
  on('error', function (e) {
    console.error(e);
    callback(null);
  });
}

function getCurrencies(callback)
{
    var currencies = null; //TODO: add cache here?

    var url = 'https://api.savvy.io/v3/currencies?token=' + SAVVY_SECRET;

    https.get(url, function (res) {
        var rawData = '';
        res.on('data', function (chunk) { rawData += chunk; });

        res.on('end', function () {
            var response = JSON.parse(rawData);
            if (response.success) {
                callback(response.data);
            }
        });
    }).
    on('error', function (e) {
        console.error(e);
        callback(null);
    });
}

function getCurrency(token, orderId, getAddr, callback) {
  getRate(token, function(rate) {
    if (rate) {
      var fiatValue = 19.99; //get from $orderId
      var coinsValue = +(fiatValue / rate).toFixed(8);
      var currency = null;

      getCurrencies(function(currencies) {
          token = token.toLowerCase();
          currency = currencies[token];
          currency['coinsValue'] = coinsValue;

          if (getAddr) {
              getAddress(orderId, token, function(address) {
                  currency['address'] = address;
                  currency['blockExplorer'] = currency['blockExplorer'] + address;
                  callback(currency);
              });
          } else {
              currency['currencyUrl'] = '/savvy/currencies?order=' + orderId + '&token=' + token;
              callback(currency);
          }
      });

    }
  });
}

function getRate(curCode, callback) {
  curCode = curCode.toLowerCase();
  getRates(function (rates) {
    rates[curCode] ? callback(rates[curCode].mid) : callback(false);
  });
}

function getRates(callback) {
  var url = 'https://api.savvy.io/v3/exchange/usd/rate';

  https.get(url, function (res) {
    var rawData = '';
    res.on('data', function (chunk) { rawData += chunk; });

    res.on('end', function () {
      var response = JSON.parse(rawData);
      if (response.success) {
        callback(response.data);
      }
    });
  }).
  on('error', function (e) {
    console.error(e);
    callback(null);
  });
}

module.exports = {
  getAddress: getAddress,
  getCurrency: getCurrency,
  getCurrencies: getCurrencies,
  getRate: getRate,
  getRates: getRates
};