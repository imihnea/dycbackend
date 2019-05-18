const express = require('express');

const router = express.Router();

const {
    getAdmin,
    withdrawAccept,
    withdrawDeny,
    withdrawAcceptAll,
    withdrawDenyAll,
    deleteProfit,
    deleteAllProfits
  } = require('../controllers/admin');

const middleware = require('../middleware/index');

const { asyncErrorHandler, checkId, isAdmin } = middleware;


// admin page
router.get('/', asyncErrorHandler(isAdmin), asyncErrorHandler(getAdmin));

// accept single withdraw
router.put('/accept/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(withdrawAccept));

// deny single withdraw
router.put('/deny/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(withdrawDeny));

// accept all withdraws
router.put('/acceptAll', asyncErrorHandler(isAdmin), asyncErrorHandler(withdrawAcceptAll));

// deny all withdraws
router.put('/denyAll', asyncErrorHandler(isAdmin), asyncErrorHandler(withdrawDenyAll));

// delete single profit
router.put('/delete/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(deleteProfit));

// delete all profits
router.put('/deleteAll', asyncErrorHandler(isAdmin), asyncErrorHandler(deleteAllProfits));

module.exports = router;
