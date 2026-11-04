import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/outage.dart';
import '../services/outage_api.dart';
import 'app_state.dart';

class PickController extends ChangeNotifier {
  PickController(this._state) {
    _state.addListener(notifyListeners);
  }

  static const _minStreetChars = 2;
  static const _maxRows = 8;

  final AppState _state;
  int _searchToken = 0;
  bool _disposed = false;
  bool _searching = false;
  String _district = OutageApi.city;
  String _districtText = OutageApi.city;
  String? _districtFilter;
  bool _districtOpen = false;
  String _streetQuery = '';
  String? _street;
  String _houseQuery = '';
  List<AddressHit> _houses = [];
  List<String> _streets = [];
  String? _addressError;

  List<String> districts = [OutageApi.city];
  String nickname = '';

  String get districtText => _districtText;

  String get streetQuery => _streetQuery;

  String get houseQuery => _houseQuery;

  String? get street => _street;

  String? get addressError => _addressError;

  List<String> get streets => _streets;

  String get title =>
      _state.tracked.isEmpty ? 'Оберіть свою групу' : 'Додати групу';

  String get hint => _state.tracked.isEmpty
      ? 'Перша група стане головною.'
      : 'Групи, які ви вже відстежуєте, затемнені.';

  List<OutageGroup> get groups => _state.groups;

  bool isTracked(OutageGroup g) => _state.find(g.id) != null;

  bool get showGroups => _state.groups.isNotEmpty;

  bool get showError => !showGroups && _state.groupsStatus == LoadStatus.error;

  bool get showLoading => !showGroups && !showError;

  String get error => _state.groupsError ?? 'Не вдалося завантажити групи.';

  Future<void> load() async {
    await _state.ensureInit();
    await _loadDistricts();
  }

  Future<void> retry() => _state.loadGroups();

  Future<void> _loadDistricts() async {
    if (districts.length > 1) return;
    try {
      districts = await _state.api.fetchDistricts();
      notifyListeners();
    } on OutageApiException {
      return;
    }
  }

  List<String> get districtSuggestions {
    if (!_districtOpen) return const [];
    final filter = _districtFilter?.trim().toLowerCase() ?? '';
    return [
      for (final d in districts)
        if (filter.isEmpty || d.toLowerCase().contains(filter)) d,
    ];
  }

  bool get showNoDistricts => _districtOpen && districtSuggestions.isEmpty;

  void setDistrictText(String value) {
    if (value == _districtText) return;
    _districtText = value;
    _districtFilter = value;
    _districtOpen = true;
    final typed = value.trim().toLowerCase();
    final exact = districts.where((d) => d.toLowerCase() == typed).firstOrNull;
    if (exact != null && exact != _district) _setDistrict(exact);
    notifyListeners();
  }

  void pickDistrict(String district) {
    _setDistrict(district);
    _districtOpen = false;
    notifyListeners();
  }

  void toggleDistricts() {
    _districtOpen = !_districtOpen;
    _districtFilter = null;
    notifyListeners();
  }

  void openDistricts() {
    _districtOpen = true;
    _districtFilter = null;
    notifyListeners();
  }

  void commitDistrict() {
    _districtOpen = false;
    if (!districts.contains(_districtText)) _districtText = _district;
    notifyListeners();
  }

  void _setDistrict(String value) {
    _district = value;
    _districtText = value;
    _street = null;
    _houses = [];
    _streets = [];
    _streetQuery = '';
    _searchToken++;
  }

  void setStreetQuery(String value) {
    if (value == _streetQuery) return;
    _streetQuery = value;
    _searchStreets();
  }

  void setHouseQuery(String value) {
    if (value == _houseQuery) return;
    _houseQuery = value;
    notifyListeners();
  }

  void clearStreet() {
    _street = null;
    _houses = [];
    _houseQuery = '';
    notifyListeners();
  }

  bool get showStreetResults => _street == null && _streets.isNotEmpty;

  bool get showNoStreets =>
      _street == null &&
      !_searching &&
      _addressError == null &&
      _streetQuery.trim().length >= _minStreetChars &&
      _streets.isEmpty;

  bool get allSameGroup =>
      _houses.isNotEmpty && _houses.map((h) => h.groupId).toSet().length == 1;

  String get wholeStreetText =>
      allSameGroup ? 'Вся вулиця · Група ${_houses.first.groupNumber}' : '';

  String get houseHint {
    if (_houses.isEmpty) return '';
    if (_houseQuery.trim().isEmpty) {
      return 'Будинків: ${_houses.length}. Введіть номер, щоб звузити.';
    }
    return houses.isEmpty ? 'Такого будинку на цій вулиці немає.' : '';
  }

  List<AddressHit> get houses {
    final q = _houseQuery.trim().toLowerCase();
    final found =
        [
          for (final h in _houses)
            if (q.isEmpty || h.number.toLowerCase().contains(q)) h,
        ]..sort((a, b) {
          final byPrefix =
              (a.number.toLowerCase().startsWith(q) ? 0 : 1) -
              (b.number.toLowerCase().startsWith(q) ? 0 : 1);
          if (byPrefix != 0) return byPrefix;
          final byLength = a.number.length - b.number.length;
          return byLength != 0
              ? byLength
              : a.number.toLowerCase().compareTo(b.number.toLowerCase());
        });
    return found.take(_maxRows).toList();
  }

  Future<void> _searchStreets() async {
    final token = ++_searchToken;
    final q = _streetQuery.trim();
    if (q.length < _minStreetChars) {
      _streets = [];
      _addressError = null;
      _searching = false;
      notifyListeners();
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (token != _searchToken) return;
    _searching = true;
    notifyListeners();
    try {
      final found = await _state.api.searchStreets(_district, q);
      if (token != _searchToken) return;
      _streets = found.take(_maxRows).toList();
      _addressError = null;
    } on OutageApiException catch (e) {
      if (token != _searchToken) return;
      _streets = [];
      _addressError = e.message;
    }
    _searching = false;
    notifyListeners();
  }

  Future<void> pickStreet(String street) async {
    try {
      _houses = await _state.api.fetchHouses(_district, street);
      _street = street;
      _streets = [];
      _addressError = null;
      _houseQuery = '';
    } on OutageApiException catch (e) {
      _addressError = e.message;
    }
    notifyListeners();
  }

  bool pickWholeStreet() => allSameGroup && pickHouse(_houses.first);

  void pickGroup(OutageGroup group) => _state.add(group, nickname);

  bool pickHouse(AddressHit hit) {
    final group =
        _state.groups.where((g) => g.id == hit.groupId).firstOrNull ??
        _state.groups.where((g) => g.number == hit.groupNumber).firstOrNull;
    if (group == null) {
      _addressError = 'Групи ${hit.groupNumber} поки немає.';
      notifyListeners();
      return false;
    }
    _state.add(group, nickname, _formatAddress(hit));
    return true;
  }

  String _formatAddress(AddressHit hit) {
    final street = _street ?? '';
    final whole =
        allSameGroup &&
        _houseQuery.trim().isEmpty &&
        _houses.length > 1 &&
        identical(hit, _houses.first);
    return [
      if (_district != OutageApi.city) _district,
      street.toUpperCase() == street ? _capitalize(street) : street,
      if (!whole && hit.number.isNotEmpty) hit.number,
    ].join(', ');
  }

  String _capitalize(String upper) => upper
      .toLowerCase()
      .split(' ')
      .map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1))
      .join(' ');

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _searchToken++;
    _state.removeListener(notifyListeners);
    super.dispose();
  }
}
