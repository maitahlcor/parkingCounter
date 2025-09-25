import mongoose from 'mongoose';
const { Schema } = mongoose;

const EventSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true, required: true },
  direction: { type: String, enum: ['IN','OUT'], required: true },
  at: { type: Date, default: Date.now, index: true },
  clientAt: { type: Date },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] } // [lng, lat]
  },
  notes: { type: String },
  idempotencyKey: { type: String }
});

EventSchema.index(
  { teamId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
EventSchema.index({ location: '2dsphere' });

export default mongoose.model('Event', EventSchema);
