import mongoose from 'mongoose';
const { Schema } = mongoose;

const VehicleSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', index: true, required: true },
  plate: { type: String, required: true },
  normalizedPlate: { type: String, required: true },
  meta: { type: Object }
});

VehicleSchema.index({ teamId: 1, normalizedPlate: 1 }, { unique: true });

export default mongoose.model('Vehicle', VehicleSchema);
