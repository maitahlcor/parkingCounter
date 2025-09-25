import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, teamId, role, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
