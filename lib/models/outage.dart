import 'dart:convert';

enum Availability { on, off, possible }

class OutageGroup {
  const OutageGroup({required this.id, required this.number});

  final int id;
  final int number;
}

class AddressHit {
  const AddressHit({
    required this.number,
    required this.groupNumber,
    required this.groupId,
  });

  final String number;
  final int groupNumber;
  final int groupId;
}

Duration kyivOffset(DateTime utc) {
  DateTime lastSunday(int month) {
    var d = DateTime.utc(utc.year, month, 31, 1);
    while (d.weekday != DateTime.sunday) {
      d = d.subtract(const Duration(days: 1));
    }
    return d;
  }

  final summer = !utc.isBefore(lastSunday(3)) && utc.isBefore(lastSunday(10));
  return Duration(hours: summer ? 3 : 2);
}

DateTime toKyiv(DateTime t) {
  final u = t.toUtc();
  return u.add(kyivOffset(u));
}

DateTime kyivDay(DateTime t) {
  final k = toKyiv(t);
  return DateTime.utc(k.year, k.month, k.day);
}

DateTime kyivMidnightUtc(DateTime day) =>
    day.subtract(kyivOffset(day.subtract(const Duration(hours: 3))));

class Slot {
  const Slot({required this.start, required this.availability});

  final DateTime start;
  final Availability availability;

  DateTime get end => start.add(const Duration(minutes: 30));
}

class Run {
  const Run({
    required this.start,
    required this.end,
    required this.availability,
  });

  final DateTime start;
  final DateTime end;
  final Availability availability;

  Duration get length => end.difference(start);
}

class Schedule {
  Schedule(List<Slot> slots)
    : slots = List.of(slots)..sort((a, b) => a.start.compareTo(b.start)) {
    runs = _merge(this.slots);
  }

  final List<Slot> slots;
  late final List<Run> runs;

  bool get isEmpty => slots.isEmpty;

  factory Schedule.parseRaw(String raw) {
    try {
      return Schedule([
        for (final e in (jsonDecode(raw) as List).cast<Map<String, dynamic>>())
          Slot(
            start: _utc(DateTime.parse(e['dateTime'] as String)),
            availability: switch (e['availability'] as int) {
              1 => Availability.off,
              2 => Availability.possible,
              _ => Availability.on,
            },
          ),
      ]);
    } on TypeError {
      throw const FormatException('Unexpected schedule shape');
    }
  }

  static DateTime _utc(DateTime t) => t.isUtc
      ? t
      : DateTime.utc(t.year, t.month, t.day, t.hour, t.minute, t.second);

  static List<Run> _merge(List<Slot> slots) {
    final out = <Run>[];
    for (final s in slots) {
      if (out.isNotEmpty &&
          out.last.availability == s.availability &&
          out.last.end == s.start) {
        final last = out.removeLast();
        out.add(
          Run(start: last.start, end: s.end, availability: last.availability),
        );
      } else {
        out.add(Run(start: s.start, end: s.end, availability: s.availability));
      }
    }
    return out;
  }

  Run? currentRun(DateTime now) {
    final n = now.toUtc();
    for (final r in runs) {
      if (!n.isBefore(r.start) && n.isBefore(r.end)) return r;
    }
    return null;
  }

  Run? nextRun(DateTime now) {
    final cur = currentRun(now);
    if (cur == null) return null;
    final i = runs.indexOf(cur);
    return i + 1 < runs.length ? runs[i + 1] : null;
  }

  List<Run> runsForDay(DateTime day) {
    final startUtc = kyivMidnightUtc(day);
    final endUtc = kyivMidnightUtc(day.add(const Duration(days: 1)));
    final out = <Run>[];
    for (final r in runs) {
      final s = r.start.isBefore(startUtc) ? startUtc : r.start;
      final e = r.end.isAfter(endUtc) ? endUtc : r.end;
      if (s.isBefore(e)) {
        out.add(Run(start: s, end: e, availability: r.availability));
      }
    }
    return out;
  }

  List<DateTime> get days =>
      ({for (final s in slots) kyivDay(s.start)}).toList()..sort();

  Duration offTime(DateTime day) => runsForDay(day)
      .where((r) => r.availability == Availability.off)
      .fold(Duration.zero, (a, r) => a + r.length);
}
