const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        trim: true
    },
    birthday: Date,
    gender: String,
    phone: String,
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);
