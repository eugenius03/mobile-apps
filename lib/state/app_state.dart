import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/outage.dart';
import '../models/tracked_group.dart';
import '../services/outage_api.dart';

enum LoadStatus { idle, loading, ready, error }

class GroupData {
  Schedule? schedule;
  DateTime? fetchedAt;
  bool stale = false;
  LoadStatus status = LoadStatus.idle;
  String? error;
}

class AppState extends ChangeNotifier {
  AppState(this._prefs, this.api) {
    tracked = _loadTracked();
    final main = _prefs.getInt(_mainKey) ?? -1;
    mainId = tracked.any((t) => t.id == main) ? main : tracked.firstOrNull?.id;
    possibleAsOn = _prefs.getBool(_possibleKey) ?? false;
  }

  static const _autoRefreshMinutes = 15;
  static const _trackedKey = 'tracked_groups';
  static const _mainKey = 'main_group';
  static const _possibleKey = 'possible_as_on';
  static const _cachePrefix = 'schedule_cache_';

  final SharedPreferences _prefs;
  final OutageApi api;
  final Map<int, GroupData> _data = {};
  Future<void>? _init;
  Timer? _timer;
  int _ticks = 0;

  List<OutageGroup> groups = const [];
  LoadStatus groupsStatus = LoadStatus.idle;
  String? groupsError;
  late List<TrackedGroup> tracked;
  int? mainId;
  late bool possibleAsOn;

  TrackedGroup? get main => find(mainId);

  Iterable<TrackedGroup> get others => tracked.where((t) => t.id != mainId);

  TrackedGroup? find(int? id) => tracked.where((t) => t.id == id).firstOrNull;

  bool get offline => tracked.any((t) => data(t.id).stale);

  DateTime? get staleSince {
    final times = [
      for (final t in tracked)
        if (data(t.id).stale && data(t.id).fetchedAt != null)
          data(t.id).fetchedAt!,
    ]..sort();
    return times.firstOrNull;
  }

  GroupData data(int id) => _data.putIfAbsent(id, GroupData.new);

  Future<void> ensureInit() => _init ??= _initialize();

  Future<void> _initialize() async {
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (++_ticks % _autoRefreshMinutes == 0) {
        refreshAll();
      } else {
        notifyListeners();
      }
    });
    await Future.wait([loadGroups(), refreshAll()]);
  }

  Future<void> loadGroups() async {
    groupsStatus = LoadStatus.loading;
    notifyListeners();
    try {
      groups = await api.fetchGroups();
      groupsStatus = LoadStatus.ready;
    } on OutageApiException catch (e) {
      groupsStatus = LoadStatus.error;
      groupsError = e.message;
    }
    notifyListeners();
  }

  Future<void> refreshAll() =>
      Future.wait([for (final t in List.of(tracked)) refreshGroup(t.id)]);

  Future<void> refreshGroup(int id) async {
    final group = find(id);
    if (group == null) return;
    final data = this.data(id);
    data.status = LoadStatus.loading;
    data.error = null;
    notifyListeners();
    try {
      final raw = await api.fetchScheduleRaw(group.group);
      final parsed = Schedule.parseRaw(raw);
      final now = DateTime.now();
      data
        ..schedule = parsed
        ..fetchedAt = now
        ..stale = false
        ..status = LoadStatus.ready;
      _saveCache(id, raw, now);
    } on OutageApiException catch (e) {
      _fail(id, e.message);
    } on FormatException {
      _fail(id, 'Неочікувана відповідь сервера eSvitlo.');
    }
    if (find(id) != null) notifyListeners();
  }

  void _fail(int id, String message) {
    final data = this.data(id);
    data.error = message;
    final cached = data.schedule == null ? _loadCache(id) : null;
    if (cached != null) {
      data
        ..schedule = cached.$1
        ..fetchedAt = cached.$2;
    }
    if (data.schedule != null) {
      data
        ..stale = true
        ..status = LoadStatus.ready;
    } else {
      data.status = LoadStatus.error;
    }
  }

  void add(OutageGroup g, String nickname, [String address = '']) {
    final existing = find(g.id);
    if (existing != null) {
      if (address.isNotEmpty && existing.address.isEmpty) {
        tracked = [
          for (final t in tracked)
            t.id == g.id ? t.copyWith(address: address) : t,
        ];
        _saveTracked();
        notifyListeners();
      }
      return;
    }
    tracked = [
      ...tracked,
      TrackedGroup(
        id: g.id,
        number: g.number,
        nickname: nickname.trim(),
        address: address,
      ),
    ];
    mainId ??= g.id;
    _saveTracked();
    notifyListeners();
    refreshGroup(g.id);
  }

  void remove(int id) {
    tracked = tracked.where((t) => t.id != id).toList();
    _data.remove(id);
    if (mainId == id) mainId = tracked.firstOrNull?.id;
    _saveTracked();
    notifyListeners();
  }

  void setMain(int id) {
    if (find(id) == null) return;
    mainId = id;
    _saveTracked();
    notifyListeners();
  }

  void rename(int id, String nickname) {
    tracked = [
      for (final t in tracked)
        t.id == id ? t.copyWith(nickname: nickname.trim()) : t,
    ];
    _saveTracked();
    notifyListeners();
  }

  void clearAll() {
    tracked = [];
    _data.clear();
    mainId = null;
    _saveTracked();
    notifyListeners();
  }

  void setPossibleAsOn(bool value) {
    possibleAsOn = value;
    _prefs.setBool(_possibleKey, value);
    notifyListeners();
  }

  List<TrackedGroup> _loadTracked() {
    try {
      final raw = _prefs.getString(_trackedKey);
      if (raw == null) return [];
      return [
        for (final e in (jsonDecode(raw) as List).cast<Map<String, dynamic>>())
          TrackedGroup.fromJson(e),
      ];
    } on FormatException {
      return [];
    } on TypeError {
      return [];
    }
  }

  void _saveTracked() {
    _prefs.setString(
      _trackedKey,
      jsonEncode([for (final t in tracked) t.toJson()]),
    );
    _prefs.setInt(_mainKey, mainId ?? -1);
  }

  void _saveCache(int id, String raw, DateTime at) {
    _prefs.setString('$_cachePrefix$id', raw);
    _prefs.setString('$_cachePrefix${id}_at', at.toIso8601String());
  }

  (Schedule, DateTime)? _loadCache(int id) {
    final raw = _prefs.getString('$_cachePrefix$id');
    if (raw == null || raw.isEmpty) return null;
    try {
      final at = DateTime.tryParse(
        _prefs.getString('$_cachePrefix${id}_at') ?? '',
      );
      return (Schedule.parseRaw(raw), at ?? DateTime.now());
    } on FormatException {
      return null;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
