const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const port = process.env.PORT || 5000;
const userRouter = require('./routers/user');
const mongoURI = 'mongodb://localhost:27017/webmail';

app.use(bodyParser.json());
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connecting to '" + mongoose.connection.name + "' database..."))
    .catch(err => console.log(err));

app.use('/user', userRouter);

app.listen(port, () => {
    console.log('Listening on port ' + port + '...');
});
