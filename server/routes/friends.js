// server/routes/friends.js
const express = require('express');
const { postFriend, getFriends } = require('../controllers/friendsController');
const router = express.Router();

router.post('/', postFriend);    // POST /friends   { email }
router.get('/',  getFriends);   // GET  /friends

module.exports = router;