import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FlatCard } from './Cards';
import { colors } from '../styles/theme';
import * as fmt from '../utils/format';

export default function OfflineBanner({ fetchedAt }) {
  return (
    <FlatCard color={colors.possible} style={styles.card}>
      <Text style={styles.text}>
        {fetchedAt
          ? `Офлайн. Показано збережений графік від ${fmt.localDate(fetchedAt)} ${fmt.localHm(fetchedAt)}.`
          : 'Офлайн. Показано збережений графік.'}
      </Text>
    </FlatCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 12, paddingVertical: 10 },
  text: { color: colors.ink, fontSize: 13 },
});
