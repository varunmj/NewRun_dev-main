// backend/models/contactAccessRequest.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ContactAccessRequestSchema = new Schema(
  {
    propertyId:  { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    ownerId:     { type: Schema.Types.ObjectId, ref: "User",     required: true, index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: "User",     required: true, index: true },
    status:      { type: String, enum: ["pending","approved","denied","expired"], default: "pending", index: true },
    approvedAt:  Date,
    deniedAt:    Date,
    phone:       String,
    email:       String,
    expiresAt:   { type: Date, default: () => new Date(Date.now() + 7*24*60*60*1000), index: { expires: "7d" } },
  },
  { timestamps: true }
);

ContactAccessRequestSchema.index({ propertyId: 1, requesterId: 1 }, { unique: true });

module.exports =
  mongoose.models.ContactAccessRequest ||
  mongoose.model("ContactAccessRequest", ContactAccessRequestSchema);
