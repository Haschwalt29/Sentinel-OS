const mongoose = require('mongoose');

// A more robust way to define the nested coordinates object
const CoordinatesSchema = new mongoose.Schema({
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false }); // _id: false prevents Mongoose from creating an _id for the subdocument

const ThreatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true // Prevents duplicate threats based on title
  },
  content: { type: String, required: true },
  threatLevel: { type: String, required: true },
  confidence: { type: Number, required: true },
  coordinates: {
    type: Object, // Final attempt: use a generic Object to bypass sub-schema issues
    required: false
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Threat', ThreatSchema); 