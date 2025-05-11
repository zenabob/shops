import React, { useState } from 'react';
import { View, Animated, Image, StyleSheet } from 'react-native';

const ProgressiveImage = ({ thumbnailSource, source, style }) => {
  const [thumbnailAnimated] = useState(new Animated.Value(0));
  const [imageAnimated] = useState(new Animated.Value(0));

  const handleThumbnailLoad = () => {
    Animated.timing(thumbnailAnimated, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleImageLoad = () => {
    Animated.timing(imageAnimated, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={style}>
      <Animated.Image
        source={thumbnailSource}
        style={[style, { opacity: thumbnailAnimated, position: 'absolute', blurRadius: 2 }]}
        onLoad={handleThumbnailLoad}
        resizeMode="cover"
      />
      <Animated.Image
        source={source}
        style={[style, { opacity: imageAnimated }]}
        onLoad={handleImageLoad}
        resizeMode="cover"
      />
    </View>
  );
};

export default ProgressiveImage;
