const express = require('express');
const messController = require('../controllers/message');
let messRouter = express.Router();

messRouter.post('/send', messController.send);
messRouter.post('/reply', messController.reply);
messRouter.post('/drafts', messController.saveToDrafts);
messRouter.put('/delete', messController.delete);
messRouter.delete('/delete', messController.deletePermanently);
messRouter.put('/read', messController.markReadOrUnread);
messRouter.put('/unspam', messController.unmarkSpam);

module.exports = messRouter;
