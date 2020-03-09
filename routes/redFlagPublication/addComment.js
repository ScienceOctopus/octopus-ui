const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');
const helpers = require('./helpers');
const publishHelpers = require('../publish/steps/helpers');

module.exports = async (req, res) => {
  const resolutionID = _.get(req, 'params.resolutionID');
  const userID = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Updating a resolutio publication for ${resolutionID}`);

  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get data from form
  return formHelpers.parseForm(req, async (err, fields, files) => {
    if (err) {
      return res.render('publish/error', { error: err });
    }

    const fileData = _.first(files);

    debug('octopus:ui:trace')(fields, files);
    const { text } = fields;

    // New Comment Object
    const newComment = {
      userID,
      text,
      dateCreated: new Date(),
    };

    const resolution = await helpers.getResolutionByID(resolutionID);
    const { comments } = resolution;


    // return api.getFileContents("5e5f7c84de36713217f1eaf0", (err, data) => {
    //   if (err) {
    //     console.log('err', err);
    //   }
    //   console.log('data', data);
    //   function base64ToArrayBuffer(base64) {
    //     var binaryString = window.atob(base64);
    //     var binaryLen = binaryString.length;
    //     var bytes = new Uint8Array(binaryLen);
    //     for (var i = 0; i < binaryLen; i++) {
    //        var ascii = binaryString.charCodeAt(i);
    //        bytes[i] = ascii;
    //     }
    //     return bytes;
    //  }



    // var byteArray = new Uint8Array(data);
    // var a = window.document.createElement('a');

    // a.href = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/octet-stream' }));
    // a.download = data.filename;

    // // Append anchor to body.
    // document.body.appendChild(a)
    // a.click();

    // // Remove anchor from body
    // document.body.removeChild(a)



  //    function saveByteArray(reportName, byte) {
  //     var blob = new Blob([byte], {type: "application/pdf"});
  //     var link = document.createElement('a');
  //     link.href = window.URL.createObjectURL(blob);
  //     var fileName = reportName;
  //     link.download = fileName;
  //     link.click();
  // };

  // var sampleArr = base64ToArrayBuffer(data);
  // saveByteArray("Sample Report", arraybuffer);
        // return res.redirect(`/resolution-center/${resolutionID}`);

    // })


    if (fileData) {
      console.log('fileData', fileData);
      return publishHelpers.handleFileUpload(fileData, (uploadErr, uploadResult) => {
        if (uploadErr) {
          return res.send('ERROR');
        }

        newComment.fileId = uploadResult._id;

        return res.redirect(`/resolution-center/${resolutionID}`);
      });
    }

    comments.push(newComment);

    // Update Resolution Object
    return api.updateResolution(resolution, (updateErr, updateData) => {
      if (updateErr || !updateData) {
        return res.render('publish/error', { error: updateErr });
      }

      return res.redirect(`/resolution-center/${resolutionID}`);
    });
  });
};
