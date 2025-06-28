// server/controllers/friendsController.js
const { addFriend, listFriends } = require('../services/friendsService');

exports.postFriend = async (req, res, next) => {
  const userId = req.user.id;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Missing friend email' });
  }
  try {
    const friendUid = await addFriend(userId, email);
    res.json({ success: true, friendUid });
  } catch (err) {
    console.error('addFriend error', err);
    next(err);
  }
};

exports.getFriends = async (req, res, next) => {
  try {
    const friends = await listFriends(req.user.id);
    res.json({ success: true, friends });
  } catch (err) {
    console.error('listFriends error', err);
    next(err);
  }
};