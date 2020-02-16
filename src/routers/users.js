const express = require('express');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

/*
* PUBLIC
*/
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    }
    catch(error) {
        res.status(400).send(error);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        
        res.send({ user, token });
    }
    catch(error) {
        res.status(400).send();
    }
});

/*
* AUTHENTICATED
*/

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.send();
    }
    catch(error) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    }
    catch(error) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];   
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if(!isValidOperation) {
       return res.status(400).send({ error: 'Invalid updates' }); 
    }

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        // findByIdAndUpdate bypass mongoose middleware that's why we need to do it manually
        // we can't access the user property manually like user.name 
        // so we iterate on the array of string updates and use brackets to pair the keys user[key] = req.param[key] and get the value
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();

        res.send(req.user);
    }
    catch(error) {
        res.status(400).send(error);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);

        res.send(req.user);
    }
    catch(error) {
        res.status(500).send();
    }
});

// upload middleware
const upload = multer({
    //dest: 'avatars', if dosen't exist multer give access to the data in req.file
    limits: {
        fileSize: 1000000 // 1MB
    },
    fileFilter(req, file, callback) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('You must provide a picture'));
        }

        callback(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();    
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, 
// error handler for the middleware
(error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch(error) {
        res.status(404).send();
    }
});

module.exports = router;