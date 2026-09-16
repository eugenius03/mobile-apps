import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { vibrate } from './utils';
import TimerDisplay from './components/TimerDisplay';
import TimerControls from './components/TimerControls';
import CustomTimeInput from './components/CustomTimeInput';

const DEFAULT_WORK_SECONDS = 25 * 60;
const DEFAULT_BREAK_SECONDS = 5 * 60;

export default function App() {
  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK_SECONDS);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_SECONDS);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId = null;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime > 1) {
            return prevTime - 1;
          }
          if (prevTime === 1) {
            vibrate();
            setIsRunning(false);
            return 0;
          }
          return 0;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    if (timeLeft === 0) {
      const nextMode = !isWork;
      setIsWork(nextMode);
      setTimeLeft(nextMode ? workDuration : breakDuration);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(isWork ? workDuration : breakDuration);
  };

  const handleToggleMode = () => {
    setIsRunning(false);
    const nextMode = !isWork;
    setIsWork(nextMode);
    setTimeLeft(nextMode ? workDuration : breakDuration);
  };

  const handleApplyCustomTimes = ({
    workTotalSeconds,
    breakTotalSeconds,
  }) => {
    setIsRunning(false);
    setWorkDuration(workTotalSeconds);
    setBreakDuration(breakTotalSeconds);
    setTimeLeft(isWork ? workTotalSeconds : breakTotalSeconds);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isFinished = timeLeft === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={styles.bracketText}>[</Text>
                <Text style={styles.appTitle}>POMODORO TIMER</Text>
                <Text style={styles.bracketText}>]</Text>
              </View>
              <Text style={styles.appSubtitle}>
                RETRO PRODUCTIVITY ENGINE
              </Text>
            </View>

            <TimerDisplay
              minutes={minutes}
              seconds={seconds}
              isWork={isWork}
            />

            <TimerControls
              isRunning={isRunning}
              isFinished={isFinished}
              isWork={isWork}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onToggleMode={handleToggleMode}
            />

            <CustomTimeInput
              workDuration={workDuration}
              breakDuration={breakDuration}
              initialWorkMinutes={Math.floor(workDuration / 60)}
              initialWorkSeconds={workDuration % 60}
              initialBreakMinutes={Math.floor(breakDuration / 60)}
              initialBreakSeconds={breakDuration % 60}
              onApply={handleApplyCustomTimes}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F4F8',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bracketText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  appSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
