import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/outage.dart';
import '../state/app_state.dart';
import '../state/pick_controller.dart';
import '../theme.dart';
import '../widgets/bevel_button.dart';
import '../widgets/pixel_card.dart';
import '../widgets/pixel_header.dart';
import '../widgets/pixel_icon.dart';
import '../widgets/press_scale.dart';

class PickScreen extends StatefulWidget {
  const PickScreen({super.key});

  @override
  State<PickScreen> createState() => _PickScreenState();
}

class _PickScreenState extends State<PickScreen> {
  late final PickController _ctl = PickController(context.read<AppState>());
  late final _district = TextEditingController(text: _ctl.districtText);
  final _districtFocus = FocusNode();
  final _street = TextEditingController();
  final _house = TextEditingController();

  @override
  void initState() {
    super.initState();
    _ctl.addListener(_syncTexts);
    _districtFocus.addListener(_onDistrictFocus);
    _ctl.load();
  }

  @override
  void dispose() {
    _ctl.dispose();
    for (final c in [_district, _street, _house]) {
      c.dispose();
    }
    _districtFocus.dispose();
    super.dispose();
  }

  void _syncTexts() {
    void sync(TextEditingController c, String text) {
      if (c.text != text) {
        c.value = TextEditingValue(
          text: text,
          selection: TextSelection.collapsed(offset: text.length),
        );
      }
    }

    sync(_district, _ctl.districtText);
    sync(_street, _ctl.streetQuery);
    sync(_house, _ctl.houseQuery);
  }

  void _onDistrictFocus() {
    if (_districtFocus.hasFocus) {
      _ctl.openDistricts();
      _district.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _district.text.length,
      );
    } else {
      Future<void>.delayed(const Duration(milliseconds: 250), () {
        if (mounted) _ctl.commitDistrict();
      });
    }
  }

  void _chooseDistrict(String district) {
    _districtFocus.unfocus();
    _ctl.pickDistrict(district);
  }

  void _done(bool added) {
    if (added && mounted) Navigator.pop(context);
  }

  void _pickGroup(OutageGroup group) {
    _ctl.pickGroup(group);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: _ctl,
    builder: (context, _) => Scaffold(
      body: Column(
        children: [
          PixelHeader(
            child: Row(
              children: [
                HeaderIconButton(
                  icon: 'arrow_left_w',
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(width: 6),
                Expanded(child: HeaderTitle(_ctl.title, subtitle: _ctl.hint)),
              ],
            ),
          ),
          Expanded(child: _body()),
        ],
      ),
    ),
  );

  Widget _body() {
    if (_ctl.showLoading) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.black),
            const SizedBox(height: 12),
            Text('Завантаження груп…', style: label(15)),
          ],
        ),
      );
    }
    if (_ctl.showError) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_ctl.error, textAlign: TextAlign.center, style: label(15)),
              const SizedBox(height: 16),
              BevelButton(
                text: 'Спробувати ще',
                compact: true,
                onTap: _ctl.retry,
              ),
            ],
          ),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      children: [
        Text('Назва', style: label(17, bold: true)),
        const SizedBox(height: 8),
        _field(
          hint: "Необов'язково, напр. Робота або Дім",
          maxLength: 20,
          onChanged: (v) => _ctl.nickname = v,
        ),
        const SizedBox(height: 24),
        Text('Знайти за адресою', style: label(17, bold: true)),
        const SizedBox(height: 10),
        ..._address(),
        const SizedBox(height: 24),
        Text('Або оберіть номер групи', style: label(17, bold: true)),
        const SizedBox(height: 10),
        _groupGrid(),
      ],
    );
  }

  Widget _field({
    required String hint,
    required ValueChanged<String> onChanged,
    TextEditingController? controller,
    FocusNode? focus,
    int? maxLength,
    Widget? trailing,
  }) => PixelCard(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: Row(
      children: [
        Expanded(
          child: TextField(
            controller: controller,
            focusNode: focus,
            maxLength: maxLength,
            onChanged: onChanged,
            style: label(16),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: label(16, color: Pixel.muted),
              counterText: '',
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        ?trailing,
      ],
    ),
  );

  Widget _choice(Widget child, VoidCallback onTap) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: PressScale(
      onTap: onTap,
      child: PixelCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: SizedBox(width: double.infinity, child: child),
      ),
    ),
  );

  List<Widget> _address() => [
    _field(
      controller: _district,
      focus: _districtFocus,
      hint: 'Район або місто',
      onChanged: _ctl.setDistrictText,
      trailing: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _ctl.toggleDistricts,
        child: const RotatedBox(
          quarterTurns: 1,
          child: PixelIcon('chevron_right'),
        ),
      ),
    ),
    const SizedBox(height: 10),
    for (final d in _ctl.districtSuggestions)
      _choice(Text(d, style: label(16)), () => _chooseDistrict(d)),
    if (_ctl.showNoDistricts)
      Text('Такого району немає.', style: label(13, color: Pixel.muted)),
    if (_ctl.street == null) ..._streetSearch() else ..._houseSearch(),
    if (_ctl.addressError != null)
      Text(_ctl.addressError!, style: label(15, color: Pixel.dangerText)),
  ];

  List<Widget> _streetSearch() => [
    _field(
      controller: _street,
      hint: 'Вулиця, напр. Універс',
      onChanged: _ctl.setStreetQuery,
    ),
    const SizedBox(height: 10),
    for (final s in _ctl.streets)
      _choice(Text(s, style: label(16)), () => _ctl.pickStreet(s)),
    if (_ctl.showNoStreets)
      Text('Вулиць не знайдено.', style: label(13, color: Pixel.muted)),
  ];

  List<Widget> _houseSearch() => [
    PressScale(
      onTap: _ctl.clearStreet,
      child: PixelCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Expanded(child: Text(_ctl.street!, style: label(16, bold: true))),
            const SizedBox(width: 10),
            const PixelIcon('pencil'),
          ],
        ),
      ),
    ),
    const SizedBox(height: 10),
    if (_ctl.allSameGroup) ...[
      BevelButton(
        text: _ctl.wholeStreetText,
        onTap: () => _done(_ctl.pickWholeStreet()),
      ),
      const SizedBox(height: 10),
    ],
    _field(
      controller: _house,
      hint: 'Номер будинку',
      maxLength: 12,
      onChanged: _ctl.setHouseQuery,
    ),
    const SizedBox(height: 10),
    if (_ctl.houseHint.isNotEmpty) ...[
      Text(_ctl.houseHint, style: label(13, color: Pixel.muted)),
      const SizedBox(height: 10),
    ],
    for (final h in _ctl.houses)
      _choice(
        Row(
          children: [
            Expanded(
              child: Text(
                h.number.isEmpty ? 'Без номера' : h.number,
                style: mono(15),
              ),
            ),
            Text('Група ${h.groupNumber}', style: label(15, bold: true)),
          ],
        ),
        () => _done(_ctl.pickHouse(h)),
      ),
  ];

  Widget _groupGrid() => LayoutBuilder(
    builder: (context, box) {
      final gap = box.maxWidth * 0.05;
      return Wrap(
        alignment: WrapAlignment.spaceBetween,
        spacing: gap,
        runSpacing: 16,
        children: [
          for (final g in _ctl.groups)
            SizedBox(
              width: box.maxWidth * 0.3,
              height: 92,
              child: PressScale(
                onTap: () => _pickGroup(g),
                child: PixelCard(
                  color: _ctl.isTracked(g) ? Pixel.bg : Colors.white,
                  child: Center(child: Text('${g.number}', style: mono(34))),
                ),
              ),
            ),
        ],
      );
    },
  );
}
