/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');
var cfenv = require('cfenv');

var app = express();

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');

// all environments
app.enable('trust proxy');
// app.use (function (req, res, next) {
    // if (req.secure) {
            // request was via https, so do no special handling
            // next();
    // } else {
            // request was via http, so redirect to https
            // res.redirect('https://' + req.headers.host + req.url);
    // }
// });
function sslneed(req, res, next) {
if (req.headers && req.headers.$wssc === "80") {
return res.redirect('https://' + req.get('host') + req.url);
}
next();
}
app.use(sslneed);

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

app.get('/', routes.chat);
app.get('/lounge', routes.lounge);

// load local VCAP configuration
var vcapLocal = null
if (require('fs').existsSync('./vcap-local.json')) {
    try {
        vcapLocal = require("./vcap-local.json");
        console.log("Loaded local VCAP", vcapLocal);
    }
    catch (e) {
        console.error(e);
    }
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);
var appName;
if (appEnv.isLocal) {
    require('dotenv').load();
}

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});
