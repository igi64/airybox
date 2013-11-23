var express = require('express'),
		routes = require('./routes'),
		user = require('./routes/user'),
		http = require('http'),
		https = require('https'),
		path = require('path'),
		fs = require('fs')/*,
		passport = require('passport'),
		GoogleStrategy = require('passport-google-oauth').OAuth2Strategy*/;

/*var GOOGLE_CLIENT_ID = "XXXXXXXXXXXX.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET = "none";

var GOOGLE_DRIVE_ABOUT_API_URL = 'https://www.googleapis.com/drive/v2/about';
var GOOGLE_OAUTH2_USERINFO_API_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

var GOOGLE_DRIVE_ABOUT = 'driveabout';
var GOOGLE_OAUTH2_USERINFO = 'userinfo';*/

var DOMAIN_NAME_AIRYBOX = 'localhost.localdomain'; // airybox.org
var HTML_TITLE_AIRYBOX = 'AiryBox';

var ssl_key = fs.readFileSync('keys/ssl.key');
var ssl_cert = fs.readFileSync('keys/ssl.crt');
var ssl_ca = fs.readFileSync('keys/signing-ca-1.crt');

var options = {
	key: ssl_key,
	cert: ssl_cert,
	ca: ssl_ca
};

/*passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
			clientID: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			callbackURL: 'https://' + DOMAIN_NAME_AIRYBOX + '/auth/google/callback'
		},
		function(accessToken, refreshToken, profile, done) {
			// asynchronous verification, for effect...
			process.nextTick(function () {

				// To keep the example simple, the user's Google profile is returned to
				// represent the logged-in user.  In a typical application, you would want
				// to associate the Google account with a user record in your database,
				// and return that user instead.
				return done(null, profile);
			});
		}
));*/

var MemoryStore = express.session.MemoryStore;

var app = express();
var apps = express();

app.configure(function() {
	app.set('port', process.env.PORT || 80);
	app.use(express.favicon(__dirname + '/public/favicon.ico'));
	app.use(app.router);
});

apps.configure(function() {
	apps.set('port', process.env.PORT || 443);
	apps.set('views', __dirname + '/views');
	apps.set('view engine', 'ejs');
	apps.use(express.favicon(__dirname + '/public/favicon.ico'));
	apps.use(express.logger('dev'));
	apps.use(express.bodyParser());
	apps.use(express.methodOverride());
	apps.use(express.cookieParser('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'));
	apps.use(express.session({
		store: new MemoryStore(),
		secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		key: 'session-key-x',
		cookie: { secure: true }
	}));
	// Initialize Passport!  Also use passport.session() middleware, to support
	// persistent login sessions (recommended).
	/*apps.use(passport.initialize());*/
	//apps.use(passport.session());
	apps.use(apps.router);
	apps.use(express.static(path.join(__dirname, 'public')));
});

// set up a route to redirect http to https
// http://en.wikipedia.org/wiki/HTTP_cookie#Secure_and_HttpOnly
// cookie: { secure: true }
app.get('*',function(req, res) {
	res.redirect('https://' + DOMAIN_NAME_AIRYBOX + req.url)
})

app.configure('development', function() {
	app.use(express.errorHandler());
});

apps.configure('development', function() {
	apps.use(express.errorHandler());
});

apps.get('/', function(req, res) {
	res.render('index', { user: req.session.email, title: HTML_TITLE_AIRYBOX});
});

apps.get('/users', user.list);

apps.post('/login', function(req, res) {
	//var self = passport;
	var accessToken = req.body.access_token;
	var api_param = req.param("api");
	var google_api = GOOGLE_OAUTH2_USERINFO; // default

	if (api_param == GOOGLE_DRIVE_ABOUT) {
		google_api = GOOGLE_DRIVE_ABOUT_API_URL;
	} else {
		google_api = GOOGLE_OAUTH2_USERINFO_API_URL;
	}

	return passport._strategies.google.userProfile(google_api, accessToken, function(err, profile) {
		if (err) {
			//return self.error(err);
			if (err.name && err.message) {
				res.send('{"error":"'.concat(err.name, ': ', err.message, '"}'));
			} else {
				res.send('{"error":"OAuth error."}');
			}
		} else {
			if (profile.emails[0].value) {
				req.session.email = profile.emails[0].value;
				res.send('{"identity_email":"'.concat(profile.emails[0].value, '"}'));
			} else {
				if (profile._json && profile._json.permissionId) {
					var email_mockup;

					email_mockup = profile._json.permissionId + '@' + 'drive.google.com';

					req.session.email = email_mockup;
					res.send('{"identity_email":"'.concat(email_mockup,
							'", "permission_id":"'.concat(profile._json.permissionId,
									'", "display_name":"'.concat(profile._json.name, '"}'))));
				} else {
					res.send('{"error":"Unauthenticated identity."}');
				}
			}
		};
	});
});

apps.get('/logout', function(req, res) {
	req.logout();
	req.session.email = '';
	//res.redirect('/');
	res.send('{"ok":"Unauthenticated identity."}');
});

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

https.createServer(options, apps).listen(apps.get('port'), function(){
	console.log("Express server listening on port " + apps.get('port'));
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/');
}
