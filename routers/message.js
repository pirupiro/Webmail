const express = require('express');
const messController = require('../controllers/message');
let messRouter = express.Router();

messRouter.post('/send', messController.send);
messRouter.post('/reply', messController.reply);
messRouter.post('/drafts', messController.saveToDraft);
messRouter.put('/delete/:id&:name', messController.delete);
messRouter.delete('/delete/:id&:name', messController.deletePermanently);
messRouter.put('/read/:id', messController.markRead);
messRouter.put('/unread/:id', messController.markUnread);

module.exports = messRouter;
