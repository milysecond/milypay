import { Composition } from "remotion";
import { MilypayDemo } from "./MilypayDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MilypayDemo"
        component={MilypayDemo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MilypayDemoVertical"
        component={MilypayDemo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
