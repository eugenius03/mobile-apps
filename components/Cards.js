import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, BORDER } from '../styles/theme';

export function FlatCard({ color = colors.white, style, children }) {
  return <View style={[styles.flat, { backgroundColor: color }, style]}>{children}</View>;
}

export function ShadowCard({ color = colors.white, style, children }) {
  return (
    <View style={styles.shadowWrap}>
      <View style={styles.shadow} />
      <View style={[styles.flat, { backgroundColor: color, padding: 18 }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flat: { borderWidth: BORDER, borderColor: colors.border, padding: 12 },
  shadowWrap: { marginRight: 4, marginBottom: 4 },
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: colors.border },
});
