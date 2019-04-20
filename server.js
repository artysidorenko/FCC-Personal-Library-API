'use strict';

require('dotenv').config()
var express     = require('express');
var bodyParser  = require('body-parser');
var cors        = require('cors');
const helmet    = require('helmet')

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

var app = express();

app.use(helmet())
app.use(helmet.noCache())
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }))

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //USED FOR FCC TESTING PURPOSES ONLY!

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Start our server and tests!
MongoClient.connect(MONGODB_CONNECTION_STRING, (connErr, client) => {
  if (connErr) console.log(`error connecting to DB: ${connErr}`)
  const db = client.db('test')
  const collection = db.collection('books')

  //Index page (static HTML)
  app.route('/')
    .get(function (req, res) {
      res.sendFile(process.cwd() + '/views/index.html');
    });

  //For FCC testing purposes
  fccTestingRoutes(app);

  //Routing for API 
  apiRoutes(app, collection);

  //404 Not Found Middleware
  app.use(function (req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

  app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port " + process.env.PORT);
    if(process.env.NODE_ENV==='test') {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch(e) {
          var error = e;
            console.log('Tests are not valid:');
            console.log(error);
        }
      }, 1500);
    }
  })
})

module.exports = app; //for unit/functional testing
