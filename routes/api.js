/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
// var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
// const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app, collection) {

  app.route('/api/books')
    .get(function (req, res){
        collection.find({}).toArray((findErr, doc) => {
          if (findErr) console.log(`error deleting books: ${findErr}`)
          else {
            res.send(doc)}
        })
    })
    
    .post(function (req, res){
      const title = req.body.title;
      if (!title) {
        res.send('missing book title')
      } else {
        const newBook = { title: title, commentcount: 0, comments: [] }
          collection.insertOne(newBook, (insertErr, doc) => {
            if (insertErr) console.log(`POST DB Insert Error: ${insertErr}`)
            newBook._id = doc.ops[0]._id
            res.json(newBook)
          })
        // })
      }
    })
    
    .delete(function(req, res){
        collection.deleteMany({}, (delErr, doc) => {
          if (delErr) console.log(`error deleting books: ${delErr}`)
          else res.send('complete delete successful')
        })
      // })
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      const bookid = req.params.id;
      if (!ObjectId.isValid(bookid)) {
        res.send('no book exists')
        return
      }
      const _id = new ObjectId(bookid)
      collection.findOne({_id: _id}, (findErr, doc) => {
        if (findErr) console.log(`error finding book: ${findErr}`)
        else if (doc === null) res.send('no book exists')
        else res.json(doc)
      })
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    
    .post(function(req, res){
      const bookid = req.params.id
      const comment = req.body.comment
      if (!ObjectId.isValid(bookid)) {
        res.send('no book exists')
        return
      }
      const _id = new ObjectId(bookid)
      collection.findOneAndUpdate(
        { _id: _id },
        { $push: {comments: comment}, $inc: {commentcount: +1} },
        { returnOriginal: false },
        (modErr, doc) => {
        if (modErr) console.log(`error modifying book: ${modErr}`)
        else res.json(doc.value)
      })
    })
    
    .delete(function(req, res){
      const bookid = req.params.id
        collection.deleteOne({_id: new ObjectId(bookid)}, (delErr, doc) => {
          if (delErr) console.log(`error deleting book ${bookid}: ${delErr}`)
          else if (doc.deletedCount === 1) res.send('delete successful')
          else console.log('unable to delete - unkown reason')
        })
      // })
    });
  
};
