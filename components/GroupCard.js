import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlatCard, ShadowCard } from './Cards';
import { Timeline, Axis } from './Timeline';
import Icon from './Icon';
import { text, colors } from '../styles/theme';

export function NameLine({ name, sub, address, size, addressSize }) {
  return (
    <View style={styles.nameLine}>
      <Text style={[styles.name, { fontSize: size }]}>{name}</Text>
      {sub ? <Text style={[text.muted, styles.sub]}>{sub}</Text> : null}
      {address ? (
        <Text style={[text.muted, styles.address, { fontSize: addressSize }]} numberOfLines={1}>
          {`· ${address}`}
        </Text>
      ) : null}
    </View>
  );
}

export default function GroupCard({ item }) {
  return (
    <ShadowCard color={item.color}>
      <View style={styles.body}>
        <NameLine name={item.name} sub={item.sub} address={item.address} size={20} addressSize={14} />
        {item.ready ? (
          <View style={styles.body}>
            <View style={styles.status}>
              <FlatCard color={item.tile} style={styles.tile}>
                <Icon name={item.icon} size={48} />
              </FlatCard>
              <Text style={styles.label}>{item.label}</Text>
            </View>
            <View style={styles.until}>
              <Text style={styles.untilText}>{item.until}</Text>
              {item.next ? <Text style={styles.next}>{item.next}</Text> : null}
            </View>
            <View style={styles.timelineBlock}>
              <Text style={text.section}>{item.dayTitle}</Text>
              <FlatCard style={styles.timelineCard}>
                <Timeline cells={item.timeline.cells} nowIndex={item.timeline.nowIndex} />
                <Axis startHour={item.axis.startHour} step={item.axis.step} />
              </FlatCard>
            </View>
          </View>
        ) : (
          <View style={styles.message}>
            {item.loading ? <ActivityIndicator color={colors.border} /> : null}
            <Text style={text.base}>{item.message}</Text>
          </View>
        )}
      </View>
    </ShadowCard>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  nameLine: { flexDirection: 'row', alignItems: 'flex-end' },
  name: { color: colors.ink, fontWeight: '700' },
  sub: { marginLeft: 8, marginBottom: 1 },
  address: { flexShrink: 1, marginLeft: 10, marginBottom: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tile: { width: 72, height: 72, padding: 0, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: colors.ink, fontSize: 30, fontWeight: '700' },
  until: { gap: 4 },
  untilText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  next: { color: colors.ink, fontSize: 14 },
  timelineBlock: { gap: 8 },
  timelineCard: { padding: 0 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
