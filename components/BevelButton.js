import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import Icon from './Icon';
import { colors } from '../styles/theme';

function mix(hex, target, t) {
  const c = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const part = (i) => Math.round(c(hex, i) + (c(target, i) - c(hex, i)) * t);
  return `rgb(${part(0)},${part(1)},${part(2)})`;
}

export default function BevelButton({
  text,
  icon,
  iconSize = 24,
  onPress,
  base = colors.accent,
  textColor = colors.white,
  fontSize = 16,
  disabled = false,
  style,
}) {
  const [pressed, setPressed] = useState(false);
  const hi = mix(base, '#FFFFFF', 0.4);
  const sh = mix(base, '#000000', 0.35);
  const top = pressed ? sh : hi;
  const bottom = pressed ? hi : sh;

  return (
    <PressScale onPress={onPress} onPressChange={setPressed} disabled={disabled} style={[disabled && styles.disabled, style]}>
      <View style={styles.outline}>
        <View
          style={[
            styles.face,
            {
              backgroundColor: base,
              borderTopColor: top,
              borderLeftColor: top,
              borderBottomColor: bottom,
              borderRightColor: bottom,
            },
          ]}
        >
          <View style={styles.content}>
            {icon ? <Icon name={icon} size={iconSize} color={textColor} /> : null}
            {text ? <Text style={[styles.text, { color: textColor, fontSize }]}>{text}</Text> : null}
          </View>
        </View>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  outline: { backgroundColor: colors.border, padding: 3, flexGrow: 1 },
  face: {
    flexGrow: 1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 12, marginVertical: 8 },
  text: { fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
