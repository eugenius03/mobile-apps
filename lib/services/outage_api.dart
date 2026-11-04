import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/outage.dart';

class OutageApiException implements Exception {
  const OutageApiException(this.message);

  final String message;
}

class OutageApi {
  OutageApi({http.Client? client}) : _client = client ?? http.Client();

  static const city = 'Чернівці';
  static const _host = 'e-svitlo-api.intercode.win';
  static const _timeout = Duration(seconds: 10);
  static const _unexpected = OutageApiException(
    'Неочікувана відповідь сервера eSvitlo.',
  );

  final http.Client _client;

  Future<List<OutageGroup>> fetchGroups() async {
    final body = await _get('/shutdowns/groups', const {});
    return _decode(body, (json) {
      final groups = [
        for (final e in (json as List).cast<Map<String, dynamic>>())
          OutageGroup(id: e['id'] as int, number: e['groupNumber'] as int),
      ];
      return groups..sort((a, b) => a.number.compareTo(b.number));
    });
  }

  Future<List<String>> fetchDistricts() async => [
    city,
    ..._strings(await _get('/shutdowns/group-search/districts', const {})),
  ];

  Future<List<String>> searchStreets(String district, String text) async =>
      _strings(
        await _get('/shutdowns/group-search', _address(district, text, null)),
      );

  Future<List<AddressHit>> fetchHouses(String district, String street) async {
    final body = await _get(
      '/shutdowns/group-search',
      _address(district, street, ''),
    );
    return _decode(
      body,
      (json) => [
        for (final e in (json as List).cast<Map<String, dynamic>>())
          AddressHit(
            number: e['addressNumber'] as String? ?? '',
            groupNumber: e['groupNumber'] as int,
            groupId: e['groupId'] as int,
          ),
      ],
    );
  }

  Future<String> fetchScheduleRaw(OutageGroup group) =>
      _get('/shutdowns/schedule', {'groupIds': '${group.id}'});

  Map<String, String> _address(
    String district,
    String street,
    String? number,
  ) => {
    'district': district,
    'addressSearch': street,
    'addressNumber': ?number,
    'city': '',
  };

  List<String> _strings(String body) => _decode(
    body,
    (json) => [
      for (final e in json as List)
        if (e is String && e.isNotEmpty) e,
    ],
  );

  T _decode<T>(String body, T Function(dynamic json) read) {
    try {
      return read(jsonDecode(body));
    } on FormatException {
      throw _unexpected;
    } on TypeError {
      throw _unexpected;
    }
  }

  Future<String> _get(String path, Map<String, String> query) async {
    final uri = Uri.https(_host, path, query.isEmpty ? null : query);
    final http.Response res;
    try {
      res = await _client.get(uri).timeout(_timeout);
    } catch (_) {
      throw const OutageApiException("Немає зв'язку із сервером eSvitlo.");
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw OutageApiException('Помилка сервера (HTTP ${res.statusCode}).');
    }
    return utf8.decode(res.bodyBytes);
  }
}
