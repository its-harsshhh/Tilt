const STORAGE_KEY = 'tilt_memory';
const SESSION_KEY = 'tilt_sessions';

const defaultMemory = {
  decisions: [],
  preferences: { safe: 0, smart: 0, bold: 0 },
  toneTraits: [],
  lastPreference: null,
};

export function getMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultMemory };
    return JSON.parse(raw);
  } catch {
    return { ...defaultMemory };
  }
}

export function saveDecision(type, input, response) {
  const memory = getMemory();

  memory.decisions = [
    { type, input: input.slice(0, 150), response: (response || '').slice(0, 200), timestamp: Date.now() },
    ...memory.decisions,
  ].slice(0, 10);

  memory.preferences[type] = (memory.preferences[type] || 0) + 1;
  memory.lastPreference = type;

  const total = memory.preferences.safe + memory.preferences.smart + memory.preferences.bold;
  const traits = [];
  if (total >= 2) {
    const sorted = Object.entries(memory.preferences).sort((a, b) => b[1] - a[1]);
    const dominantType = sorted[0][0];
    const dominantRatio = sorted[0][1] / total;
    if (memory.preferences.bold / total > 0.35) traits.push('Direct');
    if (memory.preferences.safe / total > 0.35) traits.push('Polite');
    if (memory.preferences.smart / total > 0.3) traits.push('Balanced');
    if (dominantType === 'bold' && dominantRatio > 0.4) traits.push('Short');
    if (dominantType === 'safe' && dominantRatio > 0.4) traits.push('Careful');
    const label = dominantType.charAt(0).toUpperCase() + dominantType.slice(1);
    if (!traits.includes(label)) traits.unshift(label);
  }
  memory.toneTraits = traits.slice(0, 3);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  return memory;
}

export function getPreferredStyle() {
  const memory = getMemory();
  const { preferences } = memory;
  const total = preferences.safe + preferences.smart + preferences.bold;
  if (total < 2) return 'smart';
  const sorted = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

export function getInsightText() {
  const memory = getMemory();
  const { preferences, toneTraits } = memory;
  const total = preferences.safe + preferences.smart + preferences.bold;
  if (total < 2) return null;
  const sorted = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
  const traitStr = toneTraits.length > 0 ? ` + ${toneTraits[0]}` : '';
  return `You usually prefer: ${dominant}${traitStr}`;
}

export function getRecentDecisions() {
  const memory = getMemory();
  return memory.decisions || [];
}

export function clearMemory() {
  localStorage.removeItem(STORAGE_KEY);
}

// ===== SESSION TRACKING =====

function getSessions() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

// Log a new session open
export function logSessionOpen() {
  const sessions = getSessions();
  sessions.unshift({
    openedAt: Date.now(),
    activities: [],
    queries: [],
    contexts: [],
  });
  // Keep last 10 sessions
  saveSessions(sessions.slice(0, 10));
}

// Log an activity seen on screen (call from screen analysis)
export function logActivity(activity, context) {
  const sessions = getSessions();
  if (sessions.length === 0) return;
  const current = sessions[0];

  // Track unique activities this session
  if (activity && !current.activities.includes(activity)) {
    current.activities.push(activity);
    if (current.activities.length > 8) current.activities.shift();
  }

  // Track unique contexts (dedupe similar ones)
  if (context && context.length > 10) {
    const short = context.slice(0, 80);
    const isDupe = current.contexts.some(c => c.slice(0, 40) === short.slice(0, 40));
    if (!isDupe) {
      current.contexts.push(short);
      if (current.contexts.length > 5) current.contexts.shift();
    }
  }

  saveSessions(sessions);
}

// Log a user query
export function logQuery(query) {
  const sessions = getSessions();
  if (sessions.length === 0) return;
  const current = sessions[0];
  current.queries.push(query.slice(0, 100));
  if (current.queries.length > 10) current.queries.shift();
  saveSessions(sessions);
}

// Get welcome-back context for returning user
export function getWelcomeContext() {
  const sessions = getSessions();
  if (sessions.length < 2) return null;

  const lastSession = sessions[1]; // previous session (not current)
  if (!lastSession) return null;

  const ago = Date.now() - lastSession.openedAt;
  const minsAgo = Math.floor(ago / 60000);
  const hoursAgo = Math.floor(ago / 3600000);
  const daysAgo = Math.floor(ago / 86400000);

  let timeLabel;
  if (minsAgo < 60) timeLabel = `${minsAgo}m ago`;
  else if (hoursAgo < 24) timeLabel = `${hoursAgo}h ago`;
  else timeLabel = `${daysAgo}d ago`;

  const result = { timeLabel };

  // What they were doing last time
  if (lastSession.activities.length > 0) {
    result.lastActivities = lastSession.activities.slice(0, 3);
  }

  // What they asked last time
  if (lastSession.queries.length > 0) {
    result.lastQueries = lastSession.queries.slice(-3);
  }

  // What they were looking at
  if (lastSession.contexts.length > 0) {
    result.lastContexts = lastSession.contexts.slice(-2);
  }

  return result;
}

// Generate personalized suggestion pills from history
export function getPersonalizedPills() {
  const sessions = getSessions();
  const memory = getMemory();
  const pills = [];

  // From recent decisions — what they usually ask about
  if (memory.decisions.length > 0) {
    const topics = memory.decisions.slice(0, 5).map(d => d.input);
    // Extract common patterns
    const hasEmail = topics.some(t => /reply|email|message|respond/i.test(t));
    const hasCode = topics.some(t => /code|bug|function|api|error/i.test(t));
    const hasWriting = topics.some(t => /write|draft|improve|rewrite/i.test(t));
    const hasDecision = topics.some(t => /should i|what to do|decide/i.test(t));

    if (hasEmail) pills.push('Help me with another reply');
    if (hasCode) pills.push('Review more code');
    if (hasWriting) pills.push('Improve my writing again');
    if (hasDecision) pills.push('Another decision to make');
  }

  // From last session activities
  if (sessions.length >= 2) {
    const last = sessions[1];
    if (last.activities.includes('Email')) pills.push('Back to emails?');
    if (last.activities.includes('Code')) pills.push('Continue coding?');
    if (last.activities.includes('Document')) pills.push('Back to your doc?');
    if (last.activities.includes('Chat')) pills.push('Catch up on messages?');
  }

  // Dedupe and limit
  const unique = [...new Set(pills)];
  return unique.slice(0, 3);
}
