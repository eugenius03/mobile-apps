import 'package:flutter/material.dart';

import 'models/outage.dart';
import 'models/tracked_group.dart';
import 'state/app_state.dart';
import 'theme.dart';

const _months = [
  'січ',
  'лют',
  'бер',
  'кві',
  'тра',
  'чер',
  'лип',
  'сер',
  'вер',
  'жов',
  'лис',
  'гру',
];
const _weekdays = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

String fmtDate(DateTime d, {bool weekday = false}) =>
    '${weekday ? '${_weekdays[d.weekday % 7]} ' : ''}${d.day} ${_months[d.month - 1]}';

String _two(int v) => v.toString().padLeft(2, '0');

String fmtClock(DateTime t) => '${_two(t.hour)}:${_two(t.minute)}';

String fmtHm(DateTime utc) => fmtClock(toKyiv(utc));

String fmtDur(Duration d) {
  final h = d.inHours;
  final m = d.inMinutes % 60;
  if (h == 0) return '$m хв';
  return m == 0 ? '$h год' : '$h год $m хв';
}

Color availColor(Availability a, bool possibleAsOn) => switch (a) {
  Availability.on => Pixel.on,
  Availability.off => Pixel.off,
  Availability.possible => possibleAsOn ? Pixel.on : Pixel.possible,
};

Color _cardColor(Availability a, bool possibleAsOn) =>
    a == Availability.on || (a == Availability.possible && possibleAsOn)
    ? Colors.white
    : availColor(a, possibleAsOn);

String availLabel(Availability a) => switch (a) {
  Availability.on => 'Світло є',
  Availability.off => 'Світла немає',
  Availability.possible => 'Світло можливе',
};

String _availShort(Availability a) => switch (a) {
  Availability.on => 'Світло є',
  Availability.off => 'Світла немає',
  Availability.possible => 'Можливе',
};

String availIcon(Availability a) => switch (a) {
  Availability.on => 'zap',
  Availability.off => 'zap_off',
  Availability.possible => 'hourglass',
};

class TimelineData {
  const TimelineData(this.cells, this.nowIndex);

  final List<Color?> cells;
  final int nowIndex;
}

class AxisData {
  const AxisData(this.startHour, this.stepHours);

  final double startHour;
  final int stepHours;
}

class RunItem {
  const RunItem(this.range, this.length, this.icon, this.color);

  final String range;
  final String length;
  final String icon;
  final Color color;
}

class DayItem {
  const DayItem(this.title, this.runs);

  final String title;
  final List<RunItem> runs;
}

class CardItem {
  const CardItem({
    required this.group,
    this.ready = false,
    this.message = '',
    this.loading = false,
    this.color = Colors.white,
    this.tile = Colors.white,
    this.icon = '',
    this.label = '',
    this.until = '',
    this.next = '',
    this.dayTitle = '',
    this.timeline,
    this.axis,
  });

  final TrackedGroup group;
  final bool ready;
  final String message;
  final bool loading;
  final Color color;
  final Color tile;
  final String icon;
  final String label;
  final String until;
  final String next;
  final String dayTitle;
  final TimelineData? timeline;
  final AxisData? axis;
}

class RowItem {
  const RowItem({
    required this.group,
    required this.state,
    this.color = Colors.white,
    this.icon,
    this.slot = '',
  });

  final TrackedGroup group;
  final String state;
  final Color color;
  final String? icon;
  final String slot;
}

String dayLabel(DateTime day) => fmtDate(day, weekday: true);

String _offText(Duration off) =>
    off == Duration.zero ? 'без відключень' : '${fmtDur(off)} без світла';

int _nowSlot(DateTime day) {
  final minutes = DateTime.now()
      .toUtc()
      .difference(kyivMidnightUtc(day))
      .inMinutes;
  return (minutes ~/ 30).clamp(0, 47);
}

TimelineData _timeline(Schedule schedule, DateTime day, bool asOn, int from) {
  final runs = schedule.runsForDay(day);
  final start = kyivMidnightUtc(day);
  final now = DateTime.now().toUtc();
  final cells = <Color?>[];
  var nowIndex = -1;
  for (var i = from; i < 48; i++) {
    final t = start.add(Duration(minutes: 30 * i));
    final run = runs
        .where((r) => !t.isBefore(r.start) && t.isBefore(r.end))
        .firstOrNull;
    cells.add(run == null ? null : availColor(run.availability, asOn));
    if (!now.isBefore(t) && now.isBefore(t.add(const Duration(minutes: 30)))) {
      nowIndex = i - from;
    }
  }
  return TimelineData(cells, nowIndex);
}

