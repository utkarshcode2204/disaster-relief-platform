// Restricts a route to specific roles (e.g. 'admin', 'ngo')
// Must run AFTER protect middleware, since it needs req.user
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = authorize;