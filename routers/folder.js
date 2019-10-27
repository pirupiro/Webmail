const express = require('express');
const folderController = require('../controllers/folder');
const folderRouter = express.Router();

folderRouter.get('/inbox', folderController.findAllInboxConversations);
folderRouter.get('/sent', folderController.findAllSentConversations);
folderRouter.get('/trash', folderController.findAllTrashConversations);
folderRouter.get('/drafts', folderController.findAllDraftsMessages);
folderRouter.get('/spam', folderController.findAllSpamMessages);
folderRouter.get('/:name', folderController.findAllDefinedFolderConversations);
folderRouter.post('/:name', folderController.createFolder);
folderRouter.delete('/:name', folderController.deleteFolder);

module.exports = folderRouter;
