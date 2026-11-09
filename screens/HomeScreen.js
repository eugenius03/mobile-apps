import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header, { HeaderIconButton } from '../components/Header';
import BevelButton from '../components/BevelButton';
import GroupCard, { NameLine } from '../components/GroupCard';
import OfflineBanner from '../components/OfflineBanner';
import PressScale from '../components/PressScale';
import { FlatCard } from '../components/Cards';
import Icon from '../components/Icon';
import { refreshAll } from '../store/thunks';
import { selectMainId, selectPossibleAsOn, selectTracked } from '../store/trackedSlice';
import * as present from '../utils/present';
import { colors, mono, text } from '../styles/theme';

function GroupRow({ item, onPress }) {
  return (
    <PressScale onPress={onPress}>
      <FlatCard color={item.color} style={styles.row}>
        {item.icon ? <Icon name={item.icon} /> : null}
        <View style={styles.rowBody}>
          <NameLine name={item.name} sub={item.sub} address={item.address} size={17} addressSize={13} />
          <View style={styles.rowState}>
            <Text style={styles.stateText}>{item.state}</Text>
            <Text style={styles.slot}>{item.slot}</Text>
          </View>
        </View>
        <Icon name="chevronRight" />
      </FlatCard>
    </PressScale>
  );
}

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const tracked = useSelector(selectTracked);
  const mainId = useSelector(selectMainId);
  const asOn = useSelector(selectPossibleAsOn);
  const schedules = useSelector((s) => s.schedules);
  const now = useSelector((s) => s.clock.now);
  const [refreshing, setRefreshing] = useState(false);

  const { main, others } = useMemo(() => {
    const data = (g) => schedules[g.id] ?? { schedule: null, status: 'loading' };
    const mainGroup = tracked.find((g) => g.id === mainId);
    return {
      main: mainGroup ? { id: mainGroup.id, item: present.card(mainGroup, data(mainGroup), asOn, now, true) } : null,
      others: tracked.filter((g) => g.id !== mainId).map((g) => ({ id: g.id, item: present.row(g, data(g), asOn, now) })),
    };
  }, [tracked, mainId, asOn, schedules, now]);

  const staleTimes = tracked.map((g) => schedules[g.id]).filter((d) => d?.stale);
  const staleSince = staleTimes.map((d) => d.fetchedAt).filter(Boolean).sort()[0] ?? null;

  const add = () => navigation.navigate('Pick');
  const open = (id) => navigation.navigate('Detail', { id });

  const refresh = async () => {
    setRefreshing(true);
    await dispatch(refreshAll());
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Svitlo"
        subtitle="Графік відключень у Чернівцях"
        right={
          <View style={styles.actions}>
            {tracked.length > 0 ? <HeaderIconButton icon="plus" onPress={add} /> : null}
            <HeaderIconButton icon="sliders" onPress={() => navigation.navigate('Settings')} />
          </View>
        }
      />
      {tracked.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyText}>
            <Text style={styles.emptyTitle}>До якої групи ви належите?</Text>
            <Text style={[text.muted, styles.center]}>Додайте її, щоб бачити, коли є світло, а коли його вимкнуть.</Text>
          </View>
          <BevelButton icon="plus" iconSize={96} onPress={add} style={styles.bigButton} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          {staleTimes.length > 0 ? <OfflineBanner fetchedAt={staleSince} /> : null}
          {main ? (
            <PressScale onPress={() => open(main.id)}>
              <GroupCard item={main.item} />
            </PressScale>
          ) : null}
          {others.length > 0 ? (
            <View style={styles.others}>
              <Text style={text.section}>Інші групи</Text>
              {others.map((o) => (
                <GroupRow key={o.id} item={o.item} onPress={() => open(o.id)} />
              ))}
            </View>
          ) : null}
          <BevelButton text="Додати групу" icon="plus" onPress={add} style={styles.addButton} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  actions: { flexDirection: 'row' },
  empty: { flex: 1, justifyContent: 'center', gap: 28, paddingHorizontal: 32 },
  emptyText: { gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  center: { textAlign: 'center' },
  bigButton: { width: 190, height: 190, alignSelf: 'center' },
  content: { padding: 16, gap: 28 },
  others: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  rowBody: { flex: 1, gap: 2 },
  rowState: { flexDirection: 'row', gap: 6 },
  stateText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  slot: { color: colors.ink, fontSize: 14, fontFamily: mono, fontWeight: '700' },
});
