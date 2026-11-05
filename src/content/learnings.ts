/**
 * What each lesson leaves you with, in a few lines: the "Your learnings" summary and Home's idea of the day.
 * Condensed from the lesson content in level1.ts (ILN's Level 1 Workbook). Draft wording, needs ILN's sign-off.
 */
export type Learning = { key: string; points: string[]; ask?: string };

export const learnings: Record<string, Learning> = {
  p1: {
    key: "Be tough on the problem, not on each other.",
    points: ["Your counterpart is a collaborator facing the same situation.", "They have a legitimate reason to be at the table, like you.", "Reframe the talk around the shared problem."],
    ask: "What is the problem we are both trying to solve?",
  },
  p2: {
    key: "Understanding is more powerful than convincing.",
    points: ["Boomerang Effect: push harder and they dig in.", "Naive Realism: you see the world as you are, not as it is.", "Bring questions about their interests, not only arguments."],
    ask: "What is the constraint on their side I can't see yet?",
  },
  p3: {
    key: "Make the pie bigger before you slice it.",
    points: ["Learn what your counterpart values most.", "Offer what is easy for you and valuable to them.", "Secure what is critical to you in return."],
    ask: "How do I make them better off without making myself worse off?",
  },
  p4: {
    key: "Check your emotions, then read theirs.",
    points: ["Reactive Devaluation: judging the offer by the person.", "Anxiety Overlay: fear that makes you concede or avoid.", "Pause and recalibrate before a spiral starts."],
    ask: "How am I feeling right now, and how are they?",
  },
  p5: {
    key: "Stay engaged, not attached.",
    points: ["Anchoring: one early number becomes the reference.", "Focalism: one issue blocks out the rest.", "Keep the whole picture and more than one good result in view."],
    ask: "Am I stuck on one number or one issue?",
  },
  p6: {
    key: "Leave them better than you found them.",
    points: ["Your reputation walks into every room before you.", "Good feelings are contagious and build trust.", "Care about the experience, not only the outcome."],
    ask: "How will they feel about this deal next month?",
  },
  p7: {
    key: "Negotiation is everywhere, and walking away is a choice.",
    points: ["Clients, colleagues, family: the same skills apply.", "Not every negotiation deserves a deal.", "Walk away when goals and values cannot align."],
    ask: "Is this deal still right for both of us?",
  },
  x1: {
    key: "You used the principles with a demanding client.",
    points: ["Marta pushed on price; you kept the relationship.", "You explored her pressure before giving concessions.", "Margin and client both matter."],
  },
  t1: {
    key: "Eight steps, between instinct and structure.",
    points: ["A clear order of phases, with room for the human moments.", "Negotiations aren't linear; go back a step when needed.", "Skip a step entirely and the deal suffers."],
  },
  t2: {
    key: "Prepare, connect, then explore.",
    points: ["Know your walk-away option and your variables.", "Real rapport lowers defences; sweet talk backfires.", "Purposeful questions uncover what isn't on the table."],
    ask: "What could we trade besides price?",
  },
  t3: {
    key: "Find what they need, then build the deal with them.",
    points: ["What they say they want isn't always what they need.", "Test what you hear against what you see.", "People commit to deals they helped shape."],
    ask: "Would timing be as important to you as price?",
  },
  t4: {
    key: "Agree how it will work, then offer a way out.",
    points: ["Define the process: who decides, what if things change.", "Agree how you'll communicate and report progress.", "A way out shows confidence and prevents regret."],
    ask: "If this doesn't feel right, what would we change?",
  },
  t5: {
    key: "Review every negotiation.",
    points: ["Look at the outcome and the process.", "Confirm what each side committed to.", "Regular debriefs improve results by 20 to 25%."],
    ask: "What would I do differently next time?",
  },
  x2: {
    key: "You offered IT a way out, without losing the deal.",
    points: ["Sam had real worries about the rollout.", "You agreed the process, not only the plan.", "Buy-in on paper is not buy-in in spirit."],
  },
  r1: {
    key: "Start with the situation and your desires.",
    points: ["Your emotions are data about what you care about.", "Map the facts, the root issues and every player.", "Want vs need, for you and for them. Find the problem behind the problem."],
    ask: "What do I want, what do I need, and what about them?",
  },
  r2: {
    key: "Prepare your questions, and your order.",
    points: ["Open questions help them share what drives them.", "Prepare answers to what they might ask you.", "The order you present things in shapes the result."],
    ask: "Do I make the first offer, or invite theirs?",
  },
  r3: {
    key: "Know your alternatives, and check the logistics.",
    points: ["Your best alternative (BATNA) is your walk-away.", "Ask how else you could solve the problem.", "Time, place, people and agenda carry power too."],
    ask: "If this option did not exist, what would I do?",
  },
  x3: {
    key: "You negotiated your own offer, prepared.",
    points: ["You knew your alternatives before you spoke.", "You asked before you answered.", "You kept Lena on your side."],
  },
};

/** The whole level on one card: the three lists people should know by heart. */
export const cheat = [
  { module: 1, title: "The 7 Principles", items: ["Your counterpart is not the enemy", "Seek to understand, not to convince", "Create value before capturing value", "Review the emotional state", "Never become over-invested", "Leave them better than you found them", "Opportunities exist everywhere"] },
  { module: 2, title: "The Negotiation Timeline", items: ["Preparation and homework", "Build rapport", "Explore the landscape", "Find what matters most to them", "Create a deal they own", "Define success together", "Offer a way out", "Review the negotiation"] },
  { module: 3, title: "Negotiation Preparation", items: ["Analyse the situation", "List of desires", "Questions", "Strategy planning", "Suite of alternatives", "Logistics"] },
];
