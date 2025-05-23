import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PendingShopsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pending shop requests will be listed here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#444' },
});

export default PendingShopsScreen;
