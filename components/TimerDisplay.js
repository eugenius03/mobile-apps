import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';

export default function TimerDisplay({ minutes, seconds, isWork }) {
  const isFinished = minutes === 0 && seconds === 0;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  let badgeStyle = isWork ? styles.workBadge : styles.breakBadge;
  let badgeText = isWork ? '[ WORK SESSION ]' : '[ BREAK TIME ]';
  let statusText = isWork ? 'STAY FOCUSED' : 'TIME TO RECHARGE';

  if (isFinished) {
    badgeStyle = styles.finishedBadge;
    badgeText = '[ 🔔 SESSION COMPLETED ]';
    statusText = isWork ? 'READY FOR BREAK' : 'READY FOR WORK';
  }

  return (
    <View style={styles.card}>
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>

      <Text style={[styles.timeDigits, isFinished && styles.finishedDigits]}>
        {formattedMinutes}:{formattedSeconds}
      </Text>

      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
}

TimerDisplay.propTypes = {
  minutes: PropTypes.number.isRequired,
  seconds: PropTypes.number.isRequired,
  isWork: PropTypes.bool.isRequired,
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  badge: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  workBadge: {
    backgroundColor: '#FEE2E2',
  },
  breakBadge: {
    backgroundColor: '#D1FAE5',
  },
  finishedBadge: {
    backgroundColor: '#FEF08A',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#000000',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timeDigits: {
    fontSize: 64,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  finishedDigits: {
    color: '#D97706',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
});
