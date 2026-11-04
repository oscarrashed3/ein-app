import Svg, { Defs, G, Mask, Path, Pattern, Rect } from "react-native-svg";
import { useId } from "react";

const COLOURS = ["#E4AE36", "#AE36E4", "#36E4AD"] as const;
const LETTERS = [
  { solid: "M0 0L192 185V375H0Z", hatch: [["M0 0H192V185Z", "d"]] },
  { solid: "M247 0L435 185V235H625L485 375H247Z", hatch: [["M247 0H435V185Z", "d"], ["M625 235V375H485Z", "u"]] },
  { solid: "M663 0L850 185V375H663Z", hatch: [["M850 0H1043V375L850 185Z", "v"]] },
] as const;

/** ILN's block mark, the same vector as the website, in its three colours (or one colour with `color`). */
export function Mark({ width = 44, color, only }: { width?: number; color?: string; only?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg width={width} height={(width * 375) / 1043} viewBox="0 0 1043 375" accessibilityLabel="ILN">
      <Defs>
        <Pattern id={`d${id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect width="3" height="10" fill="#fff" />
        </Pattern>
        <Pattern id={`u${id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <Rect width="3" height="10" fill="#fff" />
        </Pattern>
        <Pattern id={`v${id}`} width="9" height="10" patternUnits="userSpaceOnUse">
          <Rect width="3" height="10" fill="#fff" />
        </Pattern>
        {LETTERS.map((l, i) => (
          <Mask key={i} id={`m${id}${i}`}>
            {l.hatch.map(([d, p]) => (
              <Path key={d} d={d} fill={`url(#${p}${id})`} />
            ))}
          </Mask>
        ))}
      </Defs>
      {LETTERS.map((l, i) => (only !== undefined && only !== i ? null :
        <G key={i} fill={color ?? COLOURS[i]}>
          <Path d={l.solid} />
          <Rect width="1043" height="375" opacity={0.6} mask={`url(#m${id}${i})`} />
        </G>
      ))}
    </Svg>
  );
}
