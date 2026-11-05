import Svg, { Path, Circle, Rect } from "react-native-svg";

type P = { color?: string; size?: number };

export const Arrow = ({ color = "#0A0938", size = 18 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path d="M3 9h12M10 4l5 5-5 5" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="square" />
  </Svg>
);
export const Back = ({ color = "#0A0938", size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M16 10H4M9 5l-5 5 5 5" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="square" />
  </Svg>
);
export const Close = ({ color = "#0A0938", size = 20 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth={1.6} strokeLinecap="square" />
  </Svg>
);
export const Check = ({ color = "#0E7A5A", size = 16 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Path d="M3 8.5l3.2 3L13 4.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="square" />
  </Svg>
);
export const Lock = ({ color = "#8E9096", size = 14 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 14 14">
    <Rect x="2.5" y="6" width="9" height="6.5" stroke={color} strokeWidth={1.3} fill="none" />
    <Path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke={color} strokeWidth={1.3} fill="none" />
  </Svg>
);
export const Play = ({ color = "#FFFFFF", size = 18 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path d="M5 3l10 6-10 6z" fill={color} />
  </Svg>
);
export const Pause = ({ color = "#FFFFFF", size = 18 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Rect x="4" y="3" width="3.5" height="12" fill={color} />
    <Rect x="10.5" y="3" width="3.5" height="12" fill={color} />
  </Svg>
);
/* Tab icons: square, line-only, 22px. */
export const TodayIcon = ({ color = "#0A0938", size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Rect x="3" y="4" width="16" height="15" stroke={color} strokeWidth={1.5} fill="none" />
    <Path d="M3 8.5h16M7 2v4M15 2v4" stroke={color} strokeWidth={1.5} />
  </Svg>
);
export const PathIcon = ({ color = "#0A0938", size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M4 19V13h5V8h5V3h4" stroke={color} strokeWidth={1.5} fill="none" />
  </Svg>
);
export const YouIcon = ({ color = "#0A0938", size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Circle cx="11" cy="8" r="4" stroke={color} strokeWidth={1.5} fill="none" />
    <Path d="M3.5 19.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke={color} strokeWidth={1.5} fill="none" />
  </Svg>
);
/** Journey tab: a dotted spiral path to a pin. */
export const JourneyIcon = ({ color = "#0A0938", size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {[[4, 20], [6.5, 17.5], [9.5, 16.5], [12.5, 17], [15, 15], [15.5, 12], [13.5, 9.8]].map(([x, y], i) => (
      <Circle key={i} cx={x} cy={y} r={1.25} fill={color} />
    ))}
    <Path d="M17 3.5a3.5 3.5 0 0 1 3.5 3.5c0 2.6-3.5 5.5-3.5 5.5S13.5 9.6 13.5 7A3.5 3.5 0 0 1 17 3.5z" stroke={color} strokeWidth={1.6} fill="none" />
    <Circle cx={17} cy={7} r={1.2} fill={color} />
  </Svg>
);
/** Leon tab: Leon's round head, eye and crest. */
export const LeonIcon = ({ color = "#0A0938", size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M3 17c0-5 4-9 10-9 5 0 8 3 8 6.5 0 3-2.5 4.5-6 4.5H7c-2.4 0-4-0.8-4-2z" stroke={color} strokeWidth={1.6} fill="none" />
    <Path d="M9 8l1-3 2 2.6L14 4l1 4" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
    <Circle cx={16} cy={12.5} r={2.2} stroke={color} strokeWidth={1.4} fill="none" />
    <Circle cx={16.5} cy={12.5} r={0.9} fill={color} />
  </Svg>
);
/** Home tab: a simple house, line only. */
export const HomeIcon = ({ color = "#0A0938", size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 22 22">
    <Path d="M3.5 10L11 3.5 18.5 10V18.5H13.5V13.5H8.5V18.5H3.5Z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
  </Svg>
);
