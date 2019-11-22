const express = require('express');
const messController = require('../controllers/message');
let messRouter = express.Router();

messRouter.post('/send', messController.send);
messRouter.post('/reply', messController.reply);
messRouter.post('/drafts', messController.saveToDrafts);
messRouter.put('/delete', messController.delete);
messRouter.delete('/delete', messController.deletePermanently);
messRouter.put('/read', messController.markRead);
messRouter.put('/unread', messController.markUnread);
messRouter.put('/unspam', messController.unmarkSpam);

module.exports = messRouter;
