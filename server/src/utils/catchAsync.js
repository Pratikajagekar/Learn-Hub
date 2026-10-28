// Wrap async controllers so errors flow to the global error handler
export default (fn) => (req, res, next) => fn(req, res, next).catch(next);
