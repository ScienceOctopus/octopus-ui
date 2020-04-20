const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

const sortPublications = (query, titleA, titleB) => {
  switch (query.sort) {
    case 'name-desc': return titleB.localeCompare(titleA);
    case 'name-asc':
    default: return titleA.localeCompare(titleB);
  }
};

module.exports = (req, res) => {
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const query = {
    phrase: _.get(req, 'query.phrase'),
    parentProblem: _.get(req, 'query.parentProblem'),
    type: _.get(req, 'query.type'),
    date: _.get(req, 'query.date'),
    sort: _.get(req, 'query.sort'),
  };

  debug('octopus:ui:debug')(`Searching for Publications. Query: "${query.phrase || ''}"`);

  return api.findPublications(query, async (publicationsErr, pubData) => {
    const data = pubData;

    res.locals.query = query;

    let results = data ? data.results || [] : [];

    // Augment the publications with red flags
    results = await Promise.all(results.map((publication) => new Promise((resolve) => {
      const { _id: publicationID } = publication;
      api.findResolutions({ publicationID }, (_resolutionErr, resolutionsData) => resolve({ ...publication, resolutions: resolutionsData }));
    })));

    // Augment the publications with the author data
    results = await Promise.all(results.map((publication) => new Promise((resolve) => {
      if (!publication.collaborators) {
        return resolve(publication);
      }

      // let authors = _.filter(publication.collaborators, { status: 'CONFIRMED' });
      let authors = _.filter(publication.collaborators);

      return (async () => {
        authors = await Promise.all(authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)));
        // Filter our undefined entries
        authors = authors.filter((author) => author);

        return resolve({ ...publication, authors });
      })();
    })));

    // Sort
    if (query.sort) {
      results = results.sort((a, b) => {
        const { title: titleA, dateCreated: dateCreatedA } = a;
        const { title: titleB, dateCreated: dateCreatedB } = b;

        switch (query.sort) {
          case 'name-asc': return titleA.localeCompare(titleB);
          case 'name-desc': return titleB.localeCompare(titleA);
          case 'date-asc': return new Date(dateCreatedB) - new Date(dateCreatedA);
          case 'date-desc':
          default: return new Date(dateCreatedA) - new Date(dateCreatedB);
        }
      });
    }

    // Date filter
    if (query.date) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const numOfDaysThisMonth = new Date(currentYear, currentMonth, 0).getDate();

      results = results.filter((result) => {
        const dateCreated = new Date(result.dateCreated);
        const msDifference = currentDate - dateCreated;
        const daysDifference = msDifference / 1000 / 60 / 60 / 24;
        const monthsDifference = Math.round(daysDifference / numOfDaysThisMonth);

        switch (query.date) {
          case 'now-3m': return monthsDifference < 3;
          case 'now-1m': return monthsDifference < 1;
          case 'all':
          default: return true;
        }
      });
    }

    res.locals.publications = {
      totalCount: data && data.total ? data.total : 0,
      displayedCount: data && data.results ? data.results.length : 0,
      results,
    };
    res.locals.customTitleTag = 'Publication Search';

    return res.render('publications/search', res.locals);
  });
};
