var express = require('express');
var bodyParser = require('body-parser');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const config = require('../config/config.js');
const mongoose = require('mongoose');


const guid = require('guid');
var uuid = require('node-uuid');
const Photo = require('../models/Photo');
const User = require('../models/User');
var uploadedphotos = []

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
  var uploadedphotos = []
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) { return next(err); }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
};

/**
 * setting page page.
 */
exports.getAccount = (req, res) => {
  res.render('account/settings', {
    title: 'Account Management'

  });
};

//profile profile
exports.getProfile = (req, res) => {
   Photo.find({'belongstonameId': req.user.id}, function(err,photos){
      if (err) console.log(err);
      console.log(photos);
      uploadedphotos = photos
      console.log("image url")


       res.render('account/profile', {
        title: 'Your Profile',
        imagesarray: uploadedphotos
         });
    });



};
/////

var otheruserprofile = ""

///
exports.getOtherUserProfile = (req, res) => {
console.log(req.params.userid);
    User.findOne({'_id':req.params.userid}).populate('uploadPhotos')
     .exec(function (err, user) {
      if (err) console.log('fail');
      console.log(user.profile.bio);
      otheruserprofile = user

       res.render('account/otheruserprofile', {
         title: 'NAME',
         otheruser : otheruserprofile
       });


 })

};
/////
exports.uploadImg = (req, res) => {
  res.render('account/upload', {
    title: 'Upload'
  });
};

exports.inbox = (req, res) => {
  res.render('account/inbox', {
    title: 'inbox'
  });
};
var usersdata = []
exports.goSearch = (req, res) => {
  User.find({'profile.categories': req.params.categories})
            .populate('uploadPhotos')
            .exec(function(error, posts) {
              usersdata = posts

   res.render('account/search', {
     title: 'Search Pages',
     categories: req.params.categories,
     data: usersdata
    });



            });


};

var searchTagsArray = []
var matchedphotos = []
///// search multiple tags

exports.goSearchTags = (req, res) => {

  var tagsstring = req.params.tags;
  searchTagsArray = tagsstring.split(', ');
  console.log(searchTagsArray);

  // if(!req.params.location){
  //   var location = "*";
  // }else{
  //   var location = req.params.loction
  // }

  // if(!req.params.type){
  //   var type = "*";
  // }else{
  //   var type = req.params.type
  // }





  Photo.find({ tags: { "$all" : searchTagsArray } }).populate('belongstouserid').exec(function(err, photos) {
    console.log(photos.length);
     matchedphotos = photos;
     console.log(matchedphotos);
     // console.log(matchedphotos[0].belongstouserid.profile)
    // console.log(matchedphotos[0].belongstouserid)

      res.render('account/searchtags', {
        title: 'Search Tags',
        tagsarray: searchTagsArray,
        photos : matchedphotos
      });
  })



};

// get photo post by user



/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.email = req.body.email || '';
    user.profile.appearname = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.bio = req.body.bio || '';
    user.profile.categories = req.body.categories || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Profile information has been updated.' });
      res.redirect('/account');
    });
  });
};

// POST / account/ profile
// Update Profile Image

exports.postUploadProfileImage = (req, res, next) => {
  console.log(req.file);
  User.findById(req.user.id, (err, user) => {

    var tempPath = req.file.path,
        relativepath = 'uploads/' + req.user._id + '.png';
        targetPath = config.rootPath + 'public/' + relativepath;

    if (path.extname(req.file.originalname).toLowerCase() === '.png' || path.extname(req.file.originalname).toLowerCase() === '.jpg') {
      fs.rename(tempPath, targetPath, function(err) {
        if (err) throw err;
        req.user.profile.profileimage = relativepath;
        req.user.save((err) => {
          if (err) {
            req.flash('errors', { msg: 'Something went wrong' });
            return res.redirect('/account');
          }

          res.redirect('/account');
        });
      });
    } else {
      fs.unlink(tempPath, function () {
        if (err) throw err;
        console.error("Only .png files are allowed!");
      });
    }
  });
};

// POST IMAGE
var tagsarray = [];
exports.postUploadImage = (req, res, next) => {
  console.log(req.file);
  console.log(req.body.showntags);
  var tagsstring = req.body.showntags
  tagsarray = tagsstring.split(',')
  console.log(tagsarray);
  User.findById(req.user._id, (err, user) => {

    console.log(uuid.v1());
    // console.log(req.body.tags)
    var unique = uuid.v1()

    var tempPath = req.file.path,
        relativepath = 'uploads/' + "image" + unique +'.png';
        targetPath = config.rootPath + 'public/' + relativepath;

    var fileExtension = path.extname(req.file.originalname).toLowerCase();


    if ( fileExtension === '.png' || fileExtension === '.jpg') {
      fs.rename(tempPath, targetPath, function(err) {
        if (err) throw err;

        var photo = new Photo({
          image: relativepath,
          belongstoname: req.user.appearname,
          belongstouserid: req.user._id,
          belongstonameId: req.user._id,
          tags:tagsarray

        });

        photo.save((err) => {
          if (err) {
            req.flash('errors', { msg: 'Something went wrong' });
            return res.redirect('/profile');
          }

          req.user.uploadPhotos.push(photo);

          req.user.save((err) => {
            if (err) {
              req.flash('errors', { msg: 'Something went wrong usersave' });
            }

            res.redirect('/profile');
          });
        });
      });
    } else {
      fs.unlink(tempPath, function () {
        if (err) {
          req.flash('errors', { msg: "Only .png files are allowed!" });
        }
        res.redirect('/profile');
      });
    }
  });
};
////////add location/////////

exports.postUpdateLocation = (req, res, next) => {


  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }

    req.user.map.lat = req.body.lat;
    req.user.map.long = req.body.long;
    req.user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'error location' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: 'Location has been updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.password = req.body.password;
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${provider} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) { return next(err); }
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function (done) {
      User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
          if (err) { return next(err); }
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save((err) => {
            if (err) { return next(err); }
            req.logIn(user, (err) => {
              done(err, user);
            });
          });
        });
    },
    function (user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Your Hackathon Starter password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], (err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function (done) {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (!user) {
          req.flash('errors', { msg: 'Account with that email address does not exist.' });
          return res.redirect('/forgot');
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Reset your password on Hackathon Starter',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
        done(err);
      });
    }
  ], (err) => {
    if (err) { return next(err); }
    res.redirect('/forgot');
  });
};

// var foundtags = 0
// for(i = 0 ; i < searchtags.length ; i++) {
// var totaltags = searchtags.length


// for (n = 0 ; n < alltags.length ; n++) {
//     if (searchtags[i] === alltags[n]) {
//     foundtags++
//     if (foundtags === totaltags) {
//      console.log ("match");
//      break
//     }} }
// }