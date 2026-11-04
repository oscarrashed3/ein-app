import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { router } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Leon } from "../src/components/Leon";
import { Mark } from "../src/components/Mark";
import { T } from "../src/components/T";
import { Button } from "../src/components/Button";
import { Appear } from "../src/components/Appear";
import { Press } from "../src/components/Press";
import { Check } from "../src/components/Icons";
import { useProgress, State } from "../src/state/progress";
import { level } from "../src/content/level1";
import { c, ease, f, g } from "../src/theme";

const TIMES: { k: State["reminder"]; label: string; at: string }[] = [
  { k: "morning", label: "Morning", at: "8:00" },
  { k: "lunch", label: "Lunch", at: "12:30" },
  { k: "evening", label: "Evening", at: "18:00" },
];

/** First open: who you are, when to nudge you. Three short steps, then straight into Level 1. */
export default function Welcome() {
  const { s, set } = useProgress();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.name);
  const [when, setWhen] = useState<State["reminder"]>(s.reminder);

  const finish = () => {
    set({ onboarded: true, name: name.trim() || "there", reminder: when });
    router.replace("/today");
  };

  return (
    <Screen scroll={false} style={st.f}>
      <View style={st.head}>
        <Mark width={52} />
        <View style={st.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[st.dot, i <= step && st.dotOn]} />
          ))}
        </View>
      </View>

      <Animated.View key={step} entering={FadeIn.duration(380).easing(ease)} exiting={FadeOut.duration(120)} style={st.body}>
        {step === 0 && (
          <>
            <Appear>
              <T v="label">
                Emotionally Intelligent Negotiation · Level {level.n}
              </T>
            </Appear>
            <Appear i={1}>
              <T v="display">You did the workshop. Now make it stick.</T>
            </Appear>
            <Appear i={2}>
              <T style={st.lead}>A few minutes a day. Short videos, a quick check after each one, and a streak to keep you going.</T>
            </Appear>
            <Appear i={3} style={st.meet}>
              <Leon mood="curious" size={150} ground={false} look={{ skin: "unaware", acc: "none" }} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="h3">Meet Leon.</T>
                <T v="small">A chameleon who can't change colour yet. Walk him across Quiet Shore and he earns ILN's colours, one module at a time.</T>
              </View>
            </Appear>
          </>
        )}
        {step === 1 && (
          <>
            <Appear>
              <T v="label">About you</T>
            </Appear>
            <Appear i={1}>
              <T v="h1">What should we call you?</T>
            </Appear>
            <Appear i={2}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="First name"
                placeholderTextColor={c.grey}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => setStep(2)}
                style={st.input}
              />
            </Appear>
          </>
        )}
        {step === 2 && (
          <>
            <Appear>
              <T v="label">Your daily nudge</T>
            </Appear>
            <Appear i={1}>
              <T v="h1">When do you have three minutes?</T>
            </Appear>
            <Appear i={2} style={st.opts}>
              {TIMES.map((t) => {
                const on = when === t.k;
                return (
                  <Press key={t.k} onPress={() => setWhen(t.k)} style={[st.opt, on && st.optOn]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                    <T style={[st.optT, on && { color: c.navy }]}>{t.label}</T>
                    <View style={st.optR}>
                      <T v="small">{t.at}</T>
                      <View style={[st.box, on && st.boxOn]}>{on && <Check color={c.white} size={12} />}</View>
                    </View>
                  </Press>
                );
              })}
            </Appear>
          </>
        )}
      </Animated.View>

      <View style={st.foot}>
        {step < 2 ? <Button label={step === 0 ? "Start Level 1" : "Continue"} onPress={() => setStep(step + 1)} disabled={step === 1 && !name.trim()} /> : <Button label="Begin" onPress={finish} />}
        {step === 0 && <T style={st.note}>For participants of ILN workshops.</T>}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  meet: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, marginLeft: -12 },
  f: { justifyContent: "space-between" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 18, height: 3, backgroundColor: c.line },
  dotOn: { backgroundColor: c.navy },
  body: { flex: 1, justifyContent: "center", gap: 18 },
  lead: { fontSize: 17, lineHeight: 26, color: c.ink2, maxWidth: 340 },
  input: { fontFamily: f.medium, fontSize: 22, color: c.navy, borderBottomWidth: 1.5, borderBottomColor: c.navy, paddingVertical: 12, outlineStyle: "none" } as any,
  opts: { gap: 8, marginTop: 4 },
  opt: { borderRadius: 30, height: 60, borderWidth: 1, borderColor: c.line, backgroundColor: c.white, paddingHorizontal: g, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optOn: { borderColor: c.navy },
  optT: { fontFamily: f.medium, fontSize: 16, color: c.ink },
  optR: { flexDirection: "row", alignItems: "center", gap: 14 },
  box: { borderRadius: 10, width: 20, height: 20, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: c.navy, borderColor: c.navy },
  foot: { gap: 12 },
  note: { fontSize: 12, lineHeight: 16, color: c.grey, textAlign: "center" },
});
