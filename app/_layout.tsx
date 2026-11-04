import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Poppins_400Regular } from "@expo-google-fonts/poppins/400Regular";
import { Poppins_500Medium } from "@expo-google-fonts/poppins/500Medium";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins/600SemiBold";
import { ProgressProvider, useProgress } from "../src/state/progress";
import { c } from "../src/theme";

/** On a desktop browser the app sits in a phone-sized frame, so it reads as the mobile app it is. */
function Frame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== "web" || width < 600) return <>{children}</>;
  const h = Math.min(860, height - 48);
  return (
    <View style={s.desk}>
      <View style={[s.device, { height: h, width: Math.round(h * 0.47) }]}>{children}</View>
    </View>
  );
}

function Routes() {
  const { ready } = useProgress();
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.paper }} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper }, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen name="welcome" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="lesson/[id]" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
    </Stack>
  );
}

export default function Root() {
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: c.paper }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ProgressProvider>
        <Frame>
          <Routes />
        </Frame>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  desk: { flex: 1, backgroundColor: "#E9E7E1", alignItems: "center", justifyContent: "center" },
  device: {
    backgroundColor: c.paper,
    borderRadius: 44,
    borderWidth: 10,
    borderColor: c.navy,
    overflow: "hidden",
    shadowColor: c.navy,
    shadowOpacity: 0.3,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 40 },
  },
});
