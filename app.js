const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session);

const url =
    process.env.DATABASEURL || 'mongodb://localhost/RikkiLocalStratergy';
mongoose.connect(url);

const db = mongoose.connection;

app.use(
    session({
        secret: 'Minimlaborumeulaboreexcepteurquisnostrud',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            mongooseConnection: db
        })
    })
);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
let isLoggedIn = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.redirect('./register');
    }
};

let UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    eth_address: {
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
UserSchema.methods.ethAddressAuthenticate = (eth_address,signature,nonce, callback) => {
    User.findOne({eth_address}).exec((err, user)=>{
        if (err) {
            return callback(err);
        } else if (!user) {
            var err = new Error('User not found.');
            err.status = 401;
            return callback(err);
        }
    })
}
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

app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile');
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res, next) => {
    if (req.body.email && req.body.password) {
        var userData = {
            email: req.body.email,
            eth_address: req.body.eth_address,
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
    } else if (req.body.eth_address) {
        User.authenticate(req.body.email, req.body.password, function(
            error,
            user
        ) {
            if (error || !user) {
                var err = new Error('Wrong email or password.');
                err.status = 401;
                return next(err);
            } else {
                req.session.userId = user._id;
                return res.redirect('/profile');
            }
        });
    } else {
        var err = new Error('All fields required.');
        err.status = 400;
        return next(err);
    }
});

app.get('/logout', function(req, res, next) {
    if (req.session) {
        // delete session object
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});
app.listen(process.env.PORT || 4000);
