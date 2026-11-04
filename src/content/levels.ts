/**
 * The four EIN levels as one journey, from ILN's programme (strategy deck v4).
 * Each level opens with a short explanation. Level 1 is built; Levels 2-4 are previews.
 * Place names and Level 4 modules are drafts for ILN.
 */
export type LevelInfo = {
  n: 1 | 2 | 3 | 4;
  title: string; // ILN's name for the level
  place: string; // where it sits on the journey
  about: string; // one or two sentences: what this level teaches
  modules: { place: string; title: string; line: string }[];
  outcome: string;
  colour: string;
};

export const LEVELS: LevelInfo[] = [
  {
    n: 1,
    title: "Foundations",
    place: "Quiet Shore",
    about: "The basics every good negotiation rests on. You learn how to see the person across the table, the steps a negotiation goes through, and how to walk in prepared.",
    modules: [
      { place: "The Seven Stones", title: "The 7 Principles", line: "Seven ideas that change how you see your counterpart." },
      { place: "The River Crossing", title: "The Negotiation Timeline", line: "The steps of a negotiation, in order, so you never lose the thread." },
      { place: "The Lookout", title: "Negotiation Preparation", line: "How to prepare, test your guesses and expect the unexpected." },
    ],
    outcome: "A calm, reliable way into any negotiation.",
    colour: "#E4AE36",
  },
  {
    n: 2,
    title: "Tools",
    place: "The Listening Jungle",
    about: "Nine techniques that put the principles to work. You learn to ask questions that open people up, build real connection, and close deals that hold.",
    modules: [
      { place: "The Hourglass Clearing", title: "Asking good questions", line: "Open, narrow, then wide, and why-plus to find what people value." },
      { place: "The Canopy Walk", title: "Empathy and rapport", line: "Acknowledge, summarise and name feelings to bring people closer." },
      { place: "The Vine Gate", title: "Deals that stick", line: "Reframe, set expectations early and always leave a way out." },
    ],
    outcome: "Techniques you can use in your next conversation.",
    colour: "#AE36E4",
  },
  {
    n: 3,
    title: "Your own style",
    place: "Ember Ridge",
    about: "Three frameworks to make EIN yours. You learn to really listen, stay steady when things heat up, and think creatively under pressure.",
    modules: [
      { place: "The Echo Canyon", title: "Active listening", line: "Presence, space, clarity and interest. Hear what sits under the words." },
      { place: "The Hot Springs", title: "Managing emotions", line: "Prepare, be aware, reset and speak up, in yourself and in others." },
      { place: "The Forge", title: "Creative thinking", line: "Build deals that are worth it for everyone at the table." },
    ],
    outcome: "A negotiating style that is truly your own.",
    colour: "#36E4AD",
  },
  {
    n: 4,
    title: "Advanced",
    place: "The Table",
    about: "The hardest conversations. You learn to work through conflict, capture the full value of a deal, and spot the tactics people use to manipulate.",
    modules: [
      { place: "The Storm Pass", title: "Dealing with conflict", line: "Stay calm and useful when it gets tense." },
      { place: "The Terraces", title: "Maximising value", line: "Leave nothing on the table, for either side." },
      { place: "The Hall of Mirrors", title: "Techniques that manipulate", line: "Recognise them, name them and stay in control." },
    ],
    outcome: "A seat at any table, as a great communicator.",
    colour: "#0A0938",
  },
];
