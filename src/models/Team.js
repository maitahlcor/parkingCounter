import mongoose from 'mongoose';
const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  accessCodeHash: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
TeamSchema.index({ accessCodeHash: 1 });
export default mongoose.model('Team', TeamSchema);
