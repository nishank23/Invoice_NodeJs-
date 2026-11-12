module.exports = function(req, res, next) {
    // Base URL used when rendering invoice/estimation views (e.g. signature images).
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.locals.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    next();
};
