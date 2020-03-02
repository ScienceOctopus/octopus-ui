require('dotenv').config();

const express = require('express');
const flash = require('express-flash');
const hbs = require('hbs');
const path = require('path');

const config = require('./lib/config');
const hbsHelpers = require('./lib/hbsHelpers');
const sessionMiddleware = require('./lib/session');

function startApp() {
  const app = express();
  const partialsPath = path.join(__dirname, 'views/partials');

  app.disable('x-powered-by');

  /*
   * Handlebars helpers
   */
  hbs.registerPartials(partialsPath);
  hbs.registerHelper('json', hbsHelpers.json);
  hbs.registerHelper('toString', hbsHelpers.toString);
  hbs.registerHelper('roundNumber', hbsHelpers.roundNumber);
  hbs.registerHelper('markHits', hbsHelpers.markHits);
  hbs.registerHelper('formatDate', hbsHelpers.formatDate);
  hbs.registerHelper('equals', hbsHelpers.equals);
  hbs.registerHelper('contains', hbsHelpers.contains);
  hbs.registerHelper('startsWith', hbsHelpers.startsWith);
  hbs.registerHelper('endsWith', hbsHelpers.endsWith);
  hbs.registerHelper('select', hbsHelpers.select);
  hbs.registerHelper('radio', hbsHelpers.radio);
  hbs.registerHelper('times', hbsHelpers.times);
  hbs.registerHelper('math', hbsHelpers.math);
  hbs.registerHelper('get', hbsHelpers.get);
  hbs.registerHelper('checkRating', hbsHelpers.checkRating);
  hbs.registerHelper('publicationTypesOptions', hbsHelpers.publicationTypesOptions);
  hbs.registerHelper('findItemByKey', hbsHelpers.findItemByKey);

  // eslint-disable-next-line no-underscore-dangle
  app.engine('hbs', hbs.__express);
  app.set('view engine', 'hbs');

  /* eslint-disable global-require */
  app.use('/public', express.static('public'));

  app.use(sessionMiddleware);
  app.use(flash());

  app.use('/', require('./routes/middleware'));

  app.get('/', (req, res) => res.render('home', res.locals));
  app.get('/about', (req, res) => res.render('about', res.locals));
  app.get('/faq', (req, res) => res.render('faq', res.locals));

  app.get('/publish', require('./routes/publish/main'));
  app.post('/publish/step/:stepNumber', require('./routes/publish/steps/dispatch'));
  app.post('/publish/create', require('./routes/publish/steps/create'));

  app.get('/publications/search', require('./routes/publications/search'));
  app.get('/publications/view/:publicationID', require('./routes/publications/view'));
  app.get('/publications/download-pdf/:publicationID', require('./routes/publications/downloadPDF'));
  app.get('/publications/edit/:publicationID', require('./routes/publications/edit'));
  app.post('/publications/save/:publicationID', require('./routes/publications/save'));
  app.get('/publications/archive/:publicationID', require('./routes/publications/archive'));
  app.post('/publications/publish/:publicationID', require('./routes/publications/publish'));
  app.post('/publications/rate/:publicationID', require('./routes/publications/rate'));

  app.post('/related-publications/:publicationID', require('./routes/relatedPublications/add'));
  app.post('/related-publications/rate/:publicationID/:relatedPublicationID/:rating', require('./routes/relatedPublications/rate'));

  app.post('/red-flag-publication/:publicationID', require('./routes/redFlagPublication/add'));
  app.post('/red-flag-publication/addComment/:resolutionID', require('./routes/redFlagPublication/addComment'));
  app.post('/red-flag-publication/resolve/:resolutionID', require('./routes/redFlagPublication/resolve'));

  app.get('/resolution-center/:resolutionID', require('./routes/resolutionCenter/view'));

  app.get('/users/view/:orcid', require('./routes/users/view'));
  app.get('/users/search', require('./routes/users/search'));

  app.get('/auth/orcid/logout', require('./routes/auth/orcid/logout'));

  app.use('/auth/orcid', require('./routes/auth/orcid/middleware'));
  app.get('/auth/orcid/login', require('./routes/auth/orcid/login'));
  app.get('/auth/orcid/verify', require('./routes/auth/orcid/verify'));

  if (config.enableDebugMode) {
    app.get('/debug', (req, res) => {
      const debugData = {
        session: req.session,
      };
      return res.json(debugData);
    });
  }
  /* eslint-enable global-require */

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.sendStatus(500);
  });

  app.use((req, res) => {
    return res.sendStatus(404);
  });

  app.listen(config.appPort, () => {
    console.log(`Science Octopus UI is running on port ${config.appPort}.`);
  });

  return app;
}

startApp();
