import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { T } from "../../src/components/T";
import { Button } from "../../src/components/Button";
import { Press } from "../../src/components/Press";
import { VideoCard } from "../../src/components/VideoCard";
import { Draft } from "../../src/components/Draft";
import { Appear } from "../../src/components/Appear";
import { Close } from "../../src/components/Icons";
import { Leon } from "../../src/components/Leon";
import { Sheet, type SheetData } from "../../src/lesson/Sheet";
import { Choice } from "../../src/lesson/Choice";
import { Read } from "../../src/lesson/Read";
import { Swipe } from "../../src/lesson/Swipe";
import { Order } from "../../src/lesson/Order";
import { Roleplay } from "../../src/lesson/Roleplay";
import { Results, StreakMoment } from "../../src/lesson/Celebrate";
import type { Report } from "../../src/lesson/types";
import { XP, lessonById, lessons, modules, type Step } from "../../src/content/level1";
import { useProgress } from "../../src/state/progress";
import { c, ease, f, g } from "../../src/theme";

type Phase = "steps" | "retry" | "results" | "streak";
/** Steps with a right answer. Miss one and it comes back at the end of the lesson until you get it right. */
const QUESTION = new Set(["choice", "read", "swipe", "order"]);

/** The lesson player: one step at a time, a feedback sheet after each exercise, then results and the streak. */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(String(id));
  const { s, complete } = useProgress();
  const i = useSafeAreaInsets();
  // The order you meet the steps in. Missed questions are added to the end, round after round.
  const [order, setOrder] = useState<number[]>(() => (lesson ? lesson.steps.map((_, k) => k) : []));
  const [pos, setPos] = useState(0);
  const missed = useRef<number[]>([]);
  const [retryN, setRetryN] = useState(0);
  const firstLen = lesson?.steps.length ?? 0;
  const at = order[pos] ?? 0;
  const retrying = pos >= firstLen;
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [phase, setPhase] = useState<Phase>("steps");
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const tally = useRef({ right: 0, total: 0, meter: undefined as number | undefined });
  const [result, setResult] = useState<ReturnType<typeof complete> | null>(null);
  const [watched, setWatched] = useState(false);

  if (!lesson) {
    return (
      <View style={{ flex: 1, padding: g, justifyContent: "center", gap: 16 }}>
        <T v="h2">Lesson not found.</T>
        <Button label="Back" onPress={() => router.replace("/today")} />
      </View>
    );
  }
  const step = lesson.steps[at];
  const n = lessons.indexOf(lesson) + 1;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));

  const advance = (gained = 0) => {
    const total = xp + gained;
    if (gained) setXp(total);
    setSheet(null);
    if (pos + 1 < order.length) {
      setPos(pos + 1);
      setWatched(false);
    } else if (missed.current.length) {
      // Not passed yet: go over only the questions you missed.
      const again = [...new Set(missed.current)];
      missed.current = [];
      setRetryN(again.length);
      setOrder((o) => [...o, ...again]);
      setPhase("retry");
    } else {
      const res = complete(lesson.id, { right: tally.current.right, total: tally.current.total, xp: total });
      setResult(res);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // v5: a normal lesson ends back on the map, where the stone lights up and Leon hops on.
      // Role-plays keep their full results screen. A new streak day still gets its moment.
      if (lesson.practice) setPhase("results");
      else if (res.extended) setPhase("streak");
      else router.replace("/today");
    }
  };

  const onReport = (r: Report) => {
    if (!r.ok && QUESTION.has(step.k)) missed.current.push(at);
    // Your score and XP count the first try; a retry is for learning it, not for points.
    if (!retrying) {
      tally.current.right += r.right;
      tally.current.total += r.total;
      setXp((v) => v + r.xp);
    }
    if (r.meter !== undefined) tally.current.meter = r.meter;
    const nc = r.ok ? combo + 1 : 0;
    setCombo(nc);
    if (Platform.OS !== "web") Haptics.notificationAsync(r.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    setSheet(retrying ? { ...r.sheet, xp: 0 } : r.sheet);
  };

  if (phase === "retry") {
    return (
      <Frame>
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <Appear>
            <Leon mood="curious" size={170} ground={false} />
          </Appear>
          <Appear i={1}>
            <T style={st.kick}>Almost there</T>
            <T v="h1">{retryN === 1 ? "One to go over again." : `${retryN} to go over again.`}</T>
          </Appear>
          <Appear i={2}>
            <T style={st.tryT}>To pass this stop, every answer has to be right. You only redo the {retryN === 1 ? "one" : "ones"} you missed.</T>
          </Appear>
        </View>
        <Button label="Try again" onPress={() => (setPhase("steps"), setPos(pos + 1), setWatched(false))} />
      </Frame>
    );
  }
  if (phase === "results" && result) {
    return (
      <Frame>
        <Results
          title={lesson.title}
          xp={xp}
          right={tally.current.right}
          total={tally.current.total}
          meter={tally.current.meter}
          todayXp={result.todayXp}
          cta={result.extended ? "Continue" : "Back to the map"}
          onNext={() => (result.extended ? setPhase("streak") : router.replace("/today"))}
        />
      </Frame>
    );
  }
  if (phase === "streak" && result) {
    return (
      <StreakMoment prev={result.prev} streak={result.streak} days={s.days} onDone={() => router.replace("/today")} />
    );
  }

  const full = step.k === "roleplay" || step.k === "video";
  const progress = retrying ? 1 : (pos + (sheet ? 1 : 0)) / lesson.steps.length;

  return (
    <View style={[st.f, { paddingTop: Math.max(i.top, 16) + 8 }]}>
      <View style={st.bar}>
        <Press onPress={close} accessibilityRole="button" accessibilityLabel="Close lesson" hitSlop={12}>
          <Close />
        </Press>
        <Progress p={progress} />
        {combo >= 2 && (
          <Animated.View key={combo} entering={FadeIn.duration(220)} style={st.combo}>
            <T style={st.comboT}>{combo} in a row</T>
          </Animated.View>
        )}
        <XpChip xp={xp} />
      </View>

      <Animated.View key={pos} entering={FadeIn.duration(320).easing(ease)} style={{ flex: 1 }}>
        {full ? (
          <View style={[st.pad, { flex: 1, paddingBottom: Math.max(i.bottom, 16) }]}>
            {step.k === "video" && (
              <View style={{ flex: 1, gap: 18 }}>
                <View style={{ gap: 8 }}>
                  <T v="small">
                    Lesson {n}. {modules[lesson.module - 1].title}
                  </T>
                  <T v="h1">{lesson.title}</T>
                </View>
                <VideoCard minutes={lesson.minutes} captions={step.captions} onEnd={() => setWatched(true)} />
                <View style={{ marginTop: "auto", gap: 8 }}>
                  <Button label={watched ? "Continue" : "Watching…"} disabled={!watched} onPress={() => advance(XP.video)} />
                  {!watched && (
                    <Press onPress={() => setWatched(true)} style={{ alignSelf: "center", padding: 6 }} accessibilityRole="button">
                      <T v="small">Skip the preview</T>
                    </Press>
                  )}
                </View>
              </View>
            )}
            {step.k === "roleplay" && <Roleplay step={step} report={onReport} locked={!!sheet} />}
          </View>
        ) : (
          <ScrollView contentContainerStyle={[st.pad, { paddingBottom: sheet ? 260 : 32, flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
            {retrying && <T style={[st.kick, { marginBottom: 10 }]}>Second try</T>}
            <StepBody key={pos} step={retrying ? reshuffle(step, pos) : step} onReport={onReport} locked={!!sheet} onInsight={() => advance(XP.insight)} />
          </ScrollView>
        )}
      </Animated.View>

      {sheet && <Sheet d={sheet} onNext={() => advance(0)} />}
    </View>
  );
}

/** On a second try the answers move around, so you have to know it, not remember where it was. */
function reshuffle(step: Step, seed: number): Step {
  if (step.k !== "choice") return step;
  const idx = step.options.map((_, k) => k);
  for (let k = idx.length - 1; k > 0; k--) {
    const j = (seed * 7 + k * 3) % (k + 1);
    [idx[k], idx[j]] = [idx[j], idx[k]];
  }
  if (idx.every((v, k) => v === k)) idx.push(idx.shift()!);
  return { ...step, options: idx.map((k) => step.options[k]), answer: idx.indexOf(step.answer) };
}

function StepBody({ step, onReport, locked, onInsight }: { step: Step; onReport: (r: Report) => void; locked: boolean; onInsight: () => void }) {
  switch (step.k) {
    case "insight":
      return (
        <View style={{ flex: 1, gap: 20 }}>
          <Appear>
            <T style={st.idea}>{step.idea}</T>
          </Appear>
          {step.example && (
            <Appear i={1} style={st.ex}>
              <View style={st.exBar} />
              <T style={st.exH}>{step.example.title}</T>
              <T style={st.exT}>{step.example.body}</T>
            </Appear>
          )}
          {step.quote && (
            <Appear i={step.example ? 2 : 1} style={st.quote}>
              <T style={st.quoteT}>“{step.quote.text}”</T>
              <T v="small">{step.quote.by}</T>
            </Appear>
          )}
          <Appear i={step.example ? 3 : 2} style={st.try}>
            <T v="h3">Reflect this week</T>
            <T style={st.tryT}>{step.tryIt}</T>
          </Appear>
          <Appear i={4}>
            <Draft label={step.page ? `Level 1 workbook · p. ${step.page}` : "Draft for ILN"} />
          </Appear>
          <View style={{ marginTop: "auto" }}>
            <Button label="Got it" onPress={onInsight} />
          </View>
        </View>
      );
    case "choice":
      return <Choice step={step} report={onReport} locked={locked} />;
    case "read":
      return <Read step={step} report={onReport} locked={locked} />;
    case "swipe":
      return <Swipe step={step} report={onReport} locked={locked} />;
    case "order":
      return <Order step={step} report={onReport} locked={locked} />;
    default:
      return null;
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  const i = useSafeAreaInsets();
  return <View style={[st.f, st.pad, { paddingTop: Math.max(i.top, 16) + 44, paddingBottom: Math.max(i.bottom, 16) + 16 }]}>{children}</View>;
}

function Progress({ p }: { p: number }) {
  const v = useSharedValue(p);
  useEffect(() => {
    v.value = withTiming(p, { duration: 520, easing: ease });
  }, [p]);
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.02, v.value) }] }));
  return (
    <View style={st.track}>
      <Animated.View style={[st.fill, a]} />
    </View>
  );
}

