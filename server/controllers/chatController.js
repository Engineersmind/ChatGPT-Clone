const Chat = require('../models/Chat');
const User = require('../models/User');

exports.getChats = async (req, res) => {         

  res.json({ message: 'TODO: Fetch all chats for the logged-in user' });
};


exports.createChat = async (req, res) => {

  res.status(201).json({ message: 'TODO: Create a new chat' });
};