const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'capex_session';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getSessionSecret = () => (
  process.env.SESSION_SECRET || 'capex-finance-secret-key-change-in-production'
);

const normalizeSessionData = (session) => {
  const data = {};

  Object.entries(session || {}).forEach(([key, value]) => {
    if (typeof value !== 'function' && value !== undefined) {
      data[key] = value;
    }
  });

  return data;
};

const base64UrlEncode = (value) => Buffer.from(value, 'utf8').toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const signPayload = (payload) => (
  crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
);

const serializeCookie = (name, value, options = {}) => {
  const segments = [`${name}=${value}`];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options.path) {
    segments.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    segments.push('HttpOnly');
  }

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    segments.push('Secure');
  }

  return segments.join('; ');
};

const appendSetCookie = (res, cookieValue) => {
  const current = res.getHeader('Set-Cookie');

  if (!current) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  if (Array.isArray(current)) {
    res.setHeader('Set-Cookie', [...current, cookieValue]);
    return;
  }

  res.setHeader('Set-Cookie', [current, cookieValue]);
};

const parseCookies = (cookieHeader = '') => (
  cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {})
);

const decodeSessionCookie = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  const [encodedPayload, signature] = rawValue.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  if (signature !== signPayload(encodedPayload)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch (error) {
    return null;
  }
};

const encodeSessionCookie = (sessionData) => {
  const payload = base64UrlEncode(JSON.stringify(sessionData));
  return `${payload}.${signPayload(payload)}`;
};

const clearSessionCookie = (res) => {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  }));
};

const applySession = (req, res) => {
  if (req.session) {
    return req.session;
  }

  const cookies = parseCookies(req.headers.cookie);
  const existingSession = decodeSessionCookie(cookies[SESSION_COOKIE_NAME]) || {};
  const session = { ...existingSession };
  let destroyed = false;

  const destroy = (callback) => {
    destroyed = true;
    Object.keys(session).forEach((key) => {
      if (key !== 'destroy') {
        delete session[key];
      }
    });

    clearSessionCookie(res);

    if (typeof callback === 'function') {
      callback(null);
    }
  };

  Object.defineProperty(session, 'destroy', {
    enumerable: false,
    value: destroy,
  });

  req.session = session;

  const commitSession = () => {
    if (res.headersSent || destroyed) {
      return;
    }

    const sessionData = normalizeSessionData(session);

    if (!sessionData.isAuthenticated) {
      clearSessionCookie(res);
      return;
    }

    appendSetCookie(res, serializeCookie(SESSION_COOKIE_NAME, encodeSessionCookie(sessionData), {
      maxAge: Math.floor(DAY_IN_MS / 1000),
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    }));
  };

  ['json', 'send', 'end', 'redirect'].forEach((methodName) => {
    if (typeof res[methodName] !== 'function') {
      return;
    }

    const originalMethod = res[methodName].bind(res);
    res[methodName] = (...args) => {
      commitSession();
      return originalMethod(...args);
    };
  });

  return session;
};

const sessionMiddleware = (req, res, next) => {
  applySession(req, res);

  if (typeof next === 'function') {
    next();
  }
};

const requireAuth = (req, res, next) => {
  applySession(req, res);

  if (req.session && req.session.isAuthenticated) {
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
};

const requireAdmin = (req, res, next) => {
  applySession(req, res);

  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
  applySession,
  clearSessionCookie,
  requireAuth,
  requireAdmin,
  sessionMiddleware,
};
