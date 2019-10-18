const userAccessor = require('../accessors/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.SECRET_KEY = 'secret';

class UserController {
    async register(req, res, next) {
        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            createAt: Date.now()
        };

        try {
            let user = await userAccessor.getByEmail(userData.email);

            if (!user) {
                // Hash password before saving to database
                let encrypted = await bcrypt.hash(userData.password, 10);
                userData.password = encrypted;
                let result = await userAccessor.insertUser(userData);
                return res.status(200).json({ message: result.email + ' successfully registered'});
            } else {
                return res.status(500).json({ message: 'Account has already existed' });
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async login(req, res, next) {
        try {
            let user = await userAccessor.getByEmail(req.body.email);

            if (user) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    const payload = { _id: user._id };

                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 1440
                    });
    
                    return res.status(200).send(token);
                } else {
                    res.status(500).json({ message: 'Wrong password'})
                }
            } else {
                return res.status(500).json({ message: 'Account does not exist'});
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async getProfile(req, res, next) {
        try {
            let decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
            let user = await userAccessor.getById(decoded._id);

            if (user)
                return res.status(200).json(user);
            else
                return res.status(500).json({ message: 'Account does not exist' });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new UserController();
