module.exports = function(err, req, res) {
    console.error(err.stack);
    res.status(err.status || 500).send({ error: 'Something went wrong' });
};
