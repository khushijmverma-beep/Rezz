export const ATS_WEIGHTS = {
  keywords: 40, 
  sections: 15, 
  template: 15,
  contact: 10,
  dates: 10,
  title: 5,
  length: 5,
} as const;

export const KEYWORD_WEIGHTS = {
  required: 2, // skill under a Required header
  preferred: 1, // skill under a Preferred header
  unlabeled: 1.5, // skill under neither
  inContext: 1, // used in a bullet or project: full credit
  listedOnly: 0.6, // only in the Skills list: partial credit
} as const;

export const LENGTH_LIMITS = {
  onePageWords: 650,
  twoPageWords: 1300,
  warnSlack: 150,
  seniorYears: 10,
} as const;

export const HUMAN_WEIGHTS = {
  actionVerbs: 15,
  impact: 15,
  bulletLength: 10,
  relevance: 10,
  order: 10,
  summary: 10,
  aiJudgement: 30,
} as const;


export const STATUS_THRESHOLDS = {
  pass: 0.9,
  warn: 0.5,
} as const;