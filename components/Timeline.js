import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, mono } from '../styles/theme';

export function Timeline({ cells, nowIndex }) {
  return (
    <View style={styles.timeline}>
      {cells.map((c, i) => (
        <View key={i} style={[styles.cell, { backgroundColor: c ?? colors.bg }]} />
      ))}
      {nowIndex >= 0 ? <View style={[styles.now, { left: `${(nowIndex / cells.length) * 100}%` }]} /> : null}
    </View>
  );
}

const LABEL_WIDTH = 48;

function labels(startHour, step) {
  const whole = startHour % 1 === 0;
  const startText = `${String(Math.floor(startHour)).padStart(2, '0')}${whole ? (step === 3 ? ':00' : '') : ':30'}`;
  const out = [{ text: startText, hour: startHour, align: 'left' }];
  for (let h = step; h < 24; h += step) {
    if (h - startHour >= 2 && 24 - h >= 2) out.push({ text: String(h).padStart(2, '0'), hour: h, align: 'center' });
  }
  out.push({ text: '24', hour: 24, align: 'right' });
  return out;
}

export function Axis({ startHour, step }) {
  const span = 24 - startHour;
  return (
    <View style={styles.axis}>
      <View style={styles.axisInner}>
        {labels(startHour, step).map(({ text, hour, align }) => {
          const pos = `${((hour - startHour) / span) * 100}%`;
          const place =
            align === 'left' ? { left: pos } : align === 'right' ? { left: pos, marginLeft: -LABEL_WIDTH } : { left: pos, marginLeft: -LABEL_WIDTH / 2 };
          return (
            <Text key={hour} style={[styles.label, place, { textAlign: align }]}>
              {text}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { flexDirection: 'row', height: 44 },
  cell: { flex: 1 },
  now: { position: 'absolute', top: 0, bottom: 0, width: 4, backgroundColor: colors.border },
  axis: { height: 22, marginVertical: 2 },
  axisInner: { flex: 1, marginHorizontal: 6 },
  label: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: LABEL_WIDTH,
    textAlignVertical: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontFamily: mono,
    fontWeight: '700',
    color: colors.border,
  },
});
