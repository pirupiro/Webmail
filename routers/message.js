const express = require('express');
const messController = require('../controllers/message');
let messRouter = express.Router();

messRouter.post('/send', messController.send);
messRouter.post('/reply', messController.reply);
messRouter.post('/drafts', messController.saveToDraft);

module.exports = messRouter;
