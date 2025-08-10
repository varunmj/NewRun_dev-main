const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const propertySchema = new Schema({
    title: {type:String, required: true},
    content: {type: String, required: true},
    tags: {type: [String],default:[]},
    isPinned:{type:Boolean,default:false},
    userId:{type:String,required: true},
    createdOn: {type:Date,default: new Date().getTime()},

    // New fields for student housing
    price: { type: Number, required: true }, // Rental price
    bedrooms: { type: Number, required: true }, // Number of bedrooms
    bathrooms: { type: Number, required: true }, // Number of bathrooms
    distanceFromUniversity: { type: Number, required: true }, // Distance from university in miles/kilometers
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true }
    },
    availabilityStatus: { type: String, enum: ['available', 'rented'], default: 'available' }, // Availability of the property
    images: { type: [String], default: [] }, // URLs of property images
    contactInfo: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },
    description: { type: String }, // Detailed property description
    isFeatured: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model("Property", propertySchema);
