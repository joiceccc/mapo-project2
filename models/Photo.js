const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({

  belongstoname: String,
  belongstonameId: String,
  //creator: {type: mongoose.Schema.ObjectId , ref: 'User' },
  categories: String,
  image: String,
  userdistrict : String,
  belongstouserid : {type: mongoose.Schema.ObjectId , ref: 'User' },


  tags: [String]
}, { timestamps: true });

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;



