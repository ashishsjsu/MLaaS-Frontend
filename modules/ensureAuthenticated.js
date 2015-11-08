
function ensureAuthenticated(req,res,next) {
	console.log("Checking the user...");
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('error', 'You must be logged in to do that.')
    res.redirect('/login')
  }
}

module.exports = ensureAuthenticated