const express = require('express');

const router = express.Router();

const {
    getAdmin,
    withdrawAccept,
    withdrawDeny,
    withdrawAcceptAll,
    withdrawDenyAll,
    deleteProfit,
    deleteAllProfits,
    banUser,
    partnerUser,
    partnerDecline
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

// ban user
router.put('/banUser', asyncErrorHandler(isAdmin), asyncErrorHandler(banUser));

// partner user
router.put('/partnerUser', asyncErrorHandler(isAdmin), asyncErrorHandler(partnerUser));

// partner decline
router.put('/partnerDecline', asyncErrorHandler(isAdmin), asyncErrorHandler(partnerDecline));

module.exports = router;
