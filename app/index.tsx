import { Redirect } from "expo-router";
import { useProgress } from "../src/state/progress";

export default function Index() {
  const { s } = useProgress();
  return <Redirect href={s.onboarded ? "/home" : "/welcome"} />;
}
