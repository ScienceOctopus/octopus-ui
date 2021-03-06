const appPortRaw = process.env.PORT;
const appPortParsed = parseInt(appPortRaw, 10);
// eslint-disable-next-line eqeqeq
const appPort = (appPortRaw == appPortParsed) ? appPortParsed : 3000;

const baseUrl = process.env.BASE_URL || `http://localhost:${appPort}`;
const apiUrl = process.env.API_URL || 'http://localhost:4000';

const apiAuthKey = process.env.API_AUTH_KEY;
const apiAuthSecret = process.env.API_AUTH_SECRET;

const orcidClientId = process.env.ORCID_CLIENT_ID;
const orcidClientSecret = process.env.ORCID_CLIENT_SECRET;

const enableDebugMode = process.env.DEBUG_MODE === 'true';
const useAdminAccount = process.env.USE_ADMIN_ACCOUNT === 'true';

const sessionSecret = process.env.SESSION_SECRET || 'Please set a secret.';
const mongoUrl = process.env.MONGO_URL;
const mongoDbName = process.env.MONGO_DBNAME;

const config = {
  baseUrl,
  appPort,
  apiUrl,
  apiAuthKey,
  apiAuthSecret,
  orcidClientId,
  orcidClientSecret,
  enableDebugMode,
  useAdminAccount,
  maxFileSizeMB: 100,
  sessionSecret,
  mongoUrl,
  mongoDbName,
};

module.exports = config;
