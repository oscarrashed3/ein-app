import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { c, g } from "../theme";

/** Every screen: paper background, one gutter, safe areas respected. */
export function Screen({ children, scroll = true, style, bg = c.paper }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle; bg?: string }) {
  const i = useSafeAreaInsets();
  const pad = { paddingTop: Math.max(i.top, 16) + 8, paddingBottom: 32, paddingHorizontal: g };
  if (!scroll) return <View style={[s.f, { backgroundColor: bg }, pad, style]}>{children}</View>;
  return (
    <ScrollView style={[s.f, { backgroundColor: bg }]} contentContainerStyle={[pad, style]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}
const s = StyleSheet.create({ f: { flex: 1 } });
