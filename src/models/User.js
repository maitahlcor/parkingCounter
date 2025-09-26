import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
  teamId:     { type: Schema.Types.ObjectId, ref: 'Team', index: true, required: true },
  email:      { type: String, required: true, lowercase: true, trim: true },
  displayName:{ type: String },                     // opcional
  phoneOrId:  { type: String },                     // opcional
  role:       { type: String, enum: ['OPERATOR','COORDINATOR'], default: 'OPERATOR' },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now },
  lastLoginAt:{ type: Date }
});

// índices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ teamId: 1, email: 1 });

export default mongoose.model('User', UserSchema);
