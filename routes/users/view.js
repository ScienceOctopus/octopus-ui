const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const orcid = require('../../lib/orcid');

// Fetch user educations from orcid
const getUserEducations = (orcidId, accessToken) => new Promise((resolve) => {
  return orcid.getPersonEducations(orcidId, accessToken, (educationsErr, educations) => {
    const allEducations = [];
    const affiliations = _.get(educations, 'affiliation-group') || [];

    // Extract specific data from orcid
    affiliations.forEach((affiliation) => {
      const summaries = affiliation.summaries;

      summaries.forEach((summary) => {
        const educationSummary = summary['education-summary'];
        const organizationName = _.get(educationSummary, 'organization.name');
        const roleTitle = _.get(educationSummary, 'role-title');
        const educationsGroup = { organizationName, roleTitle };

        allEducations.push(educationsGroup);
      });
    });

    // Return it
    resolve(allEducations);
  });
});

// Fetch user employments from orcid
const getUserEmployments = (orcidId, accessToken) => new Promise((resolve) => {
  return orcid.getPersonEmployments(
    orcidId,
    accessToken,
    (employmentsErr, employments) => {
      const currentEmploymentArr = [];
      const pastEmployments = [];
      const affiliations = _.get(employments, 'affiliation-group') || [];

      // Extract specific data from orcid
      affiliations.forEach((affiliation, index) => {
        const summaries = affiliation.summaries;

        summaries.forEach((summary) => {
          const employmentSummary = summary['employment-summary'];
          const organizationName = _.get(employmentSummary, 'organization.name');
          const roleTitle = _.get(employmentSummary, 'role-title');
          const employmentsGroup = { organizationName, roleTitle };

          if (index === 0) {
            currentEmploymentArr.push(employmentsGroup);
          } else {
            pastEmployments.push(employmentsGroup);
          }
        });
      });

      const currentEmployment = currentEmploymentArr[0];
      const allEmployments = { currentEmployment, pastEmployments };

      // Return it
      resolve(allEmployments);
    },
  );
});

// Fetch user works from orcid
const getUserWorks = (orcidId, accessToken) => new Promise((resolve) => {
  orcid.getPersonWorks(orcidId, accessToken, (worksErr, works) => {
    const allWorks = [];
    const workGroups = _.get(works, 'group') || [];

    workGroups.forEach((work) => {
      const summaries = work['work-summary'];

      if (summaries) {
        // Extract specific data from orcid
        summaries.forEach((summary) => {
          const { title, type } = summary;
          const externalId = _.get(summary, 'external-ids.external-id[0]');
          const journalTitle = _.get(summary, 'journal-title.value');
          const createdAt = _.get(summary, 'created-date.value'); // Timestamp format
          const url = externalId && externalId['external-id-url']
            ? externalId['external-id-url'].value
            : null;

          // Transform timestamp into ISO String
          const date = new Date(createdAt);
          // Day part from the date
          const day = date.getDate();
          // Month part from the date
          const month = date.getMonth() + 1;
          // Year part from the date
          const year = date.getFullYear();

          const createdDate = `${year}-${month}-${day}`;

          const workData = {
            title: title && title.title ? title.title.value : '',
            journalTitle,
            type,
            createdDate,
            url,
          };

          allWorks.push(workData);
        });
      }
    });

    // Return it
    resolve(allWorks);
  });
});

// Fetch user given-name and family-name from orcid
const getUserFullName = (orcidId, accessToken) => new Promise((resolve) => {
  return orcid.getPersonDetails(
    orcidId,
    accessToken,
    (personDetailsErr, personDetails) => {
      if (personDetails) {
        // Combine given and family names into fullName
        const givenName = personDetails.name['given-names'];
        const familyName = personDetails.name['family-name'];
        const fullName = `${
          givenName && givenName.value ? givenName.value : ''
        } ${familyName && familyName.value ? familyName.value : ''}`;

        // Return it
        resolve(fullName);
      }
      resolve('');
    },
  );
});

// Fetch user's publications by orcidId from database
const getUserPublications = (orcidId) => new Promise((resolve) => {
  const query = {
    createdByUser: orcidId,
  };

  return api.findPublications(query, (publicationsErr, publications) => {
    const allPublications = [];
    const userPublications = publications.results;

    // transform "2019-11-13 00:00:00" to "2019-11-13"
    userPublications.forEach((publication) => {
      const pub = publication;
      const { dateCreated } = pub;
      const splittedDate = dateCreated.split(' ')[0];

      pub.createdDate = splittedDate;

      allPublications.push(pub);
    });

    resolve(allPublications);
  });
});

// count publications by publication types from DB
const countPublicationsByType = (publications, publicationTypes) => new Promise((resolve) => {
  const countedPublicationsByType = {};

  publicationTypes.forEach((publicationType) => {
    const { title } = publicationType;
    let counter = 0;

    publications.forEach((publication) => {
      if (publication.type === publicationType.key) counter += 1;
    });

    countedPublicationsByType[title] = counter;
  });

  const types = Object.keys(countedPublicationsByType);
  const counters = Object.values(countedPublicationsByType);
  const data = { types, counters };

  resolve(data);
});

module.exports = async (req, res) => {
  const orcidId = req.params.orcid;
  const { publicationTypes } = res.locals;

  const accessToken = _.get(req, 'session.authOrcid.accessToken');

  debug('octopus:ui:debug')(`Showing User Profile: ${orcidId}`);

  // Fetch all data for user profile page
  const [
    userWorks,
    userEducations,
    userEmployments,
    userFullName,
    userPublications,
  ] = await Promise.all([
    getUserWorks(orcidId, accessToken),
    getUserEducations(orcidId, accessToken),
    getUserEmployments(orcidId, accessToken),
    getUserFullName(orcidId, accessToken),
    getUserPublications(orcidId),
  ]);

  const orcidUserData = {
    userWorks,
    userEducations,
    userEmployments,
    userFullName,
  };

  const pubsCountedByType = await countPublicationsByType(
    userPublications,
    publicationTypes,
  );

  res.locals.publications = userPublications;
  res.locals.pubsCountedByType = pubsCountedByType;
  res.locals.customTitleTag = userFullName;

  return api.getUserByORCiD(orcidId, (userErr, userData) => {
    res.locals.person = { userData, orcidUserData, orcidId };

    // debug('octopus:ui:trace')(res.locals);
    return res.render('users/view', res.locals);
  });
};
