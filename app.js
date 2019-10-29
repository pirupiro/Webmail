// Essential modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');

// Routers
const userRouter = require('./routers/user');
const folderRouter = require('./routers/folder');
const convRouter = require('../routers/conversation');
const messRouter = require('./routers/message');

// Assignments
const mongoURI = 'mongodb://localhost:27017/webmail';
const port = process.env.PORT || 5000;
process.env.SECRET_KEY = 'secret';

app.use(bodyParser.json());
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

mongoose
.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connecting to '" + mongoose.connection.name + "' database..."))
.catch(err => console.log(err));

app.use('/users', userRouter);
app.use('/folders', folderRouter);
app.use('/conversations', convRouter)
app.use('/messages', messRouter);

app.listen(port, () => {
    console.log('Listening on port ' + port + '...');
});
