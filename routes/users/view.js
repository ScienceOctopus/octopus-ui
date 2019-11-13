const debug = require('debug');

const api = require('../../lib/api');
const orcid = require('../../lib/orcid');

// Fetch user educations from orcid
const getUserEducations = orcidId =>
  new Promise(resolve => {
    return orcid.getPersonEducations(orcidId, (educationsErr, educations) => {
      let allEducations = [];

      educations['affiliation-group'].forEach(affiliation => {
        const summaries = affiliation.summaries;

        summaries.forEach(summary => {
          const educationSummary = summary['education-summary'];
          const organizationName = educationSummary.organization.name;
          const roleTitle = educationSummary['role-title'];
          const educationsGroup = { organizationName, roleTitle };

          allEducations.push(educationsGroup);
        });
      });

      // Return it
      resolve(allEducations);
    });
  });

// Fetch user employments from orcid
const getUserEmployments = orcidId =>
  new Promise(resolve => {
    return orcid.getPersonEmployments(
      orcidId,
      (employmentsErr, employments) => {
        let allEmployments = [];

        employments['affiliation-group'].forEach(affiliation => {
          const summaries = affiliation.summaries;

          summaries.forEach(summary => {
            const employmentSummary = summary['employment-summary'];
            const organizationName = employmentSummary.organization.name;
            const roleTitle = employmentSummary['role-title'];
            const employmentsGroup = { organizationName, roleTitle };

            allEmployments.push(employmentsGroup);
          });
        });

        // Return it
        resolve(allEmployments);
      }
    );
  });

// // Fetch user given-name and family-name from orcid
const getUserFullName = orcidId =>
  new Promise(resolve => {
    orcid.getPersonDetails(orcidId, (personDetailsErr, personDetails) => {
      const givenName = personDetails.name['given-names'];
      const familyName = personDetails.name['family-name'];
      const fullName = `${
        givenName && givenName.value ? givenName.value : ''
      } ${familyName && familyName.value ? familyName.value : ''}`;

      // Return it
      resolve(fullName);
    });
  });

module.exports = (req, res) => {
  const orcidId = req.params.orcid;

  debug('octopus:ui:debug')(`Showing User Profile: ${orcidId}`);

  return api.getUserByORCiD(orcidId, async (userErr, userData) => {
    const userEducations = await getUserEducations(orcidId);
    const userEmployments = await getUserEmployments(orcidId);
    const userFullName = await getUserFullName(orcidId);

    let orcidUserData = { userEducations, userEmployments, userFullName };
    res.locals.person = { userData, orcidUserData, orcidId };
    
    // debug('octopus:ui:trace')(res.locals);
    return res.render('users/view', res.locals);
  });
};
