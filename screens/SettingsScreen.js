import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header, { HeaderIconButton } from '../components/Header';
import BevelButton from '../components/BevelButton';
import { confirm } from '../components/dialogs';
import { cleared, possibleAsOnSet, selectPossibleAsOn, selectTracked } from '../store/trackedSlice';
import { colors, text } from '../styles/theme';

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const asOn = useSelector(selectPossibleAsOn);
  const canClear = useSelector(selectTracked).length > 0;

  const clear = async () => {
    if (await confirm('Видалити всі групи', 'Перестати відстежувати всі групи?', 'Видалити')) dispatch(cleared());
  };

  return (
    <View style={styles.screen}>
      <Header title="Налаштування" left={<HeaderIconButton icon="arrowLeft" onPress={navigation.goBack} />} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}>
        <View style={styles.section}>
          <Text style={text.section}>Можливе світло</Text>
          <Text style={text.muted}>
            Деякі проміжки позначені як можливі. Показувати їх окремим кольором чи вважати, що світло є.
          </Text>
          <View style={styles.toggle}>
            <BevelButton
              text="Окремий колір"
              base={asOn ? colors.white : colors.accent}
              textColor={asOn ? colors.border : colors.white}
              onPress={() => dispatch(possibleAsOnSet(false))}
              style={styles.half}
            />
            <BevelButton
              text="Як світло є"
              base={asOn ? colors.accent : colors.white}
              textColor={asOn ? colors.white : colors.border}
              onPress={() => dispatch(possibleAsOnSet(true))}
              style={styles.half}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={text.section}>Про дані</Text>
          <Text style={text.muted}>
            Графіки беруться з неофіційного API eSvitlo.cv. Час київський, оновлення кожні 15 хвилин. Без інтернету показується останній збережений графік із відповідною позначкою.
          </Text>
        </View>
        <BevelButton
          text="Видалити всі групи"
          icon="trash"
          base={colors.danger}
          textColor={colors.border}
          disabled={!canClear}
          onPress={clear}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 28 },
  section: { gap: 10 },
  toggle: { flexDirection: 'row', gap: 14, marginTop: 4 },
  half: { flex: 1 },
});
