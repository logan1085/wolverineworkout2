/**
 * Pulls workout parameters out of what the user types in chat.
 *
 * This is a deliberately simple keyword pass, not an intent model - it only
 * needs to pre-fill the workout request, and Logan asks follow-up questions for
 * whatever is still blank.
 *
 * It replaces a chain of bare `String.includes` checks, which misfired in ways
 * that were easy to hit:
 *
 *   - "cardio" was listed under the weight-loss rule, which ran first, so
 *     "I want to do cardio" always came out as weight loss and the cardio rule
 *     below it was dead code for its own keyword.
 *   - Bare "lose" matched "close", "pr" matched "press"/"improve"/"prefer",
 *     "size" matched inside other words, and "mass" matched "massage".
 *   - The phrase-based time rules ran after the numeric one and overwrote it,
 *     so "25 minutes, just a quick workout" resolved to 20.
 *
 * Every phrase is matched on word boundaries, and rules are ordered
 * most-specific first.
 */

export interface ConversationContext {
  fitnessLevel: string;
  goals: string;
  timeAvailable: string;
  equipment: string;
  focusAreas: string;
  hasEnoughInfo: boolean;
}

export const EMPTY_CONTEXT: ConversationContext = {
  fitnessLevel: '',
  goals: '',
  timeAvailable: '',
  equipment: '',
  focusAreas: '',
  hasEnoughInfo: false,
};

/** Longest sensible session; anything above is treated as a typo. */
const MAX_DURATION_MINUTES = 240;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * True when any phrase appears as a whole word/phrase.
 *
 * `\b` on both ends is what stops "lose" matching "close". Phrases containing
 * spaces work unchanged, since the boundaries land on the outer edges.
 */
function matchesAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some(phrase =>
    new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i').test(text)
  );
}

type Rule<T extends string> = { value: T; phrases: readonly string[] };

function firstMatch<T extends string>(text: string, rules: readonly Rule<T>[]): T | '' {
  return rules.find(rule => matchesAny(text, rule.phrases))?.value ?? '';
}

const FITNESS_LEVEL_RULES: readonly Rule<string>[] = [
  {
    value: 'beginner',
    phrases: [
      'beginner', 'new to this', 'new to working out', 'just started', 'starting out',
      'never worked out', 'first time', 'out of shape', 'getting back into it',
      'been a while', 'long time since', "haven't exercised", 'have not exercised',
    ],
  },
  {
    value: 'advanced',
    phrases: [
      'advanced', 'experienced', 'very fit', 'athlete', 'serious training',
      'competitive', 'compete', 'powerlifter', 'bodybuilder',
    ],
  },
  {
    value: 'intermediate',
    phrases: [
      'intermediate', 'some experience', 'moderately active', 'work out regularly',
      'exercise sometimes', 'decent shape', 'average fitness', 'a few months',
      'couple years', 'a couple of years',
    ],
  },
];

// Ordered specific -> general. "cardio" now belongs only to cardio fitness.
const GOAL_RULES: readonly Rule<string>[] = [
  {
    value: 'weight loss',
    phrases: [
      'lose weight', 'weight loss', 'fat loss', 'burn fat', 'get lean', 'slim down',
      'drop pounds', 'shed weight', 'lose fat', 'cutting', 'trim down',
    ],
  },
  {
    value: 'muscle building',
    phrases: [
      'build muscle', 'muscle gain', 'gain muscle', 'muscle building', 'bulk',
      'bulking', 'get bigger', 'gain weight', 'hypertrophy', 'put on size',
      'bigger arms',
    ],
  },
  {
    value: 'strength training',
    phrases: [
      'strength', 'get stronger', 'powerlifting', 'lift heavy', 'deadlift',
      'squat', 'squats', 'bench press', 'personal record', 'one rep max',
    ],
  },
  {
    value: 'cardio fitness',
    phrases: [
      'cardio', 'endurance', 'conditioning', 'stamina', 'running', 'run',
      'marathon', 'heart health', 'aerobic',
    ],
  },
  {
    value: 'general fitness',
    phrases: [
      'tone up', 'toning', 'definition', 'get in shape', 'general fitness',
      'stay healthy', 'feel better', 'more energy', 'get fit', 'fitter', 'fitness',
    ],
  },
];

