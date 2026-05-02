import mongoose from "mongoose";

const farmSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  location: {
    address: String,
    city: String,
    pincode: String,
    state: String,
    district: String,
    country: String,
  },
  farmSize: {
    type: Number,
    default: 0,
  },
  selectedCrops: [{
    type: String,
  }],
  distributions: [{
    name: String,
    area: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Farm = mongoose.model("Farm", farmSchema);

export default Farm;
