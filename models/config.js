'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConfigSchema = Schema({
    categorias: [{type: Object, required:false}],
    titulo: {type: String, required:false},
    logo: {type: String, required:false },
    serie: {type: String, required:false },
    correlativo: {type: String, required:false},
});

module.exports = mongoose.model('config',ConfigSchema);