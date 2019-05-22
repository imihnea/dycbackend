const app = new (require('express').Router)();
const { savvyStatus } = require('../../controllers/dashboard');
const middleware = require('../../middleware/index');

const { asyncErrorHandler } = middleware; // destructuring assignment

app.get('/savvy/status/:order', asyncErrorHandler(savvyStatus));

module.exports = app;
