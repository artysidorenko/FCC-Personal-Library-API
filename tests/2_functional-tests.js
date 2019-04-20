/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('Routing tests', function() {

      suite('POST /api/books with title => create book object/expect book object', function() {
        
        test('Test POST /api/books with title', function(done) {

          chai.request(server)
            .post('/api/books')
            .send({
              title: 'Test Title'
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body, 'response should be an object');
              assert.property(res.body, 'title', 'Book should contain title');
              assert.equal(res.body.title, 'Test Title', 'Book title should match title send over')
              assert.property(res.body, '_id', 'Books in array should contain _id');
              const _id = res.body._id
              done()

              // cleanup db by deleting test cases
              MongoClient.connect(MONGODB_CONNECTION_STRING, (connErr, client) => {
                if (connErr) console.log(`error connecting to DB: ${connErr}`)
                const db = client.db('test')
                const collection = db.collection('books')
                collection.deleteOne({_id: new ObjectId(_id)}, (dbErr, dbRes) => {
                  if (dbErr) console.log(dbErr)
                })
              })

            });
        });
        
        test('Test POST /api/books with no title given', function(done) {
          chai.request(server)
            .post('/api/books')
            .send({})
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, 'missing book title', 'should receive an error response from server');
              done();
            })
        });
        
      });


      suite('GET /api/books => array of books', function(){
        
        test('Test GET /api/books', function (done) {

          // connect to db and prepopulate with test cases
          MongoClient.connect(MONGODB_CONNECTION_STRING, (connErr, client) => {
            if (connErr) console.log(`error connecting to DB: ${connErr}`)
            const db = client.db('test')
            const collection = db.collection('books')
            collection.insertMany([
              { title: 'title 1', commentcount: 0 },
              { title: 'title 2', commentcount: 0 }
            ], (insertErr, doc) => {
              if (insertErr) console.log(insertErr)
              

              // actual test
              chai.request(server)
                .get('/api/books')
                .end(function (err, res) {
                  assert.equal(res.status, 200)
                  assert.isArray(res.body, 'response should be an array')
                  assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount')
                  assert.property(res.body[0], 'title', 'Books in array should contain title')
                  assert.property(res.body[0], '_id', 'Books in array should contain _id')
                  testid1 = res.body[0]._id
                  testid2 = res.body[1]._id
                  done()

                  // cleanup db by deleting test cases
                  collection.deleteMany({ $or: [{ _id: new ObjectId(testid1) }, { _id: new ObjectId(testid2) }] }, (delErr, res) => {
                    if (delErr) console.log(`error deleting from DB: ${delErr}`)
                  })
                })
            })
          })
        })
      })

      suite('GET /api/books/[id] => book object with [id]', function () {

        test('Test GET /api/books/[id] with id not in db', function (done) {
          chai.request(server)
            .get('/api/books/fakeID')
            .end(function (err, res) {
              assert.equal(res.status, 200)
              assert.equal(res.text, 'no book exists', 'when id is invalid or doesn\'t exist - reply accordingly')
              done()
            })
        })

        test('Test GET /api/books/[id] with valid id in db', function (done) {

          // connect to db and prepopulate with a test case
          MongoClient.connect(MONGODB_CONNECTION_STRING, (connErr, client) => {
            if (connErr) console.log(`error connecting to DB: ${connErr}`)
            const db = client.db('test')
            const collection = db.collection('books')
            collection.insertOne({ title: 'title 1', commentcount: 0, comments: [] }, (insertErr, doc) => {
              if (insertErr) console.log(insertErr)
              const _id = doc.insertedId

              // actual test
              chai.request(server)
                .get('/api/books/' + _id)
                .end(function (err, res) {
                  assert.equal(res.status, 200)
                  assert.property(res.body, 'title', 'Book should contain title')
                  assert.equal(res.body.title, 'title 1', 'Inserted title matches data sent')
                  assert.property(res.body, '_id', 'Book should contain _id')
                  assert.property(res.body, 'comments', 'Book should contain array of comments')
                  done()

                  // cleanup db by deleting test case
                  collection.deleteOne({ _id: new ObjectId(_id) }, (delErr, res) => {
                    if (delErr) console.log(`error deleting from DB: ${delErr}`)
                  })
                })
            })
          })
        })
      })


    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
        
        // connect to db and prepopulate with a test case
        MongoClient.connect(MONGODB_CONNECTION_STRING, (connErr, client) => {
          if (connErr) console.log(`error connecting to DB: ${connErr}`)
          const db = client.db('test')
          const collection = db.collection('books')
          collection.insertOne({ title: 'title 3', commentcount: 0, comments: [] }, (insertErr, doc) => {
            if (insertErr) console.log(insertErr)
            const _id = doc.insertedId

            // actual test
            chai.request(server)
              .post('/api/books/' + _id)
              .send({
                comment: 'Test comment'
              })
              .end(function (err, res) {
                if (err) console.log(err)
                assert.equal(res.status, 200)
                assert.property(res.body, 'title', 'Book should contain title')
                assert.equal(res.body.title, 'title 3', 'Inserted title matches data sent')
                assert.property(res.body, '_id', 'Book should contain _id')
                assert.property(res.body, 'comments', 'Book should contain array of comments')
                assert.equal(res.body.comments[0], 'Test comment', 'Posted comment should appear in object\'s comments array')
                done()

                // cleanup db by deleting test case
                collection.deleteOne({ _id: new ObjectId(_id) }, (delErr, res) => {
                  if (delErr) console.log(`error deleting from DB: ${delErr}`)
                })
              })
          })
        })
      })
    })
  })
})
