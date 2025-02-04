const express = require('express');

const router = express.Router();

const { getChats, getMessages, newMessage, newChat, updateMessages, newOngoingChat, newMessageDeal, updateMessagesDeal,
        destroyChat, checkAndRedirect } = require('../controllers/messages');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile, checkIfBelongsChat, checkId, getPrice } = middleware; // destructuring assignment

// show all chats
router.get('/', isLoggedIn, asyncErrorHandler(getChats));

// show messages
router.get('/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), getPrice, asyncErrorHandler(getMessages));

// update read field
router.put('/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(updateMessages));

// send message
router.put('/:id/sendMessage', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(newMessage));

// update read field and go to deal
router.put('/:id/:dealid', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(updateMessagesDeal));

// create chat
router.post('/:id/createChat', isLoggedIn, checkId, hasCompleteProfile, asyncErrorHandler(newChat));

// create ongoing deal chat
router.put('/:id/:dealid/createOngoing', isLoggedIn, checkId, asyncErrorHandler(newOngoingChat));

// send message from deal
router.put('/:dealid/:id/sendMessageDeal', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(newMessageDeal));

// delete chat
router.delete('/:id/delete', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(destroyChat));

// email redirect link
router.get('/:id/emailRedirect', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(checkAndRedirect));

module.exports = router;
