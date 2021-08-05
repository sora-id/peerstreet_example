var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var sora_config = require('./sora-config.json');
const fetch = require('node-fetch');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);


var indexRouter = express.Router();
indexRouter.get('/login', async function(req, res, next) {
    res.render('index', {token: ""});
});

indexRouter.get('/verification', async function(req, res, next) {
    res.render('verification', {token: ""});
});

indexRouter.post('/login', async function(req, res, next) {
    let params = {};
    if (req.body.redirect_url) {
        params.redirect_url = req.body.redirect_url;
    }
    if (req.body.email) {
        params.auth_type = "email";
        params.email = req.body.email;
    } else if (req.body.phone) {
        params.auth_type = "sms";
        params.phone = req.body.phone;
    } else if (req.body.auth_type_email) {
        params.auth_type = "email";
    } else {
        params.auth_type = "sms";
    }
    let api_key = sora_config.sandbox_api_key;
    fetch("https://verify.soraid.com/v1/login_sessions", {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`
        }
    }).then(async response => {
        const login = await response.json();
        req.session.login_id = login.id;
        req.session.verification_id = undefined;
        res.render('index', {token: login.token});
    }).catch(error => {
        res.render('error', {error});
    });
});

indexRouter.post('/verification', async function(req, res, next) {
    let params = {
        verification_type: req.body.verification_type,
    };
    if (req.body.email) {
        params.auth_type = "email";
        params.email = req.body.email;
    } else if (req.body.phone) {
        params.auth_type = "sms";
        params.phone = req.body.phone;
    } else if (req.body.auth_type_email) {
        params.auth_type = "email";
    } else {
        params.auth_type = "sms";
    }
    if (req.body.login_id) {
        params.login_id = req.body.login_id;
    }
    if (req.body.redirect_url) {
        params.redirect_url = req.body.redirect_url;
    }
    let api_key = sora_config.sandbox_api_key;
    fetch("https://verify.soraid.com/v1/verification_sessions", {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`
        }
    }).then(async response => {
        const verification = await response.json();
        req.session.verification_id = verification.id;
        req.session.login_id = undefined;
        res.render('verification', {token: verification.token});
    }).catch(error => {
        res.render('error', {error});
    });
})

indexRouter.get('/verified', function(req, res, next) {
    let api_key = sora_config.sandbox_api_key;
    if (req.session.login_id) {
        fetch(`https://verify.soraid.com/v1/login_sessions/${req.session.login_id}`, {
            headers: {
                "Authorization": `Bearer ${api_key}`
            }
        }).then(async response => {
            const login = await response.json();
            console.log(login);
            if (login.authenticated || login.status == "success") {
                res.render('verified', {
                    login_status: login.status,
                    login: JSON.stringify(login, null, 1),
                });
            } else {
                res.render('error', {error: login.status});
            }
        });
    } else if (req.session.verification_id) {
        fetch(`https://verify.soraid.com/v1/verification_sessions/${req.session.verification_id}`, {
            headers: {
                "Authorization": `Bearer ${api_key}`
            }
        }).then(async response => {
            const verification = await response.json();
            console.log(verification);
            if (verification.authenticated || verification.status == "success") {
                res.render('verified', {
                    login_status: verification.status,
                    login: JSON.stringify(verification, null, 1),
                });
            } else {
                res.render('error', {error: verification.status});
            }
        });
    } else {
        return res.render('error', {error: "unknown"})
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    secret: 'R5PnD62f9hJU9hZb-4Mc2uE15gwlCvhEhXk9ICxG__0',

    // Cookie Options
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}))
app.use("/", express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
