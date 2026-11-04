import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { T } from "../components/T";
import { Press } from "../components/Press";
import { Appear } from "../components/Appear";
import { Avatar } from "../components/Avatar";
import { c, f, g } from "../theme";
import { XP, type Step } from "../content/level1";
import type { StepProps } from "./types";

type S = Extract<Step, { k: "read" }>;

/** Read the room: one line from a counterpart, and you name what they're feeling. */
export function Read({ step, report, locked }: StepProps<S>) {
  const [picked, setPicked] = useState<number | null>(null);
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === step.answer;
    report({ ok, xp: ok ? XP.right : 0, right: ok ? 1 : 0, total: 1, sheet: { tone: ok ? "ok" : "no", title: ok ? `Yes. ${step.options[step.answer]}.` : `More likely ${step.options[step.answer].toLowerCase()}.`, body: step.why, xp: ok ? XP.right : 0 } });
  };
  return (
    <View style={{ gap: 28 }}>
      <Appear>
        <T v="h1" style={{ fontSize: 25, lineHeight: 31 }}>How is {step.who.name.split(" ")[0]} feeling?</T>
      </Appear>
      <Appear i={1} style={s.scene}>
        <View style={s.who}>
          <Avatar p={step.who} size={40} dark />
          <View>
            <T v="h3" style={{ color: c.white }}>{step.who.name}</T>
            <T v="small" style={{ color: c.onNavy2 }}>{step.who.role}</T>
          </View>
        </View>
        <T style={s.line}>“{step.line}”</T>
      </Appear>
      <View style={s.grid}>
        {step.options.map((o, i) => {
          const done = picked !== null;
          const isAns = done && i === step.answer;
          const isWrong = done && i === picked && !isAns;
          return (
            <Appear key={o} i={2 + i} style={s.cell}>
              <Press disabled={locked || done} onPress={() => pick(i)} accessibilityRole="radio" style={[s.chip, isAns && s.right, isWrong && s.wrong, done && !isAns && !isWrong && { opacity: 0.4 }]}>
                <T style={s.chipT}>{o}</T>
              </Press>
            </Appear>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scene: { backgroundColor: c.navy, padding: g, gap: 20 },
  who: { flexDirection: "row", gap: 12, alignItems: "center" },
  line: { fontFamily: f.medium, fontSize: 22, lineHeight: 30, letterSpacing: -0.4, color: c.white },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  cell: { width: "50%", padding: 4 },
  chip: { borderRadius: 20, height: 64, alignItems: "center", justifyContent: "center", backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  right: { backgroundColor: c.mintTint, borderColor: c.mint },
  wrong: { backgroundColor: c.lilac, borderColor: c.purple },
  chipT: { fontFamily: f.semibold, fontSize: 16, lineHeight: 20, color: c.navy },
});
