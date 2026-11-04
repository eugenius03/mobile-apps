import 'outage.dart';

class TrackedGroup {
  const TrackedGroup({
    required this.id,
    required this.number,
    this.nickname = '',
    this.address = '',
  });

  final int id;
  final int number;
  final String nickname;
  final String address;

  String get defaultName => 'Група $number';

  String get name => nickname.trim().isEmpty ? defaultName : nickname.trim();

  String get subName => nickname.trim().isEmpty ? '' : defaultName;

  OutageGroup get group => OutageGroup(id: id, number: number);

  TrackedGroup copyWith({String? nickname, String? address}) => TrackedGroup(
    id: id,
    number: number,
    nickname: nickname ?? this.nickname,
    address: address ?? this.address,
  );

  factory TrackedGroup.fromJson(Map<String, dynamic> json) => TrackedGroup(
    id: json['id'] as int,
    number: json['number'] as int,
    nickname: json['nickname'] as String? ?? '',
    address: json['address'] as String? ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'number': number,
    'nickname': nickname,
    'address': address,
  };
}
