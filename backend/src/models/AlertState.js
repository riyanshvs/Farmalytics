import mongoose from "mongoose";

const alertStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    readIds: {
      type: [Number],
      default: [],
    },
    dismissedIds: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const AlertState = mongoose.model("AlertState", alertStateSchema);

export default AlertState;
