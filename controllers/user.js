const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userAccessor = require('../accessors/user');
const folderAccessor = require('../accessors/folder');
const convAccessor = require('../accessors/conversation');

class UserController {
    /*
    *   User Region
    */
    async register(req, res, next) {
        try {
            const userData = {
                email: req.body.email,
                password: req.body.password,
                name: req.body.name,
                birthday: req.body.birthday,
                gender: req.body.gender,
                phone: req.body.phone,
            };
            
            let queryUser = await userAccessor.findByEmail(userData.email);

            if (!queryUser) {
                // Hash password before saving to database
                let encrypted = await bcrypt.hash(userData.password, 10);
                userData.password = encrypted;
                let user = await userAccessor.insert(userData);
                await folderAccessor.insert(user._id, 'Inbox');
                await folderAccessor.insert(user._id, 'Sent');
                await folderAccessor.insert(user._id, 'Trash');
                let drafts = await folderAccessor.insert(user._id, 'Drafts');
                let spam = await folderAccessor.insert(user._id, 'Spam');

                const draftsConv = {
                    folders: [drafts._id]
                };

                const spamConv = {
                    folders: [spam._id]
                };

                await convAccessor.insert(draftsConv);
                await convAccessor.insert(spamConv);

                return res.status(200).json({
                    error: false,
                    message: user.email + ' successfully registered',
                    data: null
                });
            } else {
                return res.status(400).json({
                    error: true,
                    message: 'Account has already existed',
                    data: null
                });
            }
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async login(req, res, next) {
        try {
            let user = await userAccessor.findByEmail(req.body.email);

            if (user) {
                if (user.isBlocked) {
                    return res.status(403).json({
                        error: true,
                        message: 'Your account is blocked',
                        data: null
                    });
                } else if (bcrypt.compareSync(req.body.password, user.password)) {
                    const payload = {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        isAdmin: user.isAdmin
                    };

                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 1800
                    });

                    let folders = await folderAccessor.findAllByUserId(user._id);
    
                    return res.status(200).send({
                        error: false,
                        message: null,
                        data: {
                            token: token,
                            folders: folders
                        }
                    });
                } else {
                    return res.status(500).json({
                        error: true,
                        message: 'Wrong password',
                        data: null
                    });
                }
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Account does not exist',
                    data: null
                });
            }
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async viewProfile(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let userInfo = await userAccessor.findByEmail(user.email);
            let subset = ({ email, name, birthday, gender, phone }) => ({ email, name, birthday, gender, phone });

            if (userInfo) {
                return res.status(200).json({
                    error: false,
                    message: null,
                    data: subset(userInfo)
                });
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Account does not exist',
                    data: null
                });
            }
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    async changeProfile(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

            let userData = {
                name: req.body.name,
                birthday: req.body.birthday,
                gender: req.body.gender,
                phone: req.body.phone
            };

            if (req.body.changePassword) {
                if (req.body.newPassword == req.body.reNewPassword) {
                    userData.password = req.body.newPassword;
                } else {
                    return res.status(400).json({
                        error: true,
                        message: 'Password mismatch',
                        data: null
                    });
                }
            }

            let updatedUser = await userAccessor.updateByEmail(user.email, userData);
            let subset = ({ password, name, birthday, gender, phone}) => ({ password, name, birthday, gender, phone });

            if (updatedUser) {
                return res.status(200).json({
                    error: false,
                    message: 'Profile changed successfully',
                    data: subset(updatedUser)
                });
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Update failed',
                    data: null
                });
            }
        }
        catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            });
        }
    }

    /*
    *   Admin Region
    */
    async findAllUsers(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

            if (user.isAdmin) {
                let users = await userAccessor.findAll();

                return res.status(200).json({
                    error: false,
                    message: null,
                    data: users
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: 'You are not authorized to view this information',
                    data: null
                });
            }
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            }); 
        }
    }

    async blockOrUnblockUser(req, res, next) {
        try {
            let user = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

            if (user.isAdmin) {
                await userAccessor.block(req.body.email);

                return res.status(200).json({
                    error: false,
                    message: null,
                    data: null
                });
            } else {
                return res.status(401).json({
                    error: true,
                    message: 'You are not authorized to do this',
                    data: null
                });
            }
        } catch (err) {
            return res.status(500).json({
                error: true,
                message: err.message,
                data: null
            }); 
        }
    }
}

module.exports = new UserController();
