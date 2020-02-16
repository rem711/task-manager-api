const jwt = require('jsonwebtoken');
const User = require('../models/user');

/*
* Without middleware: new request -> run route handler
*
* With middleware:    new request -> do something -> run route handler
*/
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if(!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    }
    catch(error) {
        res.status(401).send({ error: 'Please authenticate'});
    }
}

module.exports = auth;