const express = require('express');
const router = express.Router();
const { getChats, createChat } = require('../controllers/chatController');



router.route('/').get(getChats).post(createChat);

module.exports = router;