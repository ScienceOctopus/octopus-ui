require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const path = require('path');

const config = require('./lib/config');
const hbsHelpers = require('./lib/hbsHelpers');

function startApp() {
  const app = express();
  const partialsPath = path.join(__dirname, 'views/partials');

  app.disable('x-powered-by');

  hbs.registerPartials(partialsPath);
  hbs.registerHelper('json', hbsHelpers.json);
  hbs.registerHelper('roundNumber', hbsHelpers.roundNumber);
  hbs.registerHelper('markHits', hbsHelpers.markHits);
  hbs.registerHelper('formatDate', hbsHelpers.formatDate);
  hbs.registerHelper('equals', hbsHelpers.equals);
  hbs.registerHelper('contains', hbsHelpers.contains);
  hbs.registerHelper('startsWith', hbsHelpers.startsWith);
  hbs.registerHelper('endsWith', hbsHelpers.endsWith);

  // eslint-disable-next-line no-underscore-dangle
  app.engine('hbs', hbs.__express);
  app.set('view engine', 'hbs');

  /* eslint-disable global-require */
  app.use('/public', express.static('public'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(session(config.sessionConfig));

  app.use('/', require('./routes/middleware'));

  app.get('/', (req, res) => res.render('home', res.locals));
  app.get('/about', (req, res) => res.render('about', res.locals));
  app.get('/faq', (req, res) => res.render('faq', res.locals));

  app.get('/publish', require('./routes/publish/main'));
  app.post('/publish/step/:stepNumber', require('./routes/publish/steps/dispatch'));
  app.post('/publish/save', require('./routes/publish/steps/save'));

  app.get('/publications/search', require('./routes/publications/search'));
  app.get('/publications/view/:publicationID', require('./routes/publications/view'));

  app.get('/users/:userID', require('./routes/users/view'));
  /* eslint-enable global-require */

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
