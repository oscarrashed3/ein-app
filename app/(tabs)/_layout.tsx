import { Tabs } from "expo-router";
import { c, f } from "../../src/theme";
import { JourneyIcon, PathIcon, YouIcon } from "../../src/components/Icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarActiveTintColor: c.navy,
        tabBarInactiveTintColor: c.grey,
        tabBarStyle: { backgroundColor: c.cream, borderTopColor: c.line, borderTopWidth: 1, elevation: 0, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: f.medium, fontSize: 11, letterSpacing: 0.2 },
        sceneStyle: { backgroundColor: c.paper },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "Journey", tabBarIcon: ({ color }) => <JourneyIcon color={color as string} /> }} />
      <Tabs.Screen name="level" options={{ title: "Lessons", tabBarIcon: ({ color }) => <PathIcon color={color as string} /> }} />
      <Tabs.Screen name="you" options={{ title: "Profile", tabBarIcon: ({ color }) => <YouIcon color={color as string} /> }} />
    </Tabs>
  );
}
