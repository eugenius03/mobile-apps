import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header, { HeaderIconButton } from '../components/Header';
import BevelButton from '../components/BevelButton';
import OfflineBanner from '../components/OfflineBanner';
import GroupCard from '../components/GroupCard';
import { FlatCard } from '../components/Cards';
import Icon from '../components/Icon';
import { confirm } from '../components/dialogs';
import { refreshGroup } from '../store/thunks';
import { mainSet, removed, renamed, selectGroupById, selectMainId, selectPossibleAsOn } from '../store/trackedSlice';
import { selectSchedule } from '../store/schedulesSlice';
import * as present from '../utils/present';
import * as fmt from '../utils/format';
import { colors, mono, text } from '../styles/theme';

const DOUBLE_TAP_MS = 350;

function DayBlock({ day }) {
  return (
    <View style={styles.day}>
      <Text style={text.section}>{day.title}</Text>
      <View style={styles.runs}>
        {day.runs.map((r) => (
          <FlatCard key={r.key} color={r.color} style={styles.run}>
            <Icon name={r.icon} />
            <Text style={styles.range}>{r.range}</Text>
            <Text style={styles.length}>{r.length}</Text>
          </FlatCard>
        ))}
      </View>
    </View>
  );
}

export default function DetailScreen({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const liveGroup = useSelector(selectGroupById(id));
  const lastGroup = useRef(liveGroup);
  if (liveGroup) lastGroup.current = liveGroup;
  const group = liveGroup ?? lastGroup.current;
  const data = useSelector(selectSchedule(id));
  const isMain = useSelector(selectMainId) === id;
  const asOn = useSelector(selectPossibleAsOn);
  const now = useSelector((s) => s.clock.now);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const lastTap = useRef(0);

  const view = useMemo(
    () => ({
      card: present.card(group, data, asOn, now),
      days: data.schedule && !data.schedule.isEmpty ? present.dayItems(data.schedule, asOn, now) : [],
    }),
    [group, data, asOn, now]
  );

  const name = present.groupName(group);
  const defaultName = `Група ${group.number}`;
  const sub = present.groupSubName(group);

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };

  const onTitleTap = () => {
    const t = Date.now();
    if (t - lastTap.current < DOUBLE_TAP_MS) startEdit();
    lastTap.current = t;
  };

  const finishEdit = () => {
    if (!editing) return;
    setEditing(false);
    const value = draft.trim();
    dispatch(renamed({ id, nickname: value === defaultName ? '' : value }));
  };

  const remove = async () => {
    if (!(await confirm('Видалити групу', `Перестати відстежувати «${name}»?`, 'Видалити'))) return;
    dispatch(removed(id));
    navigation.goBack();
  };

  const fetchedAt = data.fetchedAt;

  return (
    <View style={styles.screen}>
      <Header
        color={editing ? colors.accentDark : colors.accent}
        subtitle={`${isMain ? 'Головна група' : 'Відстежувана група'}${sub ? ` · ${sub}` : ''}`}
        left={<HeaderIconButton icon="arrowLeft" onPress={navigation.goBack} />}
        right={<HeaderIconButton icon="reload" onPress={() => dispatch(refreshGroup(id))} />}
      >
        {editing ? (
          <TextInput
            style={styles.titleInput}
            value={draft}
            onChangeText={setDraft}
            maxLength={20}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={finishEdit}
            onBlur={finishEdit}
            selectionColor={colors.onAccentMuted}
          />
        ) : (
          <View style={styles.titleRow}>
            <Pressable onPress={onTitleTap}>
              <Text style={styles.title}>{name}</Text>
            </Pressable>
            <Pressable onPress={startEdit} hitSlop={10} style={styles.pencil}>
              <Icon name="pencil" color={colors.onAccent} />
            </Pressable>
          </View>
        )}
      </Header>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {data.stale ? <OfflineBanner fetchedAt={data.fetchedAt} /> : null}
        <GroupCard item={{ ...view.card, address: '' }} />
        {group.address ? (
          <View style={styles.section}>
            <Text style={text.section}>Адреса</Text>
            <FlatCard style={styles.address}>
              <Text style={styles.addressText}>{group.address}</Text>
            </FlatCard>
          </View>
        ) : null}
        {view.days.length > 0 ? (
          <View style={styles.days}>
            {view.days.map((d) => (
              <DayBlock key={d.key} day={d} />
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          {isMain ? null : <BevelButton text="Зробити головною" icon="star" onPress={() => dispatch(mainSet(id))} />}
          <BevelButton text="Видалити групу" icon="trash" base={colors.danger} textColor={colors.border} onPress={remove} />
        </View>
        {fetchedAt ? <Text style={styles.updated}>{`Оновлено ${fmt.localHm(fetchedAt)}`}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: colors.onAccent, fontSize: 24, fontWeight: '700' },
  pencil: { opacity: 0.7 },
  titleInput: { color: colors.onAccent, fontSize: 24, fontWeight: '700', padding: 0, marginVertical: 0 },
  content: { padding: 16, gap: 24 },
  section: { gap: 8 },
  address: { paddingHorizontal: 14, paddingVertical: 12 },
  addressText: { color: colors.ink, fontSize: 16 },
  days: { gap: 20 },
  day: { gap: 10 },
  runs: { gap: 8 },
  run: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  range: { flex: 1, color: colors.ink, fontSize: 15, fontFamily: mono, fontWeight: '700' },
  length: { color: colors.ink, fontSize: 14 },
  actions: { gap: 14 },
  updated: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
