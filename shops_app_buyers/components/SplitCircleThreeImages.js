import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  ClipPath,
  Path,
  Image as SvgImage,
  G,
  Circle,
} from "react-native-svg";

const SIZE = 70;
const RADIUS = SIZE / 2;

const SplitCircleThreeImages = ({ image1, image2, image3 }) => {
  const center = RADIUS;

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const getPath = (startDeg, sweepDeg) => {
    const start = polarToCartesian(center, center, RADIUS, startDeg);
    const end = polarToCartesian(center, center, RADIUS, startDeg + sweepDeg);

    const largeArcFlag = sweepDeg > 180 ? 1 : 0;

    return `
      M ${center} ${center}
      L ${start.x} ${start.y}
      A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
      Z
    `;
  };

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background Circle */}
        
        <Defs>
          <ClipPath id="clip1">
            <Path d={getPath(0, 120)} />
          </ClipPath>
          <ClipPath id="clip2">
            <Path d={getPath(120, 120)} />
          </ClipPath>
          <ClipPath id="clip3">
            <Path d={getPath(240, 120)} />
          </ClipPath>
        </Defs>

        {/* Image 1 */}
        <G clipPath="url(#clip1)">
          <SvgImage
            href={image1}
            x={center+4 }
            y={center - 30}
            width={25}
            height={40}
            preserveAspectRatio="xMidYMid"
          />
        </G>

        {/* Image 2 */}
        <G clipPath="url(#clip2)">
          <SvgImage
            href={image2}
            x={center - 10}
            y={center +5 }
            width={30}
            height={25}
            preserveAspectRatio="xMidYMid"
          />
        </G>

        {/* Image 3 */}
        <G clipPath="url(#clip3)">
          <SvgImage
            href={image3}
            x={center -27}
            y={center -30}
            width={25}
            height={40}
            preserveAspectRatio="xMidYMid"
          />
        </G>

        {/* Y shape dividers */}
        <Path
          d={[
            `M ${center} ${center}`,
            `L ${polarToCartesian(center, center, RADIUS, 0).x} ${polarToCartesian(center, center, RADIUS, 0).y}`,
            `M ${center} ${center}`,
            `L ${polarToCartesian(center, center, RADIUS, 120).x} ${polarToCartesian(center, center, RADIUS, 120).y}`,
            `M ${center} ${center}`,
            `L ${polarToCartesian(center, center, RADIUS, 240).x} ${polarToCartesian(center, center, RADIUS, 240).y}`,
          ].join(" ")}
          stroke="black"
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
  },
});

export default SplitCircleThreeImages;
