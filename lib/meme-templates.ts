export type MemeCaptionTone =
  "funny" | "witty" | "sarcastic" | "relatable" | "dry" | "playful";

export type MemeTextBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  align?: CanvasTextAlign;
  color?: string;
  stroke?: string;
  uppercase?: boolean;
  fontMax?: number;
  fontMin?: number;
};

export type MemeTemplate = {
  id: string;
  name: string;
  description: string;
  tone: MemeCaptionTone;
  file: string;
  width: number;
  height: number;
  boxes: MemeTextBox[];
  examples: string[];
};

export const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: "bro-explaining",
    name: "Bro explaining",
    description:
      "Someone confidently over-explains something while the other person is clearly not convinced.",
    tone: "sarcastic",
    examples: [
      "AI made the workflow 10x faster",
      "Still waiting for the output to get 10x better",
    ],
    file: "bro_explaining.png",
    width: 800,
    height: 450,
    boxes: [
      { x: 382, y: 28, width: 245, height: 120, fontMax: 34 },
      { x: 70, y: 28, width: 285, height: 105, fontMax: 32 },
    ],
  },
  {
    id: "waiting-skeleton",
    name: "Waiting skeleton",
    description:
      "Waiting so long for something to happen that the wait itself becomes the joke.",
    tone: "dry",
    examples: ["Waiting for the AI draft that does not need rewriting"],
    file: "waiting_skeleton.jpg",
    width: 500,
    height: 676,
    boxes: [{ x: 46, y: 285, width: 408, height: 120, fontMax: 36 }],
  },
  {
    id: "empire-state-building-announcement",
    name: "Empire State announcement",
    description:
      "Making an extremely public, dramatic announcement that could have been said normally.",
    tone: "playful",
    examples: ["GPT is better than Fable"],
    file: "empire_state_building_ climbers.png",
    width: 729,
    height: 500,
    boxes: [{ x: 34, y: 28, width: 660, height: 110, fontMax: 38 }],
  },
  {
    id: "i-bet-hes-thinking",
    name: "I bet he's thinking",
    description:
      "Someone assumes the other person is thinking about something serious or romantic, but they are actually obsessing over a random niche problem.",
    tone: "relatable",
    examples: [
      "Her: I bet he's thinking about someone else",
      "Him: Why does the AI output get faster but not better?",
    ],
    file: "i_bet_hes_thinking_about_other_women .png",
    width: 889,
    height: 500,
    boxes: [
      { x: 36, y: 34, width: 360, height: 105, fontMax: 34 },
      { x: 500, y: 34, width: 340, height: 105, fontMax: 34 },
    ],
  },
  {
    id: "they-dont-know",
    name: "They don't know",
    description:
      "Standing quietly in a crowd while holding a niche personal win or secret that nobody else realizes.",
    tone: "dry",
    examples: ["They don't know I got my Fable limit reset today"],
    file: "they_dont_know .png",
    width: 500,
    height: 501,
    boxes: [{ x: 32, y: 24, width: 305, height: 105, fontMax: 32 }],
  },
  {
    id: "bell-curve",
    name: "Bell curve",
    description:
      "The beginner and expert agree on a simple truth while the overthinker in the middle makes it complicated.",
    tone: "dry",
    examples: [
      "Just ship it",
      "But the system architecture needs another abstraction layer",
      "Just ship it",
    ],
    file: "bell_curve_meme.png",
    width: 675,
    height: 499,
    boxes: [
      { x: 28, y: 52, width: 185, height: 100, fontMax: 28 },
      { x: 245, y: 24, width: 190, height: 105, fontMax: 26 },
      { x: 480, y: 52, width: 170, height: 100, fontMax: 28 },
    ],
  },
  {
    id: "third-world-skeptical-kid",
    name: "Skeptical kid",
    description:
      "A doubtful reaction to something that sounds fake, exaggerated, or too convenient.",
    tone: "dry",
    examples: ["So the AI “saved time” but you still rewrote everything?"],
    file: "third_world_skeptical_kid.png",
    width: 500,
    height: 500,
    boxes: [{ x: 30, y: 24, width: 440, height: 105, fontMax: 34 }],
  },
  {
    id: "undertaker-behind",
    name: "Undertaker behind",
    description:
      "Someone thinks they escaped the problem, but the real problem is quietly standing right behind them.",
    tone: "dry",
    examples: ["Me celebrating the bug fix", "The edge case waiting behind me"],
    file: "undertaker.png",
    width: 639,
    height: 500,
    boxes: [
      { x: 34, y: 30, width: 260, height: 95, fontMax: 30 },
      { x: 350, y: 30, width: 245, height: 95, fontMax: 30 },
    ],
  },
  {
    id: "man-holding-cardboard-sign",
    name: "Cardboard sign",
    description:
      "A blunt public message, opinion, or announcement held up for everyone to notice.",
    tone: "dry",
    examples: ["Your AI output is only useful after the second rewrite"],
    file: "man_holding_cardboard_sign.png",
    width: 500,
    height: 500,
    boxes: [
      {
        x: 205,
        y: 55,
        width: 155,
        height: 150,
        fontMax: 24,
        color: "#111827",
        stroke: "transparent",
      },
    ],
  },
  {
    id: "tony-soprano-in-this-house",
    name: "In this house",
    description:
      "A loud, non-negotiable house rule or strongly held opinion delivered with absolute conviction.",
    tone: "sarcastic",
    examples: ["In this house, faster AI output still has to be good"],
    file: "tony_soprano_in_this_house.png",
    width: 660,
    height: 378,
    boxes: [{ x: 28, y: 22, width: 595, height: 88, fontMax: 34 }],
  },
];

export function getMemeTemplate(
  id: string | null | undefined,
): MemeTemplate | null {
  if (!id) return null;
  return MEME_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function fitCaptionsToTemplate(
  captions: string[],
  template: MemeTemplate,
): string[] {
  const next = captions.slice(0, template.boxes.length);
  while (next.length < template.boxes.length) {
    next.push(
      template.examples[next.length] ?? template.examples[0] ?? "That moment",
    );
  }
  return next;
}

export function defaultMemeTemplate(): MemeTemplate {
  return MEME_TEMPLATES[0]!;
}
