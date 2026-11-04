import { StyleProp, ViewStyle } from "react-native";
import { Rise } from "./Rise";

/**
 * Content rises in, quickly, in a short stagger (index * 50ms).
 * Built on shared values, not Reanimated layout animations: on the web those could leave
 * an element stuck in absolute position, which made text overlap.
 */
export function Appear({ i = 0, children, style }: { i?: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Rise delay={40 + i * 50} y={14} style={style}>
      {children}
    </Rise>
  );
}
