function orcidAuthLogout(req, res) {
  req.session.orcid = undefined;
  req.session.user = undefined;
  return res.redirect('/');
}

module.exports = orcidAuthLogout;
