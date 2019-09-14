require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
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
  hbs.registerHelper('isEqual', hbsHelpers.isEqual);

  // eslint-disable-next-line no-underscore-dangle
  app.engine('hbs', hbs.__express);
  app.set('view engine', 'hbs');


  /* eslint-disable global-require */
  app.use('/public', express.static('public'));

  app.use(bodyParser.json());

  app.use('/', require('./routes/middleware'));

  app.get('/', (req, res) => res.render('home', res.locals));
  app.get('/about', (req, res) => res.render('about', res.locals));
  app.get('/faq', (req, res) => res.render('faq', res.locals));
  app.get('/publish', (req, res) => res.render('publish', res.locals));

  app.get('/publications/search', require('./routes/publications/search'));
  app.get('/publications/view/:publicationID', require('./routes/publications/view'));

  app.get('/users/:id', require('./routes/users/view'));
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
