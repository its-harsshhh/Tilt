const STORAGE_KEY = 'tilt_memory';

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

  // Track last 5 decisions with full details
  memory.decisions = [
    {
      type,
      input: input.slice(0, 150),
      response: (response || '').slice(0, 200),
      timestamp: Date.now(),
    },
    ...memory.decisions,
  ].slice(0, 5);

  // Update preference counts
  memory.preferences[type] = (memory.preferences[type] || 0) + 1;
  memory.lastPreference = type;

  // Derive tone traits from decision history
  const total = memory.preferences.safe + memory.preferences.smart + memory.preferences.bold;
  const traits = [];

  if (total >= 2) {
    // Dominant style trait
    const sorted = Object.entries(memory.preferences).sort((a, b) => b[1] - a[1]);
    const dominantType = sorted[0][0];
    const dominantRatio = sorted[0][1] / total;

    // Add directness/politeness traits
    if (memory.preferences.bold / total > 0.35) traits.push('Direct');
    if (memory.preferences.safe / total > 0.35) traits.push('Polite');
    if (memory.preferences.smart / total > 0.3) traits.push('Balanced');

    // Short vs verbose based on bold preference
    if (dominantType === 'bold' && dominantRatio > 0.4) traits.push('Short');
    if (dominantType === 'safe' && dominantRatio > 0.4) traits.push('Careful');

    // Ensure dominant style name is first
    const dominantLabel = dominantType.charAt(0).toUpperCase() + dominantType.slice(1);
    if (!traits.includes(dominantLabel)) {
      traits.unshift(dominantLabel);
    }
  }

  memory.toneTraits = traits.slice(0, 3);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  return memory;
}

export function getPreferredStyle() {
  const memory = getMemory();
  const { preferences } = memory;
  const total = preferences.safe + preferences.smart + preferences.bold;
  if (total < 2) return 'smart'; // default until enough data
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
