const express = require('express');

const router = express.Router();

const { getChats, getMessages, newMessage, newChat, updateMessages, newOngoingChat, newMessageDeal, updateMessagesDeal,
        destroyChat } = require('../controllers/messages');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile, checkIfBelongsChat, checkId } = middleware; // destructuring assignment

// show all chats
router.get('/', isLoggedIn, asyncErrorHandler(getChats));

// show messages
router.get('/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(getMessages));

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

module.exports = router;
