const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

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
    createdAt: {
        type: Date,
        default: Date.now
    },
    isBlocked: Boolean,
});

module.exports = mongoose.model('User', userSchema);