function XpChip({ xp }: { xp: number }) {
  const sc = useSharedValue(1);
  useEffect(() => {
    if (xp) sc.value = withSequence(withTiming(1.18, { duration: 120, easing: ease }), withSpring(1, { damping: 10, stiffness: 220 }));
  }, [xp]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[st.xp, a]}>
      <View style={st.xpMark} />
      <T style={st.xpT}>{xp}</T>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  f: { flex: 1, backgroundColor: c.paper },
  pad: { paddingHorizontal: g },
  bar: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: g, marginBottom: 20 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.paper2, overflow: "hidden" },
  fill: { height: "100%", width: "100%", backgroundColor: c.navy, transformOrigin: "left" } as any,
  xp: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 44, justifyContent: "flex-end" },
  xpMark: { width: 8, height: 8, backgroundColor: c.gold },
  xpT: { fontFamily: f.semibold, fontSize: 14, lineHeight: 18, color: c.navy },
  combo: { backgroundColor: c.navy, paddingHorizontal: 8, paddingVertical: 4 },
  comboT: { fontFamily: f.semibold, fontSize: 11, lineHeight: 14, color: c.mint },
  kick: { fontFamily: f.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.3, color: c.purple },
  idea: { fontFamily: f.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: c.navy },
  try: { borderRadius: 20, gap: 8, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, padding: g },
  tryT: { fontSize: 16, lineHeight: 24, color: c.ink },
  ex: { borderRadius: 20, overflow: "hidden", backgroundColor: c.white, borderWidth: 1, borderColor: c.line, padding: 16, paddingTop: 18, gap: 6 },
  exBar: { position: "absolute", left: 0, right: 0, top: 0, height: 3, backgroundColor: c.gold },
  exH: { fontFamily: f.semibold, fontSize: 15, lineHeight: 20, color: c.navy },
  exT: { fontSize: 14, lineHeight: 21, color: c.ink2 },
  quote: { gap: 6, borderLeftWidth: 2, borderLeftColor: c.purple, paddingLeft: 14 },
  quoteT: { fontFamily: f.medium, fontSize: 15, lineHeight: 22, color: c.navy },
});
