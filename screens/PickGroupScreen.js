import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header, { HeaderIconButton } from '../components/Header';
import BevelButton from '../components/BevelButton';
import PressScale from '../components/PressScale';
import { FlatCard } from '../components/Cards';
import Icon from '../components/Icon';
import useAddressLookup from '../hooks/useAddressLookup';
import { addGroup, loadCatalog } from '../store/thunks';
import { selectTracked } from '../store/trackedSlice';
import { MIN_STREET_CHARS, allSameGroup, filterHouses, formatAddress, houseHint } from '../utils/address';
import { colors, mono, text } from '../styles/theme';

function Field({ style, ...props }) {
  return (
    <FlatCard style={styles.field}>
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.muted} {...props} />
    </FlatCard>
  );
}

function OptionRow({ label, onPress, children }) {
  return (
    <PressScale onPress={onPress}>
      <FlatCard style={styles.option}>{children ?? <Text style={styles.optionText}>{label}</Text>}</FlatCard>
    </PressScale>
  );
}

export default function PickGroupScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const tracked = useSelector(selectTracked);
  const { groups, status, error: groupsError } = useSelector((s) => s.catalog);
  const [nickname, setNickname] = useState('');
  const lookup = useAddressLookup();
  const districtInput = useRef(null);

  const trackedIds = useMemo(() => new Set(tracked.map((t) => t.id)), [tracked]);
  const { houses, houseQuery, street, district } = lookup;
  const shownHouses = useMemo(() => filterHouses(houses, houseQuery), [houses, houseQuery]);
  const wholeStreet = allSameGroup(houses);

  const finish = (group, address = '') => {
    dispatch(addGroup(group, nickname, address));
    navigation.goBack();
  };

  const pickHouse = (hit) => {
    const group = groups.find((g) => g.id === hit.groupId) ?? groups.find((g) => g.number === hit.groupNumber);
    if (!group) {
      lookup.setError(`Групи ${hit.groupNumber} поки немає.`);
      return;
    }
    finish(group, formatAddress({ district, street, houses, houseQuery, hit }));
  };

  const pickDistrict = (value) => {
    lookup.pickDistrict(value);
    districtInput.current?.blur();
  };

  const first = tracked.length === 0;
  const hint = houseHint(houses, shownHouses, houseQuery);

  let body;
  if (groups.length > 0) {
    body = (
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.block}>
          <Text style={text.section}>Назва</Text>
          <Field value={nickname} onChangeText={setNickname} placeholder="Необов'язково, напр. Робота або Дім" maxLength={20} />
        </View>

        <View style={styles.address}>
          <Text style={text.section}>Знайти за адресою</Text>
          <FlatCard style={[styles.field, styles.combo]}>
            <TextInput
              ref={districtInput}
              style={[styles.input, styles.comboInput]}
              value={lookup.districtText}
              onChangeText={lookup.changeDistrictText}
              onFocus={lookup.openDistricts}
              onBlur={lookup.commitDistrict}
              placeholder="Район або місто"
              placeholderTextColor={colors.muted}
              selectTextOnFocus
            />
            <Pressable onPress={lookup.toggleDistricts} hitSlop={10}>
              <View style={styles.chevron}>
                <Icon name="chevronRight" />
              </View>
            </Pressable>
          </FlatCard>
          {lookup.suggestions.length > 0 ? (
            <View style={styles.list}>
              {lookup.suggestions.map((d) => (
                <OptionRow key={d} label={d} onPress={() => pickDistrict(d)} />
              ))}
            </View>
          ) : null}
          {lookup.districtOpen && lookup.suggestions.length === 0 ? <Text style={text.muted}>Такого району немає.</Text> : null}

          {street === null ? (
            <View style={styles.address}>
              <Field value={lookup.streetQuery} onChangeText={lookup.setStreetQuery} placeholder="Вулиця, напр. Універс" />
              {lookup.streets.length > 0 ? (
                <View style={styles.list}>
                  {lookup.streets.map((s) => (
                    <OptionRow key={s} label={s} onPress={() => lookup.pickStreet(s)} />
                  ))}
                </View>
              ) : null}
              {lookup.streets.length === 0 && !lookup.searching && !lookup.error && lookup.streetQuery.trim().length >= MIN_STREET_CHARS ? (
                <Text style={text.muted}>Вулиць не знайдено.</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.address}>
              <PressScale scaleTo={1} onPress={lookup.clearStreet}>
                <FlatCard style={[styles.option, styles.streetRow]}>
                  <Text style={styles.streetText}>{street}</Text>
                  <Icon name="pencil" />
                </FlatCard>
              </PressScale>
              {wholeStreet ? (
                <BevelButton text={`Вся вулиця · Група ${houses[0].groupNumber}`} onPress={() => pickHouse(houses[0])} />
              ) : null}
              <Field value={houseQuery} onChangeText={lookup.setHouseQuery} placeholder="Номер будинку" maxLength={12} />
              {hint ? <Text style={text.muted}>{hint}</Text> : null}
              <View style={styles.list}>
                {shownHouses.map((h) => (
                  <OptionRow key={`${h.groupId}-${h.number}`} onPress={() => pickHouse(h)}>
                    <View style={styles.houseRow}>
                      <Text style={styles.houseNumber}>{h.number || 'Без номера'}</Text>
                      <Text style={styles.houseGroup}>{`Група ${h.groupNumber}`}</Text>
                    </View>
                  </OptionRow>
                ))}
              </View>
            </View>
          )}
          {lookup.error ? <Text style={styles.error}>{lookup.error}</Text> : null}
        </View>

        <Text style={text.section}>Або оберіть номер групи</Text>
        <View style={styles.grid}>
          {groups.map((g) => (
            <PressScale key={g.id} onPress={() => finish(g)} style={styles.cell}>
              <FlatCard color={trackedIds.has(g.id) ? colors.bg : colors.white} style={styles.cellCard}>
                <Text style={styles.cellNumber}>{g.number}</Text>
              </FlatCard>
            </PressScale>
          ))}
        </View>
      </ScrollView>
    );
  } else if (status === 'error') {
    body = (
      <View style={styles.centered}>
        <Text style={[text.base, styles.center]}>{groupsError ?? 'Не вдалося завантажити групи.'}</Text>
        <BevelButton text="Спробувати ще" onPress={() => dispatch(loadCatalog())} style={styles.retry} />
      </View>
    );
  } else {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.border} />
        <Text style={text.base}>Завантаження груп…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title={first ? 'Оберіть свою групу' : 'Додати групу'}
        subtitle={first ? 'Перша група стане головною.' : 'Групи, які ви вже відстежуєте, затемнені.'}
        left={<HeaderIconButton icon="arrowLeft" onPress={navigation.goBack} />}
      />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },
  block: { gap: 8 },
  address: { gap: 10 },
  field: { paddingHorizontal: 12, paddingVertical: 2 },
  input: { color: colors.ink, fontSize: 17, minHeight: 44, padding: 0 },
  combo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comboInput: { flex: 1 },
  chevron: { transform: [{ rotate: '90deg' }] },
  list: { gap: 8 },
  option: { paddingHorizontal: 14, paddingVertical: 12 },
  optionText: { color: colors.ink, fontSize: 16 },
  streetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streetText: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700' },
  houseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  houseNumber: { color: colors.ink, fontSize: 15, fontFamily: mono, fontWeight: '700' },
  houseGroup: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  error: { color: colors.dangerText, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '30%', height: 92, marginBottom: 16 },
  cellCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  cellNumber: { color: colors.ink, fontSize: 34, fontFamily: mono, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  center: { textAlign: 'center' },
  retry: { marginTop: 4 },
});
