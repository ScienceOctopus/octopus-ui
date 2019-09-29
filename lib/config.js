const appPortRaw = process.env.PORT;
const appPortParsed = parseInt(appPortRaw, 10);
// eslint-disable-next-line eqeqeq
const appPort = (appPortRaw == appPortParsed) ? appPortParsed : 3000;

const baseUrl = process.env.BASE_URL || `http://localhost:${appPort}`;
const apiUrl = process.env.API_URL || 'http://localhost:4000';

const apiAuthKey = process.env.API_AUTH_KEY;
const apiAuthSecret = process.env.API_AUTH_SECRET;

const sessionSecret = process.env.SESSION_SECRET || 'Please set a secret.';

const orcidClientId = process.env.ORCID_CLIENT_ID;
const orcidClientSecret = process.env.ORCID_CLIENT_SECRET;

const enableDebugMode = process.env.DEBUG_MODE === 'true';

const config = {
  baseUrl,
  appPort,
  apiUrl,
  apiAuthKey,
  apiAuthSecret,
  orcidClientId,
  orcidClientSecret,
  enableDebugMode,
  maxFileSizeMB: 100,
  sessionConfig: {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    name: 'OctopusSessionID',
  },
};

module.exports = config;
