const express = require('express');
const userRouter = express.Router();
const userController = require('../controllers/user');

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/profile', userController.getProfile);

module.exports = userRouter;
