export interface AiGenerationRequest {
  topic: string;
  systemInstructions: string;
  hashtags: string[];
}

export interface AiGenerationResult {
  caption: string;
  hashtags: string[];
}

const OPENERS = [
  'Frisch reingekommen',
  'Diese Woche bei uns',
  'Nur für kurze Zeit',
  'Kleiner Tipp aus unserem Laden',
  'Gerade entdeckt',
];

const CLOSERS = [
  'Schau vorbei und lass es dir schmecken!',
  'Wir freuen uns auf euren Besuch!',
  'Komm gerne vorbei – wir beraten dich vor Ort.',
  'Sichere dir dein Lieblingsstück, solange der Vorrat reicht.',
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

const DUZEN_HINTS = ['duzen', 'du-form', 'dutzen', 'informell'];

/**
 * Mock-KI-Textgenerator: kombiniert Marken-Vorgaben (systemInstructions),
 * Thema und Hashtags zu einem Social-Media-Vorschlag. Ohne Anbindung an
 * einen externen LLM-Dienst – ersetzbar durch einen echten API-Call mit
 * identischer Signatur.
 */
export function generateSocialPost(request: AiGenerationRequest): AiGenerationResult {
  const seed = hashString(request.topic + request.systemInstructions);
  const opener = pick(OPENERS, seed);
  const closer = pick(CLOSERS, seed >> 3);
  const instructionsLower = request.systemInstructions.toLowerCase();
  const useDu = DUZEN_HINTS.some((hint) => instructionsLower.includes(hint));
  const pronoun = useDu ? 'dich' : 'Sie';
  const verb = useDu ? 'Komm' : 'Kommen Sie';

  const body = request.systemInstructions.trim()
    ? `${request.systemInstructions.trim()}`
    : 'Frische Qualität und persönliche Beratung – das ist Citykauf.';

  const caption = [
    `${opener}: ${request.topic}.`,
    body,
    `${verb} vorbei und überzeug${useDu ? '' : 'en Sie sich'} selbst! Wir freuen uns auf ${pronoun}.`,
    closer,
  ].join(' ');

  const hashtags = Array.from(
    new Set([...request.hashtags, '#Citykauf', '#Einzelhandel', '#Lokal']),
  );

  return { caption, hashtags };
}
