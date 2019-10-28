const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config');

const mongoUrl = config.mongoUrl;
const mongoDbName = config.mongoDbName;

const sessionStore = (!mongoUrl || !mongoDbName) ? undefined : new MongoStore({
  url: `${mongoUrl}/${mongoDbName}`,
  ttl: 7 * 24 * 60 * 60, // 7 days
});

const sessionMiddleware = session({
  name: 'OctopusSessionID',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
});

module.exports = sessionMiddleware;
