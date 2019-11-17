const debug = require('debug');

const api = require('../../lib/api');
const orcid = require('../../lib/orcid');

// Fetch user educations from orcid
const getUserEducations = (orcidId) => new Promise((resolve) => {
  return orcid.getPersonEducations(orcidId, (educationsErr, educations) => {
    const allEducations = [];

    // Extract specific data from orcid
    if (educations && educations['affiliation-group']) {
      educations['affiliation-group'].forEach((affiliation) => {
        const summaries = affiliation.summaries;

        summaries.forEach((summary) => {
          const educationSummary = summary['education-summary'];
          const organizationName = educationSummary.organization.name;
          const roleTitle = educationSummary['role-title'];
          const educationsGroup = { organizationName, roleTitle };

          allEducations.push(educationsGroup);
        });
      });
    }

    // Return it
    resolve(allEducations);
  });
});

// Fetch user employments from orcid
const getUserEmployments = (orcidId) => new Promise((resolve) => {
  return orcid.getPersonEmployments(
    orcidId,
    (employmentsErr, employments) => {
      const allEmployments = [];

      // Extract specific data from orcid
      if (employments && employments['affiliation-group']) {
        employments['affiliation-group'].forEach((affiliation) => {
          const summaries = affiliation.summaries;

          summaries.forEach((summary) => {
            const employmentSummary = summary['employment-summary'];
            const organizationName = employmentSummary.organization.name;
            const roleTitle = employmentSummary['role-title'];
            const employmentsGroup = { organizationName, roleTitle };

            allEmployments.push(employmentsGroup);
          });
        });
      }

      // Return it
      resolve(allEmployments);
    },
  );
});

// Fetch user works from orcid
const getUserWorks = (orcidId) => new Promise((resolve) => {
  orcid.getPersonWorks(orcidId, (worksErr, works) => {
    const allWorks = [];

    if (works && works.group) {
      works.group.forEach((work) => {
        const summaries = work['work-summary'];

        if (summaries) {
          // Extract specific data from orcid
          summaries.forEach((summary) => {
            const { title, type } = summary;
            const externalId = summary['external-ids']['external-id'][0];
            const journalTitle = summary['journal-title'].value;
            const createdAt = summary['created-date'].value; // Timestamp format
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
    }

    // Return it
    resolve(allWorks);
  });
});

// Fetch user given-name and family-name from orcid
const getUserFullName = (orcidId) => new Promise((resolve) => {
  return orcid.getPersonDetails(
    orcidId,
    null,
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
      const pub = publication
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

  debug('octopus:ui:debug')(`Showing User Profile: ${orcidId}`);

  // Fetch all data for user profile page
  const userWorks = await getUserWorks(orcidId);
  const userEducations = await getUserEducations(orcidId);
  const userEmployments = await getUserEmployments(orcidId);
  const userFullName = await getUserFullName(orcidId);
  const userPublications = await getUserPublications(orcidId);
  const pubsCountedByType = await countPublicationsByType(
    userPublications,
    publicationTypes,
  );

  const orcidUserData = {
    userWorks,
    userEducations,
    userEmployments,
    userFullName,
  };

  res.locals.publications = userPublications;
  res.locals.pubsCountedByType = pubsCountedByType;

  return api.getUserByORCiD(orcidId, (userErr, userData) => {
    res.locals.person = { userData, orcidUserData, orcidId };

    // debug('octopus:ui:trace')(res.locals);
    return res.render('users/view', res.locals);
  });
};
