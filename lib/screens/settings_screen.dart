import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/bevel_button.dart';
import '../widgets/dialogs.dart';
import '../widgets/pixel_header.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _clear(BuildContext context, AppState state) async {
    if (await confirmDialog(
      context,
      'Видалити всі групи',
      'Перестати відстежувати всі групи?',
      'Видалити',
    )) {
      state.clearAll();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final asOn = state.possibleAsOn;
    return Scaffold(
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
                const Expanded(child: HeaderTitle('Налаштування')),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
              children: [
                Text('Можливе світло', style: label(17, bold: true)),
                const SizedBox(height: 10),
                Text(
                  'Деякі проміжки позначені як можливі. Показувати їх окремим кольором чи вважати, що світло є.',
                  style: label(13, color: Pixel.muted),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: BevelButton(
                        text: 'Окремий колір',
                        color: asOn ? Colors.white : Pixel.accent,
                        textColor: asOn ? Colors.black : Colors.white,
                        onTap: () => state.setPossibleAsOn(false),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: BevelButton(
                        text: 'Як світло є',
                        color: asOn ? Pixel.accent : Colors.white,
                        textColor: asOn ? Colors.white : Colors.black,
                        onTap: () => state.setPossibleAsOn(true),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Text('Про дані', style: label(17, bold: true)),
                const SizedBox(height: 10),
                Text(
                  'Графіки беруться з неофіційного API eSvitlo.cv. Час київський, оновлення кожні 15 хвилин. '
                  'Без інтернету показується останній збережений графік із відповідною позначкою.',
                  style: label(13, color: Pixel.muted),
                ),
                const SizedBox(height: 28),
                BevelButton(
                  text: 'Видалити всі групи',
                  icon: 'trash',
                  color: Pixel.danger,
                  textColor: Colors.black,
                  onTap: state.tracked.isEmpty
                      ? null
                      : () => _clear(context, state),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
