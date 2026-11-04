import 'package:flutter/material.dart';

import '../present.dart';
import '../theme.dart';
import 'pixel_card.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner(this.fetched, {super.key});

  final DateTime? fetched;

  @override
  Widget build(BuildContext context) => PixelCard(
    color: Pixel.possible,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    child: Text(
      fetched == null
          ? 'Офлайн. Показано збережений графік.'
          : 'Офлайн. Показано збережений графік від ${fmtDate(fetched!)} ${fmtClock(fetched!)}.',
      style: label(13),
    ),
  );
}