const EQUIPMENT_RULES: readonly Rule<string>[] = [
  {
    value: 'full gym',
    phrases: [
      'full gym', 'gym', 'fitness center', 'weight room', 'machines', 'barbell',
      'barbells', 'membership', 'all equipment', 'everything available',
    ],
  },
  {
    value: 'dumbbells',
    phrases: [
      'dumbbell', 'dumbbells', 'free weights', 'weights at home', 'some weights',
      'weight set', 'kettlebell', 'kettlebells',
    ],
  },
  {
    value: 'resistance bands',
    phrases: ['resistance band', 'resistance bands', 'bands', 'elastic bands'],
  },
  {
    value: 'bodyweight only',
    phrases: [
      'no equipment', 'bodyweight', 'body weight', 'no gym', 'no weights',
      'at home', 'home workout', 'living room', 'my apartment', 'just myself',
      'push ups', 'pushups', 'nothing',
    ],
  },
];

// Consulted only when the message has no explicit number.
const TIME_PHRASE_RULES: readonly Rule<string>[] = [
  { value: '20', phrases: ['quick workout', 'short workout', "don't have much time", 'do not have much time', 'not much time', 'twenty minutes'] },
  { value: '30', phrases: ['half hour', 'half an hour', 'thirty minutes', 'moderate time'] },
  { value: '40', phrases: ['forty minutes'] },
  { value: '45', phrases: ['forty five minutes', 'forty-five minutes'] },
  { value: '60', phrases: ['an hour', 'one hour', 'a full hour', 'long workout', 'extended session'] },
  { value: '90', phrases: ['hour and a half', 'ninety minutes'] },
];

/**
 * Minutes named explicitly, e.g. "40 minutes", "1.5 hours".
 *
 * Takes precedence over the phrase table: a stated number is the strongest
 * signal in the message, and letting phrases win meant an incidental "quick"
 * overrode it.
 */
function extractExplicitMinutes(message: string): string {
  const match = message.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?)\b/i);
  if (!match) return '';

  const amount = parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return '';

  const isHours = /^h/i.test(match[2]);
  const minutes = Math.round(isHours ? amount * 60 : amount);
  if (minutes <= 0) return '';

  return String(Math.min(minutes, MAX_DURATION_MINUTES));
}

/** Phrases that signal "just build me something" without naming a preference. */
const READY_PHRASES = [
  'workout', 'exercise', 'train', 'training', 'ready', "let's go", 'lets go',
  'start', 'go ahead', 'anything', 'surprise me',
] as const;

/**
 * Merge whatever the message reveals into the existing context.
 *
 * Fields already known are only replaced when the new message says something
 * about them, so a later "let's go" cannot blank out an earlier answer.
 */
export function extractContext(
  message: string,
  previous: ConversationContext
): ConversationContext {
  const fitnessLevel = firstMatch(message, FITNESS_LEVEL_RULES) || previous.fitnessLevel;
  const goals = firstMatch(message, GOAL_RULES) || previous.goals;
  const equipment = firstMatch(message, EQUIPMENT_RULES) || previous.equipment;
  const timeAvailable =
    extractExplicitMinutes(message) ||
    firstMatch(message, TIME_PHRASE_RULES) ||
    previous.timeAvailable;

  const hasEnoughInfo = Boolean(
    fitnessLevel ||
      goals ||
      timeAvailable ||
      equipment ||
      previous.hasEnoughInfo ||
      matchesAny(message, READY_PHRASES)
  );

  return {
    fitnessLevel,
    goals,
    timeAvailable,
    equipment,
    focusAreas: previous.focusAreas,
    hasEnoughInfo,
  };
}
