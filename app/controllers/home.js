var express = require('express')
  , router = express.Router()
  , mongoose = require('mongoose')
  , Program = require('../models/program.js').Program
  , Application = require('../models/application.js').Application
  , Response = require('../models/response.js').Response
  , Person = require('../models/person.js').Person
  , ObjectId = require('mongoose').Types.ObjectId
  , _ = require('underscore')
  , basicAuth = require('basic-auth-connect')

require('dotenv').load();

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.send('Heyo, there\'s no front door here. Maybe you got here by mistake?');
});

router.post('/:program/application/update/:filter', function(req, res) {
  var query = Response.find({});
  var filter = req.params.filter;
  console.log(filter);
  filter.split(',').forEach(function(filterArg) {
    filterArg = filterArg.split(':');
    query = query.where(filterArg[0]).equals(filterArg[1]);
  });
  query.exec(function(err, doc) {
    if(err) console.log(err) && res.send(500, err);
    doc = doc[0];
    _.extend(doc, req.body);
    doc.markModified('raw');
    doc.save(function(err) {
      if (err) {
        console.log(err);
        res.send(500, 'An error occurred while updating the document.');
      }
      res.send(doc);
    });
  })
})

router.post('/:program/new', function (req, res) {
  var program = req.params.program
    , data    = req.body

  var handleError = function(err) {
    if(err) {
      console.log(err)
      res.send(500, 'Whoa, popped a gasket. Whoops.')
    }
  }

  Program.create(data, function (err, p) {
    handleError(err);
    res.status(200).send();
  })
});

// NOTE(jordan): LET'S BUILD TEH SUPERROUTE

router.get('/:program/:pfilter?/:endpoint/:efilter?/:action?',  function(req, res) {
  // NOTE(jordan): so many optional parameters!!!
  var program   = req.params.program
    , pfilter   = req.params.pfilter
    , endpoint  = req.params.endpoint
    , efilter   = req.params.efilter
    , action    = req.params.action
    , query;

  var handleError = function(err) {
    if(err) {
      console.log(err)
      res.status(500).send('Whoa, popped a gasket. Whoops.')
    }
  }

  var send = function(err, data) {
    handleError(err);
    if (data == '' || data == [])
      res.send([]);
    // NOTE(jordan): if data is a Number, then call toString
    else if (data == null) {
      res.send(null)
    }
    else res.send(isNaN(data) ? data : data.toString());
  }

  // NOTE(jordan): all queries should be 'startsWith' and case insensitive
  var rxsi = function (val) { return new RegExp('^' + val, 'i'); }

  if (pfilter && pfilter.indexOf(':') < 0)
    action = efilter,
      efilter = endpoint,
      endpoint = pfilter,
      pfilter = undefined;

  if (efilter && efilter.indexOf(':') < 0)
    action = efilter,
      efilter = undefined;

  var query = Program.findOne({ $or: [
    { 'name':      program },
    { 'shortname': program }
  ]})

  // TODO(jordan): same for pfilter...

  efilter && efilter.split(',').forEach(function(filterArg) {
    filterArg = filterArg.split(':');
    if (filterArg[0].charAt(0) == '~')
      query = filterArg.length == 2
        ? query[filterArg[0].slice(1)](filterArg[1])
        : query;
    else if (filterArg[0] == '_id')
      query = query.where(filterArg[0]).equals(filterArg[1]);
    else query = filterArg.length == 2
      ? query.where(filterArg[0]).equals(rxsi(filterArg[1]))
      : query.where(filterArg[0])[filterArg[1]](rxsi(filterArg[2]));
  })

  if (action == 'count') {
    query.count(send);
  } else if (action == 'view') {
    query.exec( function (err, data) {
      if (err) handleError(err);

      res.render('view', {app: data[0]})
    })
  } else if (action == 'list') {
    query
      .exec(function (err, data) {
        if (err) handleError(err);
        res.render('list', {
          applications: data,
          path: req.path.slice(0, -5)
        });
     })
  } else {
    query.exec(send);
  }
})
