import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true, required: true },
  displayName: { type: String, required: true },
  phoneOrId: { type: String },
  role: { type: String, enum: ['OPERATOR','COORDINATOR'], default: 'OPERATOR' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

UserSchema.index({ teamId: 1, displayName: 1 });

export default mongoose.model('User', UserSchema);
