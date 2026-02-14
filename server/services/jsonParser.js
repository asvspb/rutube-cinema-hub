const stripCodeFences = text => text.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1').trim();

const extractJsonSubstring = (text, expected) => {
  const cleaned = stripCodeFences(text);
  const firstObj = cleaned.indexOf('{');
  const lastObj = cleaned.lastIndexOf('}');
  const firstArr = cleaned.indexOf('[');
  const lastArr = cleaned.lastIndexOf(']');

  const trySlice = (start, end) =>
    start !== -1 && end !== -1 && end > start ? cleaned.slice(start, end + 1) : null;

  if (expected === 'array') {
    return trySlice(firstArr, lastArr) || trySlice(firstObj, lastObj);
  }
  if (expected === 'object') {
    return trySlice(firstObj, lastObj) || trySlice(firstArr, lastArr);
  }
  return trySlice(firstObj, lastObj) || trySlice(firstArr, lastArr);
};

export const parseJsonFromText = (text, expected = 'any') => {
  if (!text || typeof text !== 'string') return null;
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const candidate = extractJsonSubstring(cleaned, expected);
    if (!candidate) return null;
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
};

export const normalizeStringArray = value => {
  if (Array.isArray(value)) {
    return value
      .filter(v => typeof v === 'string')
      .map(v => v.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    return s ? [s] : [];
  }
  return [];
};

export const normalizeMovieRatingData = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  const out = { ...value };

  if (out.year !== undefined && out.year !== null && typeof out.year !== 'string') {
    out.year = String(out.year);
  }

  if (out.kpRating !== undefined && typeof out.kpRating === 'string') {
    const n = Number.parseFloat(out.kpRating.replace(',', '.'));
    if (Number.isFinite(n)) out.kpRating = n;
  }

  if (out.imdbRating !== undefined && typeof out.imdbRating === 'string') {
    const n = Number.parseFloat(out.imdbRating.replace(',', '.'));
    if (Number.isFinite(n)) out.imdbRating = n;
  }

  if (out.kpVotes !== undefined && out.kpVotes !== null && typeof out.kpVotes !== 'string') {
    out.kpVotes = String(out.kpVotes);
  }

  const awards = normalizeStringArray(out.awards);
  if (awards.length > 0) {
    out.awards = awards;
  } else if (out.awards !== undefined) {
    delete out.awards;
  }

  const sources = normalizeStringArray(out.sources);
  if (sources.length > 0) {
    out.sources = sources;
  } else if (out.sources !== undefined) {
    delete out.sources;
  }

  return out;
};

export const normalizeKinoRatePayload = value => {
  if (Array.isArray(value)) return value.map(normalizeMovieRatingData);
  return normalizeMovieRatingData(value);
};
