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
        const userData = {
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            birthday: req.body.birthday,
            gender: req.body.gender,
            phone: req.body.phone,
        };

        try {
            let queryUser = await userAccessor.findByEmail(userData.email);

            if (!queryUser) {
                // Hash password before saving to database
                let encrypted = await bcrypt.hash(userData.password, 10);
                userData.password = encrypted;
                let user = await userAccessor.insert(userData);

                Promise
                .all([
                    folderAccessor.insert(user._id, 'Inbox'),
                    folderAccessor.insert(user._id, 'Sent'),
                    folderAccessor.insert(user._id, 'Drafts'),
                    folderAccessor.insert(user._id, 'Spam'),
                    folderAccessor.insert(user._id, 'Trash')
                ])
                .then(folders => {
                    const draftsConv = {
                        folders: [folders[2]._id]  // folders[2] is drafts folder
                    };
                    const spamConv = {
                        folders: [folders[3]._id]  // folders[3] is spam folder
                    }
                    convAccessor.insert(draftsConv);
                    convAccessor.insert(spamConv);
                    return res.status(200).json({
                        error: false,
                        message: user.email + ' successfully registered',
                        data: null
                    });
                })
                .catch(err => {
                    return res.status(500).json({
                        error: true,
                        message: err.message,
                        data: null
                    });
                })
            } else {
                return res.status(500).json({
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
                        isAdmin: user.isAdmin
                    };

                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 1800
                    });
    
                    return res.status(200).send({
                        error: false,
                        message: null,
                        data: token
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
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let user = await userAccessor.findById(decoded._id);
            let subset = ({ email, name, birthday, gender, phone }) => ({ email, name, birthday, gender, phone });

            if (user)
                return res.status(200).json({
                    error: false,
                    message: null,
                    data: subset(user)
                });
            else
                return res.status(500).json({
                    error: true,
                    message: 'Account does not exist',
                    data: null
                });
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
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

            let userData = {
                name: req.body.name,
                birthday: req.body.birthday,
                gender: req.body.gender,
                phone: req.body.phone
            };

            if (req.body.changePassword) {
                userData.password = req.body.newPassword;
            }

            let user = await userAccessor.updateById(decoded._id, userData);
            let subset = ({ email, password, name, birthday, gender, phone}) => ({ email, password, name, birthday, gender, phone });

            if (user)
                return res.status(200).json({
                    error: false,
                    message: 'Profile changed successfully',
                    data: subset(user)
                });
            else
                return res.status(500).json({
                    error: true,
                    message: 'Update failed',
                    data: null
                });
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
    async findAllUser() {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            
            if (decoded.isAdmin) {
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

    async viewUserProfile() {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            
            if (decoded.isAdmin) {
                let user = await userAccessor.findById(req.params.id);
                return res.status(200).json({
                    error: false,
                    message: null,
                    data: user
                })
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

    async blockUser() {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

            if (decoded.isAdmin) {
                userAccessor.block(req.params.id);
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
