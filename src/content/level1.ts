/**
 * EIN Level 1 · Foundations.
 *
 * Source: ILN's "Level 1 Workbook" (Lee Smallwood and Tony Anagor), 72 pages.
 * Lesson ideas, examples, quotes and reflection prompts are taken from the workbook
 * (page numbers in `page`). The interactive exercises (cards, quizzes, role-plays)
 * turn the workbook's own exercises and examples into practice; their wording,
 * answers and fictional characters still need ILN's sign-off.
 * Videos are placeholders until ILN records them (hosted on Mux later).
 */

export type Person = { name: string; role: string; initials: string; tone: "gold" | "purple" | "mint" };

export type Step =
  | { k: "video"; captions: string[] }
  | { k: "insight"; idea: string; tryIt: string; page?: number; example?: { title: string; body: string }; quote?: { text: string; by: string } }
  | { k: "choice"; q: string; options: string[]; answer: number; why: string }
  | { k: "swipe"; prompt: string; left: string; right: string; cards: { text: string; side: "left" | "right"; why: string }[] }
  | { k: "order"; prompt: string; items: string[]; why: string }
  | { k: "read"; who: Person; line: string; options: string[]; answer: number; why: string }
  | {
      k: "roleplay";
      who: Person;
      setup: string;
      goal: string;
      turns: { them: string; options: { text: string; d: number; reply: string; note: string }[] }[];
      outcomes: { high: string; mid: string; low: string };
    };

export type Lesson = { id: string; module: number; title: string; minutes: number; practice?: boolean; steps: Step[] };
export type Module = { n: number; title: string; outcome: string };

export const level = { n: 1, title: "Foundations", workshop: "The hidden side of negotiation" };

export const modules: Module[] = [
  { n: 1, title: "The 7 Principles", outcome: "Seven principles that become a natural part of how you negotiate." },
  { n: 2, title: "The Negotiation Timeline", outcome: "Eight steps that keep you grounded, intentional and effective." },
  { n: 3, title: "Negotiation Preparation", outcome: "Six steps to walk in prepared, calm and ready for surprises." },
];

/** People you meet at the table. Fictional, for practice only. */
export const people = {
  marta: { name: "Marta Ruiz", role: "Head of Procurement, your biggest client", initials: "MR", tone: "purple" },
  daniel: { name: "Daniel Okafor", role: "Your colleague in Finance", initials: "DO", tone: "gold" },
  priya: { name: "Priya Shah", role: "Client, operations director", initials: "PS", tone: "mint" },
  sam: { name: "Sam Lindqvist", role: "Head of IT", initials: "SL", tone: "gold" },
  lena: { name: "Lena Vogel", role: "Head of Talent at the firm that made you an offer", initials: "LV", tone: "mint" },
  tom: { name: "Tom Becker", role: "Your manager", initials: "TB", tone: "gold" },
} satisfies Record<string, Person>;

export const XP = { video: 5, insight: 5, right: 10, roleplay: 30 };