String _restOfDayTitle(Schedule schedule, DateTime day, int from) {
  final startUtc = kyivMidnightUtc(day).add(Duration(minutes: 30 * from));
  var off = Duration.zero;
  for (final r
      in schedule
          .runsForDay(day)
          .where((r) => r.availability == Availability.off)) {
    final s = r.start.isAfter(startUtc) ? r.start : startUtc;
    if (r.end.isAfter(s)) off += r.end.difference(s);
  }
  return 'Решта дня · ${_offText(off)}';
}

List<DayItem> dayItems(Schedule schedule, bool asOn) => [
  for (final day in schedule.days) _dayItem(schedule, day, asOn),
];

DayItem _dayItem(Schedule schedule, DateTime day, bool asOn) {
  final runs = [
    for (final r
        in schedule
            .runsForDay(day)
            .where((r) => r.availability != Availability.on))
      RunItem(
        '${fmtHm(r.start)} – ${fmtHm(r.end)}',
        fmtDur(r.length),
        availIcon(r.availability),
        availColor(r.availability, asOn),
      ),
  ];
  final title = runs.isNotEmpty
      ? 'Відключення · ${dayLabel(day)}'
      : '${dayLabel(day)} · без відключень';
  return DayItem(title, runs);
}

CardItem cardItem(
  TrackedGroup g,
  GroupData d,
  bool asOn, {
  bool futureOnly = false,
}) {
  final schedule = d.schedule;
  if (schedule == null) {
    return d.status == LoadStatus.error
        ? CardItem(group: g, message: d.error ?? 'Щось пішло не так.')
        : CardItem(group: g, message: 'Перевіряємо мережу…', loading: true);
  }
  if (schedule.isEmpty) {
    return CardItem(group: g, message: 'Для цієї групи немає даних.');
  }

  final now = DateTime.now();
  final cur = schedule.currentRun(now);
  if (cur == null) {
    return CardItem(group: g, message: 'Зараз поза опублікованим графіком.');
  }

  final next = schedule.nextRun(now);
  final today = kyivDay(now);
  final from = futureOnly ? _nowSlot(today) : 0;
  final until = next == null
      ? switch (cur.availability) {
          Availability.off => 'Час увімкнення ще не опубліковано',
          Availability.on => 'Наступне відключення ще не опубліковано',
          Availability.possible => 'Наступну зміну ще не опубліковано',
        }
      : 'До ${fmtHm(cur.end)} · лишилось ${fmtDur(cur.end.difference(now.toUtc()))}';
  return CardItem(
    group: g,
    ready: true,
    color: _cardColor(cur.availability, asOn),
    tile: availColor(cur.availability, asOn),
    icon: availIcon(cur.availability),
    label: availLabel(cur.availability),
    until: until,
    next: next == null
        ? ''
        : 'Далі: ${availLabel(next.availability).toLowerCase()} ${fmtHm(next.start)}–${fmtHm(next.end)}',
    dayTitle: futureOnly
        ? _restOfDayTitle(schedule, today, from)
        : '${dayLabel(today)} · ${_offText(schedule.offTime(today))}',
    timeline: _timeline(schedule, today, asOn, from),
    axis: AxisData(from / 2, futureOnly ? 3 : 6),
  );
}

RowItem rowItem(TrackedGroup g, GroupData d, bool asOn) {
  final schedule = d.schedule;
  if (schedule == null) {
    return RowItem(
      group: g,
      state: d.status == LoadStatus.error ? 'Немає даних' : 'Завантаження…',
    );
  }
  final now = DateTime.now();
  final cur = schedule.currentRun(now);
  if (cur == null) return RowItem(group: g, state: 'Зараз немає даних');
  final next = schedule.nextRun(now);
  return RowItem(
    group: g,
    color: availColor(cur.availability, asOn),
    icon: availIcon(cur.availability),
    state: _availShort(cur.availability),
    slot: next == null
        ? '· з ${fmtHm(cur.start)}'
        : '· ${fmtHm(cur.start)}–${fmtHm(cur.end)}',
  );
}
