import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';

export default function TimerControls({
  isRunning,
  isFinished,
  isWork,
  onStart,
  onPause,
  onReset,
  onToggleMode,
}) {
  let primaryText = '▶ START';
  if (isRunning) {
    primaryText = '⏸ PAUSE';
  } else if (isFinished) {
    primaryText = isWork ? '▶ START BREAK' : '▶ START WORK';
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={onReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetButtonText}>↺ RESET</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isRunning ? styles.pauseButton : styles.startButton,
          ]}
          onPress={isRunning ? onPause : onStart}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionButtonText,
              isRunning ? styles.pauseButtonText : styles.startButtonText,
            ]}
          >
            {primaryText}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={onToggleMode}
        activeOpacity={0.7}
      >
        <Text style={styles.switchButtonText}>[ ⇄ SWITCH MODE ]</Text>
      </TouchableOpacity>
    </View>
  );
}

TimerControls.propTypes = {
  isRunning: PropTypes.bool.isRequired,
  isFinished: PropTypes.bool,
  isWork: PropTypes.bool,
  onStart: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onToggleMode: PropTypes.func.isRequired,
};

TimerControls.defaultProps = {
  isFinished: false,
  isWork: true,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
  },
  resetButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  startButton: {
    backgroundColor: '#000000',
  },
  startButtonText: {
    color: '#FFFFFF',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  pauseButtonText: {
    color: '#000000',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  switchButton: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  switchButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