export const lessons: Lesson[] = [
  // ───────────────────────── Module 1 · The 7 Principles ─────────────────────────
  {
    id: "p1",
    module: 1,
    title: "Your counterpart is not the enemy",
    minutes: 3,
    steps: [
      { k: "video", captions: ["Your counterpart has a legitimate reason for being at the table.", "They have interests to protect and a deal to reach, just like you.", "Be tough on the problem. Not on each other."] },
      {
        k: "insight",
        page: 8,
        idea: "Your counterpart is, in fact, your collaborator. You are both facing a shared challenge: the situation that needs resolving. Shift from trying to beat the other side to working together against the problem, and the whole dynamic changes.",
        example: {
          title: "Samsung and Sony, 2014",
          body: "Two of the fiercest rivals in electronics signed a landmark cross-licensing agreement. Instead of fighting over patents, they chose to be tough on the situation (keeping pace with digital technology) rather than tough on each other, and both kept their lead in the market.",
        },
        quote: { text: "Emotions are not reactions to the world; they are your constructions of the world.", by: "Lisa Feldman Barrett" },
        tryIt: "Think of a counterpart who seems highly competitive and uninterested in collaborating. How could you reframe the negotiation around the shared problem rather than the adversarial dynamics?",
      },
      {
        k: "swipe",
        prompt: "Tough on the problem, or tough on the person?",
        left: "On the person",
        right: "On the problem",
        cards: [
          { text: "They're only here to squeeze us.", side: "left", why: "A win-lose mindset creates mistrust and defensiveness before you start." },
          { text: "We both need this contract to hold for three years. How do we make it work?", side: "right", why: "You name the shared situation and invite them to tackle it with you." },
          { text: "Give nothing away until they blink.", side: "left", why: "A battle of wills. Nobody is solving the problem." },
          { text: "What's the pressure on your side that I'm not seeing?", side: "right", why: "Your counterpart has interests to protect too. Curiosity opens the dialogue." },
        ],
      },
      {
        k: "choice",
        q: "In the workbook's Samsung and Sony example, what made the agreement possible?",
        options: ["Sony conceded most of its patents to avoid a lawsuit.", "Both saw a common challenge and pooled their strengths instead of competing over it.", "Samsung threatened to leave the market."],
        answer: 1,
        why: "They recognised a shared interest (keeping pace with fast-moving digital technology) and chose to co-create value rather than fight over it.",
      },
    ],
  },
  {
    id: "p2",
    module: 1,
    title: "Seek to understand, not to convince",
    minutes: 4,
    steps: [
      { k: "video", captions: ["The harder you push to convince someone, the more resistant they become.", "That's the Boomerang Effect.", "So ask, listen, and understand before you make your case."] },
      {
        k: "insight",
        page: 12,
        idea: "Two biases derail negotiations. The Boomerang Effect: the harder you push to convince, the more your counterpart digs in. Naive Realism: believing you see the world exactly as it is, so anyone who disagrees must be misinformed. Understanding is more powerful than convincing.",
        example: {
          title: "Richard Holbrooke at the United Nations, 2000",
          body: "The US wanted its UN contribution cut from 25% to 22%. Convincing member states failed. Holbrooke instead listened to each one and found the real constraint: their budgets for 2001 were already set. His compromise delayed their increases until 2002, and the deal went through.",
        },
        quote: { text: "We don't see things as they are, we see them as we are.", by: "Anaïs Nin" },
        tryIt: "Identify a situation in your field where trying to convince your counterpart could lead to resistance. Prepare questions that explore their interests instead of arguments that defend yours.",
      },
      {
        k: "roleplay",
        who: people.daniel,
        setup: "You've asked Finance to fund a new tool for your team. Daniel has just read your proposal.",
        goal: "Understand his objection before you argue your case.",
        turns: [
          {
            them: "Honestly? I don't think we can approve this. Not this quarter.",
            options: [
              { text: "But the tool pays for itself in six months. Let me walk you through the numbers again.", d: -15, reply: "I've read the numbers. That's not the issue.", note: "The Boomerang Effect. You pushed, he dug in." },
              { text: "Okay. What's making this quarter difficult?", d: 20, reply: "We're under a hiring freeze, and every new cost gets questioned by the board.", note: "One open question, and you found the real constraint, just as Holbrooke did." },
              { text: "Fine, I'll take it to my director then.", d: -25, reply: "Sure. Go ahead.", note: "Going over his head ends the dialogue and costs you trust." },
            ],
          },
          {
            them: "So anything new looks bad right now, even if it's a good idea.",
            options: [
              { text: "So the risk for you is defending a new cost to the board. Have I got that right?", d: 20, reply: "Exactly. If I could show it saves money elsewhere, that would change things.", note: "Saying back what you heard makes him feel understood, and he offers the way forward." },
              { text: "Every team has a freeze. Mine still needs the tool.", d: -10, reply: "Then you know where I stand.", note: "Naive Realism: you assume your view is the only reasonable one." },
              { text: "Could we split it across two quarters?", d: 5, reply: "Maybe. It's still a new cost, though.", note: "A fair idea, but you jumped to a fix before you understood what matters most to him." },
            ],
          },
        ],
        outcomes: {
          high: "Daniel offers to help you build the savings case. You leave with an ally.",
          mid: "Daniel will look at it again, without much enthusiasm.",
          low: "Daniel says no, and the next request will be harder.",
        },
      },
    ],
  },
  {
    id: "p3",
    module: 1,
    title: "Create value before capturing value",
    minutes: 3,
    steps: [
      { k: "video", captions: ["The instinct is to grab as much of the pie as you can.", "The best negotiators first make the pie bigger.", "Ask: how do I make my counterpart better off without making myself worse off?"] },
      {
        k: "insight",
        page: 14,
        idea: "The true power of negotiation lies in creating value before trying to claim it. Expand the pie: understand your counterpart's priorities, then offer what is easy for you to give and valuable to them, while securing something critical in return.",
        example: {
          title: "The Air Jordan deal, 1984",
          body: "Michael Jordan had no interest in Nike. Instead of a standard endorsement fee, Nike built a brand around him, gave him a share of the revenue and designed a shoe with his input. Value first. The line made over $100 million in its first year and turned Nike into the dominant basketball brand.",
        },
        quote: { text: "In a negotiation, emotions convey to you the relative importance of your concerns.", by: "Daniel Shapiro" },
        tryIt: "Think of a deal on your desk. List three things that are easy for you to offer and valuable to the other side. Then note the risks: what could backfire, as it could have for Nike?",
      },
      {
        k: "swipe",
        prompt: "Does this move create value, or just capture it?",
        left: "Captures",
        right: "Creates",
        cards: [
          { text: "Meet in the middle on price.", side: "left", why: "Splitting the difference only divides what's already there." },
          { text: "Faster delivery in exchange for a longer contract.", side: "right", why: "Cheap for you, valuable for them. Both gain." },
          { text: "Share the upside: they earn more as the product succeeds.", side: "right", why: "Nike's move with Jordan. Aligned interests grow the pie." },
          { text: "Spot their weakness and go for the kill.", side: "left", why: "Short-term gain, long-term value lost. The workbook calls this the common mistake." },
        ],
      },
      {
        k: "choice",
        q: "Which question does the workbook suggest you ask yourself while creating value?",
        options: ["How much can I take before they walk away?", "How do I make my counterpart better off without making myself worse off?", "What's the lowest number they'll accept?"],
        answer: 1,
        why: "That question keeps you looking for mutual gains instead of a narrow win.",
      },
    ],
  },
  {
    id: "p4",
    module: 1,
    title: "Review the emotional state of the negotiators",
    minutes: 4,
    steps: [
      { k: "video", captions: ["Unchecked emotions cloud judgment and derail prepared discussions.", "Reactive Devaluation. Anxiety Overlay.", "Check in on yourself, then read the other side."] },
      {
        k: "insight",
        page: 17,
        idea: "Reactive Devaluation: judging an offer by your feelings about the person who makes it, not its merits. Anxiety Overlay: fear of conflict that makes you concede too much or avoid negotiating. Check your own state regularly, and read your counterpart's, so you can pause and recalibrate before a spiral starts.",
        example: {
          title: "Amazon and the RWDSU, 2021",
          body: "During the union vote at the Bessemer warehouse, both sides viewed every proposal with suspicion (Reactive Devaluation) while workers feared retaliation and leadership feared a spreading precedent (Anxiety Overlay). The vote produced a result, but the unaddressed emotions left lasting resentment.",
        },
        quote: { text: "Emotions are the unseen architects of our decisions. To negotiate effectively, we must first manage the tides within ourselves and recognise the currents in others.", by: "Tony Anagor" },
        tryIt: "Before your next negotiation, write down how you feel about the person across the table. Then ask: am I judging their offer, or my feelings about them?",
      },
      {
        k: "read",
        who: people.priya,
        line: "Look, we can discuss it. I just don't see why we'd change a process that works for us.",
        options: ["Hostile. She's shutting the door.", "Guarded. She's open, but she needs to feel the change is safe.", "On board. She's ready to sign."],
        answer: 1,
        why: "Anxiety Overlay often sounds like this. She is still talking, but defending the familiar. Address the worry directly before pushing the proposal.",
      },
      {
        k: "read",
        who: people.marta,
        line: "You know what, forget the discount. I'm not sure I trust the numbers your side sends anymore.",
        options: ["Reactive Devaluation. She's rejecting the offer because of how she feels about you.", "She's bluffing to get a bigger discount.", "She's happy with the current deal."],
        answer: 0,
        why: "She has stopped weighing the offer on its merits. Rebuild trust first; no number will land until you do.",
      },
    ],
  },
  {
    id: "p5",
    module: 1,
    title: "Never become over-invested in a specific outcome",
    minutes: 3,
    steps: [
      { k: "video", captions: ["Anchoring bias: one number becomes the reference for everything.", "Focalism: one issue blocks out the rest.", "Stay fully engaged, and not rigidly attached."] },
      {
        k: "insight",
        page: 20,
        idea: "Anchoring bias makes an early idea the reference point for the whole discussion. Focalism puts too much attention on one issue and neglects the rest. Both create tunnel vision. Stay fully engaged in the process, but not rigidly tied to one result.",
        example: {
          title: "Blockbuster and Netflix, early 2000s",
          body: "Netflix proposed that Blockbuster acquire it for $50 million. Anchored to its store model and late fees, and focused narrowly on short-term profit, Blockbuster dismissed the offer. Netflix pivoted to streaming. Blockbuster filed for bankruptcy in 2010.",
        },
        tryIt: "For a decision this week, ask the workbook's three questions: Am I clinging to this because it fits my goals, or because it feels safe? What else could create more value for everyone? What part is my ego playing?",
      },
      {
        k: "choice",
        q: "You've prepared for one outcome: a 10% price increase. The client suddenly proposes a larger, multi-year deal at a lower rate. What does Principle 5 suggest?",
        options: ["Hold firm. 10% was the plan.", "Step back and reassess. The new option may create more value than the one you anchored on.", "Reject it. Anything off-plan is a trick."],
        answer: 1,
        why: "Non-attachment means staying flexible when a better alternative emerges, instead of defending your anchor.",
      },
      {
        k: "swipe",
        prompt: "Which bias is at work?",
        left: "Anchoring",
        right: "Focalism",
        cards: [
          { text: "They opened at 80, so anything above 80 feels like a loss.", side: "left", why: "The first number became the reference point." },
          { text: "All I can think about is the delivery date. Price, support, terms can wait.", side: "right", why: "One issue is crowding out everything else." },
          { text: "We said €2m last year, so €2m is the deal.", side: "left", why: "An old figure anchors a new conversation." },
          { text: "If we don't get exclusivity, nothing else matters.", side: "right", why: "A single term has become the whole negotiation." },
        ],
      },
    ],
  },
  {
    id: "p6",
    module: 1,
    title: "Leave your counterpart better than you found them",
    minutes: 3,
    steps: [
      { k: "video", captions: ["A negotiation cannot be truly successful if your counterpart leaves regretful.", "Your reputation walks into every room before you do.", "Focus on the experience, not only the outcome."] },
      {
        k: "insight",
        page: 23,
        idea: "Your reputation is social proof: people decide how to treat you based on how others experienced you. Positive emotions are contagious, so a counterpart who feels good about the interaction sees you as trustworthy and competent, avoids buyer's remorse, and returns the goodwill (reciprocity).",
        example: {
          title: "Nelson Mandela and the end of apartheid",
          body: "After 27 years in prison, Mandela negotiated the transition to democracy as partners in a shared future, not as enemies. He addressed the fears of the white minority directly, with guarantees on property and minority rights. His reputation for fairness made the agreement hold.",
        },
        tryIt: "After your next agreement, ask yourself how you would assess whether your counterpart is truly aligned, not just signed. What would you look for?",
      },
      {
        k: "choice",
        q: "A deal closes in your favour, but the other side leaves feeling pressured. According to the workbook, what is the likely result?",
        options: ["Nothing. A signed deal is a done deal.", "Underperformance, resentment or even the breakdown of the agreement.", "They'll respect you more next time."],
        answer: 1,
        why: "Emotional dissatisfaction, especially when one party feels bullied, undermines execution and the relationship.",
      },
      {
        k: "swipe",
        prompt: "Will this leave them better than you found them?",
        left: "Worse",
        right: "Better",
        cards: [
          { text: "Check their emotional state before the final signature.", side: "right", why: "Regularly checking in avoids buyer's remorse and builds trust." },
          { text: "Rush the close while they're tired.", side: "left", why: "Decisions made under pressure get regretted, then resisted." },
          { text: "Make them an active contributor to the terms.", side: "right", why: "People commit to what they helped shape." },
          { text: "Win the last point just to win it.", side: "left", why: "Short-term satisfaction, long-term cost to your reputation." },
        ],
      },
    ],
  },
  {
    id: "p7",
    module: 1,
    title: "Negotiation opportunities exist everywhere",
    minutes: 3,
    steps: [
      { k: "video", captions: ["Opportunities to negotiate are everywhere.", "But not every negotiation deserves a deal.", "Real skill is knowing when to stay and when to walk away."] },
      {
        k: "insight",
        page: 26,
        idea: "Mastering EIN transforms how you approach conversations everywhere, from clients to colleagues to family. But not every negotiation leads to a favourable outcome. Walking away is not a failure; it is often the most strategic choice when goals and values cannot align.",
        tryIt: "Count the negotiations you have tomorrow: deadlines, roles, budgets, whose turn it is. For each one, decide: engage, or let it go?",
      },
      {
        k: "swipe",
        prompt: "Stay at the table, or walk away?",
        left: "Walk away",
        right: "Stay",
        cards: [
          { text: "Their terms would force you to break a promise to your own team.", side: "left", why: "When values cannot align, walking away protects your integrity." },
          { text: "They're tough, but they keep asking what would work for you.", side: "right", why: "A demanding counterpart who stays curious is worth the effort." },
          { text: "Every concession you make is met with a new demand and no movement.", side: "left", why: "No value is being created. Assess whether it's worth continuing." },
          { text: "You disagree on price but agree on what success looks like.", side: "right", why: "Shared goals mean there's a deal to find." },
        ],
      },
      {
        k: "choice",
        q: "The workbook's integrative exercise asks you to spot the principles in action. Which principle did you naturally use in your last negotiation?",
        options: ["Pick any. There's no wrong answer here.", "I never use any of them.", "They only apply to big deals."],
        answer: 0,
        why: "Reflection is the point. The workbook suggests doing this with a partner: which principles did you use, and where did you miss a chance to apply one?",
      },
    ],
  },
  {
    id: "x1",
    module: 1,
    title: "The supplier call",
    minutes: 4,
    practice: true,
    steps: [
      {
        k: "roleplay",
        who: people.marta,
        setup: "Your biggest client wants a 15% price cut on renewal. Marta has called you before her board meeting.",
        goal: "Keep the client, protect your margin, and use the principles.",
        turns: [
          {
            them: "I'll be direct. We need 15% off, or I have to put this out to tender.",
            options: [
              { text: "15%? That's not going to happen.", d: -20, reply: "Then I don't think we have much to talk about.", note: "A flat no treats her as an opponent (Principle 1). She digs in." },
              { text: "That's a big number. What's driving it on your side?", d: 20, reply: "The board has cut every budget by 10%. I have to show savings, or they'll make the choice for me.", note: "Principles 1 and 2: a partner in the problem, and understand before you convince." },
              { text: "Okay, let me see what I can do on price.", d: -5, reply: "Good. I'll need the new number by Friday.", note: "Anxiety Overlay: you conceded before you knew what she needs." },
            ],
          },
          {
            them: "So I need something I can show the board as a saving.",
            options: [
              { text: "What if we kept the price, moved you to annual billing with a 5% saving, and added training for your new team?", d: 25, reply: "Annual billing works for our cash flow. And the training would help. Let me see if the board buys it.", note: "Principle 3: you created value before capturing it." },
              { text: "I can do 10%, but that's my final offer.", d: 0, reply: "10 is better than nothing. I'll take it to them.", note: "A deal, but you only split value. Both of you lost something." },
              { text: "If the board is forcing this, maybe we should talk to the board directly.", d: -15, reply: "That's not how this works.", note: "You went around her. Reputation damaged (Principle 6)." },
            ],
          },
          {
            them: "I'll be honest, I'd rather stay with you than run a tender.",
            options: [
              { text: "I'd rather that too. Shall we agree a check-in in three months so you can show the board it's working?", d: 15, reply: "Yes. That gives me something concrete to report.", note: "Principle 6: she leaves with a story she can tell, and a way to stay confident in the deal." },
              { text: "Great. Then sign by Friday and we're done.", d: -10, reply: "Let's not rush it.", note: "You pushed the close. Anchored to the signature, not the relationship." },
              { text: "Just remember we've been very flexible here.", d: -15, reply: "Noted.", note: "A small dig at the end undoes a good conversation." },
            ],
          },
        ],
        outcomes: {
          high: "Marta takes your proposal to the board as her idea. You keep the client and the margin.",
          mid: "You keep the client, at a price that hurts. The relationship is fine.",
          low: "The contract goes to tender. Marta stops answering your calls.",
        },
      },
    ],
  },

  // ───────────────────────── Module 2 · The Negotiation Timeline ─────────────────────────
  {
    id: "t1",
    module: 2,
    title: "The timeline in eight steps",
    minutes: 3,
    steps: [
      { k: "video", captions: ["Negotiations that look seamless are rarely spontaneous.", "The EIN Timeline sits between instinct and structure.", "Eight steps. Skip one entirely, and the deal suffers."] },
      {
        k: "insight",
        page: 30,
        idea: "You can negotiate purely on intuition, or follow a rigid script. The EIN Negotiation Timeline blends both: a clear sequence of phases, with the freedom to navigate the human moments in between. Negotiations aren't linear, so you'll often revisit an earlier step, like rebuilding rapport when trust erodes.",
        tryIt: "Think of your last negotiation. Which of the eight steps did you skip, and what did it cost you?",
      },
      {
        k: "order",
        prompt: "Put the eight steps of the EIN Negotiation Timeline in order.",
        items: ["Preparation and homework", "Build rapport and connection", "Explore the negotiation landscape", "Identify what's most important to your counterpart", "Create a deal where they have buy-in", "Mutually define success milestones", "Offer your counterpart a way out", "Review the negotiation"],
        why: "Preparation comes first and review comes last. Everything in between builds on the step before.",
      },
      {
        k: "choice",
        q: "Rapport starts to erode in the middle of a critical discussion. What does the workbook recommend?",
        options: ["Push on. Going back is a sign of weakness.", "Return to the rapport step and rebuild trust before continuing.", "Skip straight to the offer to close quickly."],
        answer: 1,
        why: "The timeline is flexible on purpose. Revisiting an earlier phase as circumstances evolve is part of using it well.",
      },
    ],
  },
  {
    id: "t2",
    module: 2,
    title: "Homework, rapport, and the landscape",
    minutes: 4,
    steps: [
      { k: "video", captions: ["Step 1: know your walk-away alternative and your variables.", "Step 2: build genuine rapport. Oxytocin is real.", "Step 3: explore the landscape with purposeful questions."] },
      {
        k: "insight",
        page: 32,
        idea: "Step 1, Preparation: define your walk-away alternative and list your variables (price, delivery terms, financing, training) because every negotiation is an exchange of concessions. Step 2, Rapport: genuine connection triggers oxytocin and reduces defensiveness; sweet talk backfires. Step 3, Explore: purposeful questions, active listening and testing hypotheses uncover what isn't yet on the table.",
        example: {
          title: "The Arsenal fan",
          body: "In light conversation you discover your counterpart is an avid Arsenal fan, and you happen to have season tickets. Revealed casually, that shared interest can later become a bridge for goodwill when tensions rise. The critical factor is authenticity.",
        },
        quote: { text: "We are more likely to comply with requests made by people that we like.", by: "Dr Robert Cialdini" },
        tryIt: "Write three questions designed to uncover hidden interests, such as \"What factors are influencing your decision on this?\" or \"Who else might be impacted by this agreement?\" Then test them in a role-play with a colleague.",
      },
      {
        k: "swipe",
        prompt: "Rapport or sweet talk?",
        left: "Sweet talk",
        right: "Rapport",
        cards: [
          { text: "\"I loved your talk last month. The point about onboarding stuck with me.\"", side: "right", why: "Specific and genuine. It opens a real connection." },
          { text: "\"You're clearly the smartest person in this company.\"", side: "left", why: "Flattery without substance. People sense manipulation and trust drops." },
          { text: "Match their direct tone and get to their priorities quickly.", side: "right", why: "For people who prefer business first, rapport is built by respecting that." },
          { text: "Pretend to share a hobby you know nothing about.", side: "left", why: "Inauthentic small talk erodes trust the moment it shows." },
        ],
      },
      {
        k: "choice",
        q: "Which of these is a hypothesis-testing question from Step 3?",
        options: ["\"Can you do it cheaper?\"", "\"If this term were adjusted, how would that impact your priorities?\"", "\"Are we done yet?\""],
        answer: 1,
        why: "It validates your assumption about what matters to them and can reveal constraints that hadn't been disclosed.",
      },
    ],
  },
  {
    id: "t3",
    module: 2,
    title: "What matters most, and a deal they own",
    minutes: 4,
    steps: [
      { k: "video", captions: ["What your counterpart says they want isn't always what they need.", "Test it. Then build the deal with them, not for them.", "People commit to agreements they helped shape."] },
      {
        k: "insight",
        page: 36,
        idea: "Step 4: untangle what your counterpart says they want from what they actually need. Logic alone isn't enough; decisions are tied to emotion (Damasio's research). Be brave enough to test what they say against what you observe. Step 5: invite them to co-create the deal. Autonomy drives buy-in, and a deal they call theirs reduces friction and gets executed.",
        example: {
          title: "Cost, or speed?",
          body: "A counterpart insists cost is their top priority, but every question they ask is about delivery speed. A skilled negotiator tests it: \"You've mentioned cost as a key concern, but I've also noticed how important meeting your deadlines is to you. Would you say timing might be as critical as pricing here?\"",
        },
        tryIt: "Think about your next negotiation. Write down what is most important to you going in, and the steps you'll take to uncover and test your counterpart's priorities.",
      },
      {
        k: "roleplay",
        who: people.priya,
        setup: "Priya wants your team to deliver a new reporting system in eight weeks. You think it needs twelve.",
        goal: "Find what matters most to her, then shape the deal together.",
        turns: [
          {
            them: "Eight weeks. That's what I need. Can you do it or not?",
            options: [
              { text: "Twelve is realistic. Eight is a stretch.", d: -10, reply: "Then I'll have to look at other options.", note: "You answered the demand, not the need behind it." },
              { text: "I can see the timeline matters a lot. What happens for you at the eight-week mark?", d: 20, reply: "Our board reviews the quarter then. I need to show them something that works.", note: "Step 4: her stated want is eight weeks. Her need is a working demo for the board." },
              { text: "Why eight? That seems arbitrary.", d: -15, reply: "It isn't. But I don't owe you an explanation.", note: "Challenging the number instead of exploring the need puts her on the defensive." },
            ],
          },
          {
            them: "If the board sees nothing, this whole project is at risk.",
            options: [
              { text: "So the board demo is the real deadline. What if we deliver the three reports they'll ask about by week eight, and the rest by twelve? How would you want to shape that?", d: 25, reply: "That could work. Let me pick which three.", note: "Step 5: you invited her to co-create. The deal becomes hers." },
              { text: "We'll push the team hard and try for eight.", d: 0, reply: "Try isn't a plan.", note: "You over-committed to her stated want and ignored the need." },
              { text: "Then you should have started the project earlier.", d: -25, reply: "Excuse me?", note: "Tough on the person, not the problem." },
            ],
          },
        ],
        outcomes: {
          high: "Priya chooses the three reports herself and presents the phased plan as her own. The board approves.",
          mid: "You've got a deadline, but not much ownership on her side.",
          low: "Priya goes to another supplier. The relationship cools.",
        },
      },
    ],
  },
  {
    id: "t4",
    module: 2,
    title: "Define success, then offer a way out",
    minutes: 4,
    steps: [
      { k: "video", captions: ["A negotiation is only as successful as its execution.", "Agree the substance, and agree the process.", "Then offer a way out. It's a sign of confidence, not weakness."] },
      {
        k: "insight",
        page: 38,
        idea: "Step 6: define success milestones together, not just the substance (price, deadlines) but the process: who decides, what happens if things change, what's urgent, how you'll communicate, who reports progress. Step 7: before finalising, offer a way out. Non-attachment is a hallmark of confident negotiators; a deal signed under pressure leads to buyer's remorse and unravels later.",
        example: {
          title: "Offering a way out, in practice",
          body: "A supplier hesitates on delivery timelines. Instead of pushing for a signature, you ask: \"I sense that the timelines might be challenging. Would you like to revisit this and see if there's a better solution for both of us?\" They clarify their concern, and you co-create a realistic plan.",
        },
        quote: { text: "The strongest negotiators are not those who demand the most, but those who leave the table with a deal that both sides are eager to uphold.", by: "Level 1 Workbook" },
        tryIt: "Draft one question you could ask a hesitant counterpart that lets them voice concerns without derailing the agreement.",
      },
      {
        k: "swipe",
        prompt: "Substance, or process?",
        left: "Substance",
        right: "Process",
        cards: [
          { text: "Price: €120k for the first year.", side: "left", why: "A tangible, measurable term of the deal." },
          { text: "Who approves changes to scope?", side: "right", why: "Decision-making authority is a process element." },
          { text: "What happens if the launch slips?", side: "right", why: "Contingency planning. The workbook lists it as a key process element." },
          { text: "Delivery by 30 March.", side: "left", why: "A deadline is substance. How it's tracked is process." },
        ],
      },
      {
        k: "choice",
        q: "Which is a way-out question from the workbook?",
        options: ["\"Are there any aspects of this agreement that feel too ambitious or uncertain to you?\"", "\"Can we sign now? I have another call.\"", "\"You're not going to back out, are you?\""],
        answer: 0,
        why: "It creates space for honest dialogue so buy-in is genuine and enduring.",
      },
    ],
  },
  {
    id: "t5",
    module: 2,
    title: "Review the negotiation",
    minutes: 3,
    steps: [
      { k: "video", captions: ["Before you congratulate or blame yourself, review.", "People who debrief systematically improve their outcomes by 20 to 25%.", "Make it a natural part of every negotiation."] },
      {
        k: "insight",
        page: 40,
        idea: "The final step is the one most people skip. Review the outcome and the process: what worked, what didn't, what you'd refine. It also strengthens the relationship by confirming mutual understanding and clearing up ambiguities. Research cited in the workbook (Harvard Business Review) puts the improvement from systematic debriefs at 20 to 25% over time.",
        tryIt: "After your next negotiation, use the workbook's Pause and Reflect list. Start with: Did we achieve our overall goal? Was my hypothesis of their needs correct? What did I commit to, and what did they commit to?",
      },
      {
        k: "choice",
        q: "Which of these is on the workbook's Pause and Reflect list?",
        options: ["\"Did I win?\"", "\"Was the hypothesis of our counterpart's needs correct?\"", "\"Who talked the most?\""],
        answer: 1,
        why: "The review focuses on learning: hypotheses, questions asked, alternatives used, and commitments on both sides.",
      },
      {
        k: "order",
        prompt: "Order the review from outcome to next time.",
        items: ["Did we achieve our overall goal?", "Was the hypothesis of their needs correct?", "Which principles and techniques did I use well?", "What did each side commit to doing?", "How could we improve the process next time?"],
        why: "Start with the goal, check your assumptions, assess your technique, record the commitments, then plan the improvement.",
      },
    ],
  },
  {
    id: "x2",
    module: 2,
    title: "The CRM rollout",
    minutes: 4,
    practice: true,
    steps: [
      {
        k: "roleplay",
        who: people.sam,
        setup: "IT and Sales have just agreed a three-month rollout of a new CRM to hit Sales' peak season. In the final review, Sam from IT seems hesitant but hasn't said why. You're leading the discussion.",
        goal: "Offer IT a way out, without derailing the agreement.",
        turns: [
          {
            them: "Three months. Yes. It's... ambitious, but fine. We'll manage.",
            options: [
              { text: "Great, so we're all agreed. Let's lock it in.", d: -15, reply: "Sure.", note: "You rushed the close. Sam's hesitation is still there, and it will surface as delays." },
              { text: "Sam, before we lock it in: are there any aspects of this plan that feel too ambitious or uncertain for your team?", d: 20, reply: "Honestly? Data migration alone usually takes six weeks. Three months is possible, but only if nothing else lands on us.", note: "Step 7: you offered a way out and got the real concern." },
              { text: "IT always says it's ambitious. We need this for peak season.", d: -20, reply: "Understood.", note: "You dismissed the hesitation. Sam goes quiet, and the risk goes underground." },
            ],
          },
          {
            them: "I don't want to be the one who blocks Sales. But I also don't want to promise what we can't deliver.",
            options: [
              { text: "Thanks for saying that. How would you feel about explaining this timeline to your own team?", d: 15, reply: "They'd push back on the migration window. If we could protect those six weeks, I'd be confident.", note: "Another way-out question from the workbook. Now you know what to protect." },
              { text: "Nobody's blaming you. Just do your best.", d: -5, reply: "Okay.", note: "Reassuring, but it leaves the risk unaddressed." },
              { text: "Then let's agree a milestone: migration complete by week six, with a review then. Who should own that?", d: 20, reply: "I'll own it. And if week six slips, we re-plan the go-live together rather than finding out at launch.", note: "Step 6: a mutually defined milestone, with ownership and a contingency." },
            ],
          },
          {
            them: "So we keep the three months, protect the migration window, and review at week six?",
            options: [
              { text: "Exactly. And I'll tell Sales that the week-six review is how we keep peak season safe, not a delay.", d: 15, reply: "That makes it a lot easier to commit to.", note: "Both departments stay committed. Sam leaves better than you found him." },
              { text: "Yes, but if week six slips, that's on IT.", d: -15, reply: "Right.", note: "You turned a shared milestone into a threat." },
              { text: "Let's not over-plan this. We'll figure it out.", d: -10, reply: "That's what worries me.", note: "Process matters as much as substance. You dropped it." },
            ],
          },
        ],
        outcomes: {
          high: "IT and Sales both commit. The migration window is protected, and the week-six review becomes the way everyone keeps peak season safe.",
          mid: "The plan goes ahead. Sam is on board on paper, but not in spirit.",
          low: "Sam says yes in the room and the project slips in week five. Nobody saw it coming, except Sam.",
        },
      },
    ],
  },

  // ───────────────────────── Module 3 · Negotiation Preparation ─────────────────────────
  {
    id: "r1",
    module: 3,
    title: "Analyse the situation, list your desires",
    minutes: 4,
    steps: [
      { k: "video", captions: ["Lack of preparation is one of the main reasons negotiations fail.", "Start with your emotions. They're data.", "Then: what do I want? What do I need? And what about them?"] },
      {
        k: "insight",
        page: 46,
        idea: "Step 1, Analyse the situation: check your emotions first and use them as data about what you care about. Pull out the facts, the issues at the root, and all the players: allies, blockers, neutrals, and those who never set foot in the room. Step 2, List of desires: ask what I want and what I need, then the same for them. Go beyond wants to the PBP, the Problem Behind the Problem.",
        example: {
          title: "The salary offer",
          body: "A consulting firm makes you an offer. Do you compare it to industry standards, to the company average, to what you need to live on, or to the lifestyle you aspire to? Each criterion changes the outcome. Knowing what you truly need keeps you open to other solutions, like the shape of the whole package.",
        },
        tryIt: "Before your next negotiation, write two lines: what I want / what I need, and what they might want / what they might need. The gap between want and need is where the deal lives.",
      },
      {
        k: "swipe",
        prompt: "Want, or need?",
        left: "Want",
        right: "Need",
        cards: [
          { text: "A 10% raise.", side: "left", why: "A surface-level demand. Ask what it's for." },
          { text: "Enough income to cover the new mortgage.", side: "right", why: "The real driver, which could also be met by a bonus or benefits." },
          { text: "Delivery by Friday.", side: "left", why: "A stated position." },
          { text: "A working demo before the board meets.", side: "right", why: "The Problem Behind the Problem." },
        ],
      },
      {
        k: "choice",
        q: "Who should you think about when analysing the situation?",
        options: ["Only the person who'll be in the room.", "Everyone with something at stake, including allies, blockers, neutrals and people who never enter the room.", "Just your own side."],
        answer: 1,
        why: "The workbook warns that a negotiation can be settled by someone who never set foot in the negotiation room.",
      },
    ],
  },
  {
    id: "r2",
    module: 3,
    title: "Questions and strategy",
    minutes: 4,
    steps: [
      { k: "video", captions: ["Asking good questions is a negotiation superpower.", "Prepare yours. Prepare for theirs.", "Then plan how you'll present your information. Order matters."] },
      {
        k: "insight",
        page: 48,
        idea: "Step 3, Questions: prepare specific open-ended questions that help your counterpart share what drives them, and prepare answers to what they might ask you. A surprise question can throw a negotiation off track. Step 4, Strategy planning: like choice architecture in a supermarket, the order and form of your information shapes the outcome. Decide what to present, in which order, and whether you make the opening offer or invite theirs. Research comparable data so your first move is justified.",
        tryIt: "Write three open questions for your next negotiation (the workbook's examples: What brought you to the table? Who else is involved in this decision? What does a good outcome look like to you?) and three questions they might ask you.",
      },
      {
        k: "swipe",
        prompt: "Will this question open them up?",
        left: "Closes",
        right: "Opens",
        cards: [
          { text: "\"What brought you to the negotiation table?\"", side: "right", why: "Open-ended. It invites their story and their motives." },
          { text: "\"So you agree our price is fair, right?\"", side: "left", why: "A leading question. It convinces instead of understanding." },
          { text: "\"Who else is involved in this decision?\"", side: "right", why: "Reveals the players outside the room." },
          { text: "\"Is that your final answer?\"", side: "left", why: "Closes the conversation and raises the temperature." },
        ],
      },
      {
        k: "choice",
        q: "In strategy planning, which is NOT a decision the workbook says to make in advance?",
        options: ["Whether to open with minor agreements or the tough issues first.", "Whether you make the opening offer or invite theirs.", "What your counterpart's favourite colour is."],
        answer: 2,
        why: "Order of information, format (slides, video, print) and who opens are all choices that shouldn't be left to chance.",
      },
    ],
  },
  {
    id: "r3",
    module: 3,
    title: "Suite of alternatives and logistics",
    minutes: 4,
    steps: [
      { k: "video", captions: ["Strength in a negotiation comes from your alternatives.", "Top chess players never play the first move they see.", "And a deal can still fall apart on a logistical detail."] },
      {
        k: "insight",
        page: 50,
        idea: "Step 5, Suite of alternatives: carefully evaluated, viable choices you could make if this deal fell through. The best one is your walk-away option, your BATNA. Ask: \"If this option did not exist, how else could I solve this problem?\" Step 6, Logistics: confirm time, travel, medium, location, attendees, agenda and dress code, and notice the power dynamics they carry. Being over-prepared for one outcome is its own trap.",
        example: {
          title: "The 1,000 m² shop",
          body: "You've prepared to negotiate the rent on one shop. Your counterpart arrives proposing a completely different building with far more potential. If you've over-prepared for one outcome, you can't recognise the better deal. Never be so prepared that you can't walk away or spot something better.",
        },
        quote: { text: "Failing to prepare is preparing to fail.", by: "Benjamin Franklin" },
        tryIt: "For your next negotiation, write three viable alternatives to the deal on the table and pick the best as your walk-away. Then run the logistics checklist: when, where, who, which medium, who sets the agenda.",
      },
      {
        k: "read",
        who: people.tom,
        line: "They've asked to meet at their offices, Friday at 5pm, with their legal team present. Just you.",
        options: ["Neutral. Logistics don't matter much.", "The power dynamics are set against you. Renegotiate the setting, or prepare for it.", "A good sign. They're taking it seriously."],
        answer: 1,
        why: "Their space, their timing, their numbers. The workbook calls this setting the scene. Notice it and make contingency plans.",
      },
      {
        k: "choice",
        q: "What does a strong suite of alternatives let you do, according to the workbook?",
        options: ["Issue a take-it-or-leave-it ultimatum.", "Enter any transaction with a calm sense of balance, create real value, or walk away without pressure.", "Skip the preparation phase."],
        answer: 1,
        why: "Alternatives remove pressure. Delivering that strength without creating an ultimatum impression is the skill.",
      },
    ],
  },
  {
    id: "x3",
    module: 3,
    title: "The offer",
    minutes: 4,
    practice: true,
    steps: [
      {
        k: "roleplay",
        who: people.lena,
        setup: "A consulting firm has offered you a job. The salary is 8% below what you hoped. You've done your homework: you know your need (the mortgage), your alternatives (your current role, another interview next week) and your variables (start date, bonus, training budget, remote days).",
        goal: "Negotiate the package using your preparation, and keep Lena on your side.",
        turns: [
          {
            them: "We're really pleased to make you this offer. I hope the number works for you.",
            options: [
              { text: "Thank you, I'm excited about the role. Before we talk numbers, can I ask what a successful first year looks like from your side?", d: 20, reply: "We'd want you leading two client accounts by month six. That's where the value is for us.", note: "A prepared open question. You learn what they need before you position." },
              { text: "The salary is too low. I'll need 15% more.", d: -20, reply: "That's quite far from our band.", note: "You anchored high without understanding their constraints. The Boomerang Effect begins." },
              { text: "It's fine. I accept.", d: 0, reply: "Wonderful!", note: "Anxiety Overlay. You avoided the negotiation and left your needs unmet." },
            ],
          },
          {
            them: "On salary, there's a little room, but the band is fairly fixed at your level.",
            options: [
              { text: "I understand. My need is around the base, so let's look at the whole package: could we agree a review at month six when I'm leading those accounts, plus a training budget?", d: 25, reply: "A six-month review tied to the accounts is very doable. And training we can approve today.", note: "Variables and concessions. You traded on terms, not just price, and tied it to their goal." },
              { text: "Then I'm afraid I'll have to take the other offer I'm considering.", d: -15, reply: "I understand. Let us know.", note: "You used your alternative as a threat, not as a source of calm." },
              { text: "Okay, what's the most you can do on base?", d: 5, reply: "Perhaps 3%.", note: "Focalism. One issue, salary, is crowding out the rest of the package." },
            ],
          },
          {
            them: "So: base plus 3%, a review at six months, training approved. Does that work?",
            options: [
              { text: "It does. And if the six-month review goes well, we revisit base against the band then. Shall I confirm that in writing?", d: 15, reply: "Yes, I'll send the revised offer today.", note: "Mutually defined milestone, confirmed in writing. Both sides are eager to uphold it." },
              { text: "I suppose. It's still less than I wanted.", d: -10, reply: "I'm sorry to hear that.", note: "You accepted while signalling regret. Buyer's remorse, on your side." },
              { text: "Fine, but I want it in writing that the 3% was your idea, not mine.", d: -15, reply: "...Of course.", note: "An odd, defensive note to end on. Leave them better than you found them." },
            ],
          },
        ],
        outcomes: {
          high: "You accept a package built on your real needs, with a milestone you both own. Lena says you were the easiest candidate she's worked with.",
          mid: "You take the role at 3% more. The relationship is fine, but you left value on the table.",
          low: "The offer is withdrawn, or you accept with regret. Either way, preparation went to waste.",
        },
      },
    ],
  },
];

export const lessonById = (id: string) => lessons.find((l) => l.id === id);
export const lessonsIn = (m: number) => lessons.filter((l) => l.module === m);
export const counts = (l: Lesson) => ({
  hasVideo: l.steps.some((s) => s.k === "video"),
  exercises: l.steps.filter((s) => s.k !== "video" && s.k !== "insight").length,
});
