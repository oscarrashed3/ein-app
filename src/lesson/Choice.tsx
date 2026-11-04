import { useRef, useState } from "react";
import { Leon, type LeonHandle } from "../components/Leon";
import { StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { T } from "../components/T";
import { Press } from "../components/Press";
import { Appear } from "../components/Appear";
import { Check } from "../components/Icons";
import { c, ease, f } from "../theme";
import { XP, type Step } from "../content/level1";
import type { StepProps } from "./types";

type S = Extract<Step, { k: "choice" }>;

export function Choice({ step, report, locked }: StepProps<S>) {
  const [picked, setPicked] = useState<number | null>(null);
  const leon = useRef<LeonHandle>(null);
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === step.answer;
    leon.current?.emote(ok ? "jump" : "shake");
    report({ ok, xp: ok ? XP.right : 0, right: ok ? 1 : 0, total: 1, sheet: { tone: ok ? "ok" : "no", title: ok ? "That's it." : "Not quite.", body: step.why, xp: ok ? XP.right : 0 } });
  };
  return (
    <View style={{ gap: 20 }}>
      {/* Leon is big on quiz screens: he reacts to your answer. */}
      <Appear style={s.leonRow}>
        <Leon ref={leon} mood={picked === null ? "curious" : picked === step.answer ? "proud" : "guarded"} size={132} ground={false} />
      </Appear>
      <Appear i={1}>
        <T v="h1" style={s.q}>{step.q}</T>
      </Appear>
      <View style={{ gap: 8 }}>
        {step.options.map((o, i) => (
          <Appear key={i} i={2 + i}>
            <Option label={o} index={i} picked={picked} answer={step.answer} disabled={locked || picked !== null} onPress={() => pick(i)} />
          </Appear>
        ))}
      </View>
    </View>
  );
}

export function Option({ label, index, picked, answer, disabled, onPress }: { label: string; index: number; picked: number | null; answer: number; disabled: boolean; onPress: () => void }) {
  const answered = picked !== null;
  const isAns = answered && index === answer;
  const isWrong = answered && index === picked && picked !== answer;
  return (
    <Press
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: picked === index }}
      style={[s.opt, isAns && s.right, isWrong && s.wrong, answered && !isAns && !isWrong && { opacity: 0.4 }]}
    >
      <View style={[s.key, isAns && { borderColor: c.white, backgroundColor: c.white }, isWrong && { borderColor: c.purple, backgroundColor: c.purple }]}>
        {isAns ? (
          <Animated.View entering={ZoomIn.duration(260).easing(ease)}>
            <Check color={c.navy} size={13} />
          </Animated.View>
        ) : (
          <T style={[s.keyT, isWrong && { color: c.white }]}>{String.fromCharCode(65 + index)}</T>
        )}
      </View>
      <T style={s.optT}>{label}</T>
    </Press>
  );
}

const s = StyleSheet.create({
  q: { letterSpacing: -0.7 },
  leonRow: { alignItems: "flex-start", marginBottom: -8, marginLeft: -10 },
  opt: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 60, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 30, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, shadowColor: c.navy, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  right: { backgroundColor: c.mint, borderColor: c.mint },
  wrong: { backgroundColor: c.lilac, borderColor: c.purple },
  key: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  keyT: { fontFamily: f.semibold, fontSize: 11, lineHeight: 14, color: c.ink2 },
  optT: { flex: 1, fontFamily: f.medium, fontSize: 15, lineHeight: 21, color: c.ink },
});
