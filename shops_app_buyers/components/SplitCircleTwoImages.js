import React from "react";
import { View, Image, StyleSheet } from "react-native";

const SplitCircleTwoImages = ({ image1, image2, size = 70 }) => {
  const halfSize = size / 2;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {/* نصف اليسار */}
      <View style={[styles.half, { left: 0 }]}>
        <Image source={image1} style={styles.image} />
      </View>

      {/* نصف اليمين */}
      <View style={[styles.half, { right: 0 }]}>
        <Image source={image2} style={styles.image} />
      </View>

      {/* الخط الفاصل في النص */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "#000",
    backgroundColor: "#cce7dd",
    position: "relative",
  },
  half: {
    width: "50%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
  divider: {
    position: "absolute",
    width: 1.5,
    backgroundColor: "#000",
    top: 5,
    bottom: 5,
    left: "50%",
    transform: [{ translateX: -0.75 }],
  },
});

export default SplitCircleTwoImages;
