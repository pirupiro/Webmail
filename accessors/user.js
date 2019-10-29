const userModel = require('../models/user');

class UserAccessor {
    findByEmail(email) {
        return userModel.findOne({ email: email });
    }

    findById(id) {
        return userModel.findById(id);
    }

    findAllByIds(ids) {
        return userModel.find({
            _id: {
                $in: ids
            }
        });
    }

    findAllByEmails(emails) {
        return userModel.find({
            email: {
                $in: emails
            }
        });
    }

    findAll() {
        return userModel.find({
            isAdmin: false
        });
    }

    insert(user) {
        return userModel.create(user);
    }

    updateByEmail(email, user) {
        // return userModel.findByIdAndUpdate(id, user, { new: true });
        return userModel.updateOne({
            email: email
        }, user, {
            new: true
        });
    }

    block(email) {
        return userModel.updateOne({
            email: email
        }, {
            isBlocked: !isBlocked
        });
    }
}

module.exports = new UserAccessor();
