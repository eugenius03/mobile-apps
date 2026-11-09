import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressScale from './PressScale';
import Icon from './Icon';
import { colors, BORDER } from '../styles/theme';

export function HeaderIconButton({ icon, onPress }) {
  return (
    <PressScale scaleTo={0.85} onPress={onPress} style={styles.iconButton}>
      <View style={styles.iconFill}>
        <Icon name={icon} color={colors.onAccent} />
      </View>
    </PressScale>
  );
}

export default function Header({ title, subtitle, left, right, color = colors.accent, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={[styles.bar, { backgroundColor: color, paddingTop: insets.top + 8 }]}>
        {left}
        <View style={[styles.titles, !left && styles.titlesNoLeft]}>
          {children ?? <Text style={styles.title}>{title}</Text>}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 8, gap: 6 },
  titles: { flex: 1, justifyContent: 'center' },
  titlesNoLeft: { marginLeft: 10 },
  title: { color: colors.onAccent, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.onAccentMuted, fontSize: 13 },
  rule: { height: BORDER, backgroundColor: colors.border },
  iconButton: { width: 44, height: 44 },
  iconFill: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
