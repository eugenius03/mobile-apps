import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import PropTypes from 'prop-types';
import { vibrate, tick } from '../utils';

const PRESETS = [
  { id: '25_5', label: '25/5', work: 25 * 60, break: 5 * 60 },
  { id: '50_10', label: '50/10', work: 50 * 60, break: 10 * 60 },
  { id: '45_15', label: '45/15', work: 45 * 60, break: 15 * 60 },
  { id: '15_3', label: '15/3', work: 15 * 60, break: 3 * 60 },
  { id: '10s_5s', label: '10s/5s', work: 10, break: 5 },
];

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function CustomTimeInput({
  workDuration,
  breakDuration,
  initialWorkMinutes = 25,
  initialWorkSeconds = 0,
  initialBreakMinutes = 5,
  initialBreakSeconds = 0,
  onApply,
}) {
  const initialWork =
    workDuration !== undefined
      ? workDuration
      : initialWorkMinutes * 60 + initialWorkSeconds;
  const initialBreak =
    breakDuration !== undefined
      ? breakDuration
      : initialBreakMinutes * 60 + initialBreakSeconds;

  const [currentWork, setCurrentWork] = useState(initialWork);
  const [currentBreak, setCurrentBreak] = useState(initialBreak);

  // Sync with external props if they change
  useEffect(() => {
    if (workDuration !== undefined) {
      setCurrentWork(workDuration);
    }
  }, [workDuration]);

  useEffect(() => {
    if (breakDuration !== undefined) {
      setCurrentBreak(breakDuration);
    }
  }, [breakDuration]);

  // Modal state for exact manual numeric entry
  const [modalVisible, setModalVisible] = useState(false);
  const [modalWorkMins, setModalWorkMins] = useState('');
  const [modalWorkSecs, setModalWorkSecs] = useState('');
  const [modalBreakMins, setModalBreakMins] = useState('');
  const [modalBreakSecs, setModalBreakSecs] = useState('');

  const openManualModal = () => {
    tick();
    setModalWorkMins(String(Math.floor(currentWork / 60)));
    setModalWorkSecs(String(currentWork % 60).padStart(2, '0'));
    setModalBreakMins(String(Math.floor(currentBreak / 60)));
    setModalBreakSecs(String(currentBreak % 60).padStart(2, '0'));
    setModalVisible(true);
  };

  const applyTimes = (workSecs, breakSecs) => {
    setCurrentWork(workSecs);
    setCurrentBreak(breakSecs);
    onApply({
      workTotalSeconds: workSecs,
      breakTotalSeconds: breakSecs,
      workMinutes: Math.floor(workSecs / 60),
      workSeconds: workSecs % 60,
      breakMinutes: Math.floor(breakSecs / 60),
      breakSeconds: breakSecs % 60,
    });
  };

  const handleAdjustWork = (secondsDelta) => {
    tick();
    let nextVal = currentWork + secondsDelta;
    // Handle small durations gracefully
    if (currentWork <= 60 && secondsDelta === -60) {
      nextVal = Math.max(10, currentWork - 10);
    } else if (currentWork < 60 && secondsDelta === 60) {
      nextVal = currentWork + 10;
    }
    nextVal = Math.max(10, Math.min(180 * 60, nextVal));
    applyTimes(nextVal, currentBreak);
  };

  const handleAdjustBreak = (secondsDelta) => {
    tick();
    let nextVal = currentBreak + secondsDelta;
    // Handle small durations gracefully
    if (currentBreak <= 60 && secondsDelta === -60) {
      nextVal = Math.max(5, currentBreak - 5);
    } else if (currentBreak < 60 && secondsDelta === 60) {
      nextVal = currentBreak + 5;
    }
    nextVal = Math.max(5, Math.min(60 * 60, nextVal));
    applyTimes(currentWork, nextVal);
  };

  const handleSelectPreset = (preset) => {
    tick();
    applyTimes(preset.work, preset.break);
  };

  const handleApplyModal = () => {
    tick();
    const wm = Number.parseInt(modalWorkMins, 10) || 0;
    const ws = Number.parseInt(modalWorkSecs, 10) || 0;
    const bm = Number.parseInt(modalBreakMins, 10) || 0;
    const bs = Number.parseInt(modalBreakSecs, 10) || 0;

    const totalWork = wm * 60 + ws;
    const totalBreak = bm * 60 + bs;

    if (totalWork <= 0 || totalBreak <= 0) {
      Alert.alert('INVALID DURATION', 'Both Work and Break durations must be at least 1 second.');
      return;
    }

    applyTimes(totalWork, totalBreak);
    setModalVisible(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>[ TIME CONFIGURATION ]</Text>
      </View>

      {/* Quick 1-tap presets row */}
      <View style={styles.presetsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsScrollContent}
        >
          {PRESETS.map((preset) => {
            const isActive =
              currentWork === preset.work && currentBreak === preset.break;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetChip,
                  isActive && styles.presetChipActive,
                  preset.id === '10s_5s' && !isActive && styles.testPresetChip,
                ]}
                onPress={() => handleSelectPreset(preset)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    isActive && styles.presetChipTextActive,
                    preset.id === '10s_5s' && !isActive && styles.testPresetChipText,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.vibroChip}
            onPress={() => {
              tick();
              vibrate();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.vibroChipText}>📳 VIBRO</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Stepper Blocks */}
      <View style={styles.steppersContainer}>
        {/* WORK DURATION BLOCK */}
        <View style={styles.durationSection}>
          <View style={styles.durationLabelRow}>
            <View style={styles.labelTagWork}>
              <Text style={styles.labelTagText}>WORK</Text>
            </View>
            <Text style={styles.durationHint}>TAP TO EDIT EXACT</Text>
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustWork(-300)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>-5m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustWork(-60)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>-1m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeDisplayButton}
              onPress={openManualModal}
              activeOpacity={0.8}
            >
              <Text style={styles.timeValueText}>{formatTime(currentWork)}</Text>
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustWork(60)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>+1m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustWork(300)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>+5m</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BREAK DURATION BLOCK */}
        <View style={styles.durationSection}>
          <View style={styles.durationLabelRow}>
            <View style={styles.labelTagBreak}>
              <Text style={styles.labelTagText}>BREAK</Text>
            </View>
            <Text style={styles.durationHint}>TAP TO EDIT EXACT</Text>
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustBreak(-300)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>-5m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustBreak(-60)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>-1m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeDisplayButton}
              onPress={openManualModal}
              activeOpacity={0.8}
            >
              <Text style={styles.timeValueText}>{formatTime(currentBreak)}</Text>
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustBreak(60)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>+1m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleAdjustBreak(300)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>+5m</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardAvoid}
            >
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>[ EXACT TIME CONFIG ]</Text>
                  <Text style={styles.modalSubtitle}>CUSTOM MINUTES & SECONDS</Text>
                </View>

                {/* Work Time Inputs */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>WORK SESSION</Text>
                  <View style={styles.modalInputRow}>
                    <View style={styles.modalInputGroup}>
                      <TextInput
                        style={styles.modalTextInput}
                        keyboardType="number-pad"
                        value={modalWorkMins}
                        onChangeText={setModalWorkMins}
                        maxLength={3}
                        placeholder="25"
                        placeholderTextColor="#94A3B8"
                        selectTextOnFocus
                      />
                      <Text style={styles.modalInputSub}>MIN</Text>
                    </View>

                    <Text style={styles.modalColon}>:</Text>

                    <View style={styles.modalInputGroup}>
                      <TextInput
                        style={styles.modalTextInput}
                        keyboardType="number-pad"
                        value={modalWorkSecs}
                        onChangeText={setModalWorkSecs}
                        maxLength={2}
                        placeholder="00"
                        placeholderTextColor="#94A3B8"
                        selectTextOnFocus
                      />
                      <Text style={styles.modalInputSub}>SEC</Text>
                    </View>
                  </View>
                </View>

                {/* Break Time Inputs */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>BREAK SESSION</Text>
                  <View style={styles.modalInputRow}>
                    <View style={styles.modalInputGroup}>
                      <TextInput
                        style={styles.modalTextInput}
                        keyboardType="number-pad"
                        value={modalBreakMins}
                        onChangeText={setModalBreakMins}
                        maxLength={3}
                        placeholder="05"
                        placeholderTextColor="#94A3B8"
                        selectTextOnFocus
                      />
                      <Text style={styles.modalInputSub}>MIN</Text>
                    </View>

                    <Text style={styles.modalColon}>:</Text>

                    <View style={styles.modalInputGroup}>
                      <TextInput
                        style={styles.modalTextInput}
                        keyboardType="number-pad"
                        value={modalBreakSecs}
                        onChangeText={setModalBreakSecs}
                        maxLength={2}
                        placeholder="00"
                        placeholderTextColor="#94A3B8"
                        selectTextOnFocus
                      />
                      <Text style={styles.modalInputSub}>SEC</Text>
                    </View>
                  </View>
                </View>

                {/* Modal Buttons */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalApplyBtn]}
                    onPress={handleApplyModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalApplyBtnText}>APPLY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

CustomTimeInput.propTypes = {
  workDuration: PropTypes.number,
  breakDuration: PropTypes.number,
  initialWorkMinutes: PropTypes.number,
  initialWorkSeconds: PropTypes.number,
  initialBreakMinutes: PropTypes.number,
  initialBreakSeconds: PropTypes.number,
  onApply: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    padding: 12,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardHeaderRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  presetsContainer: {
    marginBottom: 10,
  },
  presetsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingVertical: 5,
    paddingHorizontal: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  presetChipActive: {
    backgroundColor: '#000000',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  testPresetChip: {
    backgroundColor: '#FEF3C7',
  },
  testPresetChipText: {
    color: '#D97706',
  },
  vibroChip: {
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingVertical: 5,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  vibroChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0369A1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  steppersContainer: {
    gap: 8,
  },
  durationSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 8,
  },
  durationLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelTagWork: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  labelTagBreak: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  labelTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  durationHint: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  stepperButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    minWidth: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  stepperButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timeDisplayButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    paddingHorizontal: 4,
  },
  timeValueText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  editIconText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardAvoid: {
    width: '100%',
    maxWidth: 340,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.8,
  },
  modalSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  modalSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInputGroup: {
    alignItems: 'center',
  },
  modalTextInput: {
    width: 60,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalInputSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalColon: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    marginTop: -12,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    height: 40,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  modalCancelBtn: {
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalApplyBtn: {
    backgroundColor: '#000000',
  },
  modalApplyBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

