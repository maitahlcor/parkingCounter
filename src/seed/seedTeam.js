import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Team from '../models/Team.js';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri);

  const accessCode = process.env.TEAM_ACCESS_CODE_INICIAL || 'TEAM-ACCESS-CODE';
  const hash = await bcrypt.hash(accessCode, 10);

  const t = await Team.create({ name: 'Equipo A', accessCodeHash: hash });
  console.log('Team creado:', { id: t._id.toString(), name: t.name, accessCode });
  await mongoose.disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
