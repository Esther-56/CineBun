// models/Badge.ts
import mongoose, { Schema } from "mongoose";

const Badge = new Schema({
  key:         { type: String, required: true, unique: true, trim: true }, // "early_adopter"
  label:       { type: String, required: true },                          // "Early Adopter"
  description: { type: String, default: '' },
  icon:        { type: String, required: true },                          // lucide icon name, e.g. "Rocket"
  color:       { type: String, required: true },                          // "#f59e0b"
  tier:        { type: String, enum: ['bronze', 'silver', 'gold', 'special'], default: 'bronze' },
  isDefault: {type: Boolean, required: true, default:false},
  isAutomatic: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Badge ||
  mongoose.model("Badge", Badge);