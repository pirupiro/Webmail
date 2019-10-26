const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: ObjectId,
});

module.exports = mongoose.model('Folder', folderSchema);
