import 'package:flutter/material.dart';

import '../present.dart';
import '../theme.dart';

class TimelineBar extends StatelessWidget {
  const TimelineBar(this.data, {super.key});

  final TimelineData data;

  @override
  Widget build(BuildContext context) => CustomPaint(
    size: const Size.fromHeight(44),
    painter: _TimelinePainter(data),
  );
}

class _TimelinePainter extends CustomPainter {
  const _TimelinePainter(this.data);

  final TimelineData data;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width / data.cells.length;
    for (var i = 0; i < data.cells.length; i++) {
      canvas.drawRect(
        Rect.fromLTWH(i * w, 0, w + 0.5, size.height),
        Paint()..color = data.cells[i] ?? Pixel.bg,
      );
    }
    if (data.nowIndex >= 0 && data.nowIndex < data.cells.length) {
      canvas.drawRect(
        Rect.fromLTWH(data.nowIndex * w, 0, 4, size.height),
        Paint()..color = Colors.black,
      );
    }
  }

  @override
  bool shouldRepaint(_TimelinePainter old) => true;
}

class AxisBar extends StatelessWidget {
  const AxisBar(this.data, {super.key});

  final AxisData data;

  @override
  Widget build(BuildContext context) =>
      CustomPaint(size: const Size.fromHeight(22), painter: _AxisPainter(data));
}

class _AxisPainter extends CustomPainter {
  const _AxisPainter(this.data);

  final AxisData data;

  static const _pad = 6.0;
  static const _labelWidth = 48.0;

  @override
  void paint(Canvas canvas, Size size) {
    final start = data.startHour;
    final span = 24 - start;
    final inner = size.width - 2 * _pad;

    void draw(String text, double hour, TextAlign align) {
      final cx = _pad + (hour - start) / span * inner;
      final x = switch (align) {
        TextAlign.left => cx,
        TextAlign.right => cx - _labelWidth,
        _ => cx - _labelWidth / 2,
      };
      final painter = TextPainter(
        text: TextSpan(text: text, style: mono(11)),
        textAlign: align,
        textDirection: TextDirection.ltr,
      )..layout(minWidth: _labelWidth, maxWidth: _labelWidth);
      painter.paint(canvas, Offset(x, (size.height - painter.height) / 2));
    }

    final whole = start % 1 == 0;
    final hour = start.floor().toString().padLeft(2, '0');
    final startText = whole
        ? (data.stepHours == 3 ? '$hour:00' : hour)
        : '$hour:30';
    draw(startText, start, TextAlign.left);
    for (var h = data.stepHours; h < 24; h += data.stepHours) {
      if (h - start < 2 || 24 - h < 2) continue;
      draw(h.toString().padLeft(2, '0'), h.toDouble(), TextAlign.center);
    }
    draw('24', 24, TextAlign.right);
  }

  @override
  bool shouldRepaint(_AxisPainter old) => true;
}
