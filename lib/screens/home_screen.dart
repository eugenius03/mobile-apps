import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../present.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/bevel_button.dart';
import '../widgets/group_card.dart';
import '../widgets/group_row.dart';
import '../widgets/offline_banner.dart';
import '../widgets/pixel_header.dart';
import '../widgets/press_scale.dart';
import 'detail_screen.dart';
import 'pick_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    Future<void>.microtask(state.ensureInit);
  }

  void _add() => Navigator.push(
    context,
    MaterialPageRoute<void>(builder: (_) => const PickScreen()),
  );

  void _open(int id) => Navigator.push(
    context,
    MaterialPageRoute<void>(builder: (_) => DetailScreen(id: id)),
  );

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final asOn = state.possibleAsOn;
    final main = state.main;
    return Scaffold(
      body: Column(
        children: [
          PixelHeader(
            child: Row(
              children: [
                const Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(left: 10),
                    child: HeaderTitle(
                      'Svitlo',
                      subtitle: 'Графік відключень у Чернівцях',
                    ),
                  ),
                ),
                if (state.tracked.isNotEmpty)
                  HeaderIconButton(icon: 'plus_w', onTap: _add),
                HeaderIconButton(
                  icon: 'sliders_horizontal_w',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => const SettingsScreen(),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: main == null
                ? _empty()
                : RefreshIndicator(
                    color: Pixel.accent,
                    onRefresh: state.refreshAll,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                      children: [
                        if (state.offline) ...[
                          OfflineBanner(state.staleSince),
                          const SizedBox(height: 28),
                        ],
                        PressScale(
                          onTap: () => _open(main.id),
                          child: GroupCard(
                            cardItem(
                              main,
                              state.data(main.id),
                              asOn,
                              futureOnly: true,
                            ),
                          ),
                        ),
                        if (state.others.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Text('Інші групи', style: label(17, bold: true)),
                          for (final g in state.others) ...[
                            const SizedBox(height: 10),
                            GroupRow(
                              rowItem(g, state.data(g.id), asOn),
                              onTap: () => _open(g.id),
                            ),
                          ],
                        ],
                        const SizedBox(height: 28),
                        Center(
                          child: BevelButton(
                            text: 'Додати групу',
                            icon: 'plus_w',
                            compact: true,
                            onTap: _add,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _empty() => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'До якої групи ви належите?',
            textAlign: TextAlign.center,
            style: label(24, bold: true),
          ),
          const SizedBox(height: 8),
          Text(
            'Додайте її, щоб бачити, коли є світло, а коли його вимкнуть.',
            textAlign: TextAlign.center,
            style: label(13, color: Pixel.muted),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: 190,
            height: 190,
            child: BevelButton(icon: 'plus_w', iconSize: 96, onTap: _add),
          ),
        ],
      ),
    ),
  );
}
