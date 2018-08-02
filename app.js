const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    bcrypt = require('bcrypt');
const url =
    process.env.DATABASEURL || 'mongodb://localhost/RikkiLocalStratergy';
mongoose.connect(url);
app.use(
    require('express-session')({
        secret: 'Minimlaborumeulaboreexcepteurquisnostrud',
        resave: false,
        saveUninitialized: false
    })
);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
let isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/register');
};

let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});
UserSchema.pre('save', function(next) {
    var user = this;
    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});
let User = mongoose.model('User', UserSchema);

app.get('/', (req, res) => {
    User.findById(req.session.userId).exec(function(error, user) {
        if (error) {
            return next(error);
        } else {
            if (user === null) {
                var err = new Error('Not authorized! Go back!');
                err.status = 400;
                return res.redirect('/register');
            } else {
                return res.redirect('/profile');
            }
        }
    });

});

app.get('/profile', (req,res)=>{
    res.render('profile');
})
app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res, next) => {
    if (req.body.email && req.body.username && req.body.password) {
        var userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password
        };
        //use schema.create to insert data into the db
        User.create(userData, function(err, user) {
            if (err) {
                return next(err);
            } else {
                req.session.userId = user._id;
                return res.redirect('/');
            }
        });
    }
});

app.post('/login', (req, res, next) => {
    UserSchema.statics.authenticate = (email, password, callback) => {
        User.findOne({ email }).exec((err, user) => {
            if (err) {
                return callback(err);
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                return callback(err);
            }
            bcrypt.compare(password, user.password, function(err, result) {
                if (result === true) {
                    return callback(null, user);
                } else {
                    return callback();
                }
            });
        });
    };
});

app.listen(process.env.PORT || 4000);
