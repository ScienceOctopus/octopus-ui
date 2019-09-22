function orcidAuthCheck(req, res, next) {
  const returnPath = req.query.returnPath || '/';

  if (req.session.authOrcid) {
    req.flash('info', 'You\'re already authenticated.');
    return res.redirect(returnPath);
  }
  return next();
}

module.exports = orcidAuthCheck;
