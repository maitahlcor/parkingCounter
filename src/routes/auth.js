import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Team from '../models/Team.js';     // o '../models/Teams.js' si mantuviste plural
import User from '../models/User.js';     // idem

const router = Router();

function signAccessToken({ userId, teamId, role }) {
  const ttlMin = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || '30', 10);
  return jwt.sign(
    { sub: userId.toString(), teamId: teamId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: `${ttlMin}m` }
  );
}

// Asegura que exista un Team por defecto (para no romper los FKs que ya usa el resto)
async function getOrCreateDefaultTeam() {
  let t = await Team.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!t) {
    t = await Team.create({
      name: 'Default',
      accessCodeHash: 'global-password-disabled', // ya no se usa
      isActive: true
    });
  }
  return t;
}

// POST /auth/login  { email, accessCode }
router.post('/login', async (req, res) => {
  const email = (req.body?.email ?? '').toString().trim().toLowerCase();
  const access = (req.body?.accessCode ?? '').toString().trim();
  if (!email || !access) {
    return res.status(400).json({ error: 'email_and_accessCode_required' });
  }

  const global = (process.env.GLOBAL_ACCESS_CODE || '').trim();
  if (!global) return res.status(500).json({ error: 'global_access_code_not_configured' });
  if (access !== global) return res.status(401).json({ error: 'invalid_access_code' });

  const team = await getOrCreateDefaultTeam();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      teamId: team._id,
      role: 'OPERATOR',
      displayName: email.split('@')[0]  // opcional: nombre por defecto
    });
  } else if (!user.teamId) {
    // por si tenías usuarios antiguos sin teamId
    user.teamId = team._id;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({ userId: user._id, teamId: team._id, role: user.role });
  res.json({
    accessToken,
    user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
    team: { id: team._id, name: team.name }
  });
});

export default router;
