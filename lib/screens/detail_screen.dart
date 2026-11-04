import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../present.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/bevel_button.dart';
import '../widgets/dialogs.dart';
import '../widgets/group_card.dart';
import '../widgets/offline_banner.dart';
import '../widgets/pixel_card.dart';
import '../widgets/pixel_header.dart';
import '../widgets/pixel_icon.dart';

class DetailScreen extends StatefulWidget {
  const DetailScreen({super.key, required this.id});

  final int id;

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  final _name = TextEditingController();
  final _focus = FocusNode();
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      if (!_focus.hasFocus) _save();
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _edit(String current) {
    _name.value = TextEditingValue(
      text: current,
      selection: TextSelection(baseOffset: 0, extentOffset: current.length),
    );
    setState(() => _editing = true);
    _focus.requestFocus();
  }

  void _save() {
    if (!_editing) return;
    final state = context.read<AppState>();
    final group = state.find(widget.id);
    setState(() => _editing = false);
    if (group == null) return;
    final text = _name.text.trim();
    state.rename(widget.id, text == group.defaultName ? '' : text);
  }

  Future<void> _remove(AppState state, String name) async {
    if (!await confirmDialog(
      context,
      'Видалити групу',
      'Перестати відстежувати «$name»?',
      'Видалити',
    )) {
      return;
    }
    if (!mounted) return;
    state.remove(widget.id);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final group = state.find(widget.id);
    final isMain = state.mainId == widget.id;
    final data = state.data(widget.id);
    return Scaffold(
      body: Column(
        children: [
          PixelHeader(
            color: _editing ? Pixel.accentDark : Pixel.accent,
            child: Row(
              children: [
                HeaderIconButton(
                  icon: 'arrow_left_w',
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: _title(
                    group?.name ?? '',
                    group == null ? '' : _subtitle(group.subName, isMain),
                  ),
                ),
                HeaderIconButton(
                  icon: 'reload_w',
                  onTap: () => state.refreshGroup(widget.id),
                ),
              ],
            ),
          ),
          if (group != null) Expanded(child: _body(state, data, isMain)),
        ],
      ),
    );
  }

  String _subtitle(String subName, bool isMain) =>
      (isMain ? 'Головна група' : 'Відстежувана група') +
      (subName.isEmpty ? '' : ' · $subName');

  Widget _title(String name, String subtitle) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (_editing)
        TextField(
          controller: _name,
          focusNode: _focus,
          maxLength: 20,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _save(),
          cursorColor: Colors.white,
          style: label(24, bold: true, color: Colors.white),
          decoration: const InputDecoration(
            isCollapsed: true,
            counterText: '',
            border: InputBorder.none,
            contentPadding: EdgeInsets.zero,
          ),
        )
      else
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onDoubleTap: () => _edit(name),
          child: Row(
            children: [
              Flexible(
                child: Text(
                  name,
                  style: label(24, bold: true, color: Colors.white),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => _edit(name),
                child: const Opacity(
                  opacity: 0.7,
                  child: PixelIcon('pencil_w'),
                ),
              ),
            ],
          ),
        ),
      Text(subtitle, style: label(13, color: Pixel.onAccentMuted)),
    ],
  );

  Widget _body(AppState state, GroupData data, bool isMain) {
    final group = state.find(widget.id)!;
    final asOn = state.possibleAsOn;
    final schedule = data.schedule;
    final fetched = data.fetchedAt;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        if (data.stale) ...[OfflineBanner(fetched), const SizedBox(height: 24)],
        GroupCard(cardItem(group, data, asOn), showAddress: false),
        if (group.address.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text('Адреса', style: label(17, bold: true)),
          const SizedBox(height: 8),
          PixelCard(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: SizedBox(
              width: double.infinity,
              child: Text(group.address, style: label(16)),
            ),
          ),
        ],
        if (schedule != null && !schedule.isEmpty)
          for (final day in dayItems(schedule, asOn)) ...[
            const SizedBox(height: 24),
            Text(day.title, style: label(17, bold: true)),
            for (final run in day.runs) ...[
              const SizedBox(height: 8),
              PixelCard(
                color: run.color,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    PixelIcon(run.icon),
                    const SizedBox(width: 10),
                    Expanded(child: Text(run.range, style: mono(15))),
                    Text(run.length, style: label(14)),
                  ],
                ),
              ),
            ],
          ],
        const SizedBox(height: 24),
        if (!isMain) ...[
          BevelButton(
            text: 'Зробити головною',
            icon: 'star_w',
            onTap: () => state.setMain(widget.id),
          ),
          const SizedBox(height: 14),
        ],
        BevelButton(
          text: 'Видалити групу',
          icon: 'trash',
          color: Pixel.danger,
          textColor: Colors.black,
          onTap: () => _remove(state, group.name),
        ),
        if (fetched != null) ...[
          const SizedBox(height: 24),
          Text(
            'Оновлено ${fmtClock(fetched)}',
            textAlign: TextAlign.center,
            style: label(12, color: Pixel.muted),
          ),
        ],
      ],
    );
  }
}
