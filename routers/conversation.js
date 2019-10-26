const express = require('express');
const convRouter = express.Router();
const convController = require('../controllers/conversation');

convRouter.get('/:id', convController.findAllMessages);

module.exports = convRouter;
