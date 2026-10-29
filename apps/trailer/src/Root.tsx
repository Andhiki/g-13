import { Composition } from "remotion";
import { Trailer } from "./Composition";
import "./style.css";

export const RemotionRoot = () => (
  <Composition
    id="G13Trailer"
    component={Trailer}
    durationInFrames={840}
    fps={30}
    width={1920}
    height={1080}
  />
);
