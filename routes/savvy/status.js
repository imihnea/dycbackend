const app = new (require('express').Router)();

app.get('/savvy/status/:order', (req, res) => {
  var orderId = req.params.order;
var confirmations = null;
  
confirmations = 0; //get from DB, see callback.js
maxConfirmations = 3; //get from DB, see callback.js
var resp = {
  success: confirmations >= maxConfirmations
};
if(confirmations !== null)
  resp.confirmations = confirmations;
res.json(resp); //return this data to savvy form
});
module.exports = app;