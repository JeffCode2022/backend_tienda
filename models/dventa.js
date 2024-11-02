'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DventaSchema = Schema({
    producto: {type: Schema.ObjectId,ref:'producto', require:true},
    venta: {type: Schema.ObjectId,ref:'venta', require:true},
    subtotal:{type: Number,require: true},
    variedad: {type: String, require:false},
    cantidad:{type: Number,require: true},
    cliente: {type: Schema.ObjectId,ref:'cliente', require:true},
    createdAt: {type: Date, default: Date.now, require: true}
});

module.exports = mongoose.model('dventa',DventaSchema);