const _ = require('lodash');

const api = require('../../lib/api');

function toArray(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return (string || '').split(/,|\s/).filter(_.identity);
}

// get related publications by publicationID
const getRelatedPubsByPubID = publicationID =>
  new Promise(resolve =>
    api.findRelatedPublications(
      { publicationID },
      (relatedPubErr, relatedPubs) => resolve(relatedPubs)
    )
  );

// get related publications by relatedTo
const getRelatedPubsByRelatedTo = publicationID =>
  new Promise(resolve =>
    api.findRelatedPublications(
      { relatedTo: publicationID },
      (relatedPubErr, relatedPubs) => resolve(relatedPubs)
    )
  );

// get related publication by publicationId and relatedTo and vice versa
const getSpecificRelatedPub = async (publicationID, relatedTo) =>
  await new Promise(async resolve => {
    let relatedPublication;
    const query = { publicationID, relatedTo };

    relatedPublication = await new Promise(resolve =>
      api.findRelatedPublications(
        query,
        (relatedPublicationsErr, relatedPublication) => {
          if (relatedPublicationsErr) {
            return resolve(null);
          }

          return resolve(relatedPublication);
        }
      )
    );

    if (_.isEmpty(relatedPublication)) {
      const newQuery = {
        publicationID: relatedTo,
        relatedTo: publicationID
      };

      relatedPublication = await new Promise(resolve =>
        api.findRelatedPublications(
          newQuery,
          (relatedPublicationsErr, relatedPublication) => {
            if (relatedPublicationsErr) {
              return resolve(null);
            }

            return resolve(relatedPublication);
          }
        )
      );
    }

    return resolve(relatedPublication[0]);
  });

// manage related publications data
async function mapRelatedPublications(publicationID, relatedPubs, userID) {
  let relatedPublicationsIDs = toArray(relatedPubs);
  let relatedPublications = [];

  relatedPublicationsIDs.forEach(relatedPubID => {
    // publication A is related to publication B
    relatedPublications.push({
      publicationID,
      relatedTo: relatedPubID,
      createdByUser: userID,
      ratings: [],
      dateCreated: new Date()
    });
  });

  return relatedPublications;
}

const attachRelatablePublications = (publications, publication) => {
  const { relatedPublications } = publication;

  // Extract only used keys from publications
  const publicationsData = publications.map(pub => {
    return {
      _id: pub._id,
      title: pub.title,
      type: pub.type,
      createdByUser: pub.createdByUser
    };
  });

  if (relatedPublications && relatedPublications.length > 0) {
    // Filter - the ones that have not been already related to current publication
    // This list contains the current publication too
    const allRelatablePublications = _.differenceWith(
      publicationsData,
      relatedPublications,
      (a, b) => a._id === b.relatedTo
    );

    // Remove current publication from allRelatablePublications
    const relatablePublications = allRelatablePublications.filter(
      relatablePub => relatablePub._id !== publication._id
    );

    return relatablePublications;
  }

  // Remove current publication from relatable publications
  const relatablePublications = publicationsData.filter(
    relatablePub => relatablePub._id !== publication._id
  );

  return relatablePublications;
};

module.exports = {
  getRelatedPubsByPubID,
  getRelatedPubsByRelatedTo,
  getSpecificRelatedPub,
  mapRelatedPublications,
  attachRelatablePublications
};
