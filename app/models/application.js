var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , FormulaIngredient = require('./formula-ingredient.js').FormulaIngredient
    //, question = require('./question.js').question
    , response = require('./response.js').response
    , person   = require('./person.js').person;

var application = Schema({
  // FUTURE: questions: [question]
  responses:   [{ type: Schema.types.ObjectId, ref: 'Response' }],
  respondents: [{ type: Schema.types.ObjectId, ref: 'Person' }]
});

var Application = FormulaIngredient.discriminator('Application', application);

module.exports = Application;
