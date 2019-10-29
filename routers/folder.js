const express = require('express');
const folderController = require('../controllers/folder');
const folderRouter = express.Router();

folderRouter.get('/inbox', folderController.findAllConversations);
folderRouter.get('/sent', folderController.findAllConversations);
folderRouter.get('/trash', folderController.findAllConversations);
folderRouter.get('/drafts', folderController.findAllMessages);
folderRouter.get('/spam', folderController.findAllMessages);
folderRouter.get('/defined', folderController.findAllConversations);
folderRouter.post('/', folderController.createFolder);
folderRouter.delete('/', folderController.deleteFolder);

module.exports = folderRouter;
