const express = require('express');
const folderController = require('../controllers/folder');
const folderRouter = express.Router();

folderRouter.get('/inbox', folderController.findAllInboxConversations);
folderRouter.get('/sent', folderController.findAllSentConversations);
folderRouter.get('/drafts', folderController.findAllDraftMessages);
folderRouter.get('/spam', folderController.findAllSpamMessages);
folderRouter.get('/trash', folderController.findAllTrashConversations);
folderRouter.get('/defined/:name', folderController.findAllDefinedFolderConversations);
folderRouter.post('/', folderController.createFolder);
folderRouter.delete('/', folderController.deleteFolder);

module.exports = folderRouter;
