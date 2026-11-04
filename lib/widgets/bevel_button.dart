import 'package:flutter/material.dart';

import '../theme.dart';
import 'pixel_icon.dart';
import 'press_scale.dart';

class BevelButton extends StatefulWidget {
  const BevelButton({
    super.key,
    this.text = '',
    this.icon,
    this.iconSize = 24,
    this.color = Pixel.accent,
    this.textColor = Colors.white,
    this.compact = false,
    this.onTap,
  });

  final String text;
  final String? icon;
  final double iconSize;
  final Color color;
  final Color textColor;
  final bool compact;
  final VoidCallback? onTap;

  @override
  State<BevelButton> createState() => _BevelButtonState();
}

class _BevelButtonState extends State<BevelButton> {
  bool _pressed = false;

  void _set(bool pressed) {
    if (widget.onTap != null) setState(() => _pressed = pressed);
  }

  @override
  Widget build(BuildContext context) {
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.icon != null) PixelIcon(widget.icon!, size: widget.iconSize),
        if (widget.icon != null && widget.text.isNotEmpty)
          const SizedBox(width: 10),
        if (widget.text.isNotEmpty)
          Flexible(
            child: Text(
              widget.text,
              textAlign: TextAlign.center,
              style: label(16, bold: true, color: widget.textColor),
            ),
          ),
      ],
    );
    return Opacity(
      opacity: widget.onTap != null ? 1 : 0.5,
      child: Listener(
        onPointerDown: (_) => _set(true),
        onPointerUp: (_) => _set(false),
        onPointerCancel: (_) => _set(false),
        child: PressScale(
          onTap: widget.onTap,
          child: CustomPaint(
            painter: _BevelPainter(widget.color, _pressed),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              child: widget.compact ? content : Center(child: content),
            ),
          ),
        ),
      ),
    );
  }
}

class _BevelPainter extends CustomPainter {
  const _BevelPainter(this.base, this.pressed);

  final Color base;
  final bool pressed;

  static const _outline = 3.0, _light = 3.0, _dark = 4.0;

  @override
  void paint(Canvas canvas, Size size) {
    void fill(double x, double y, double w, double h, Color c) =>
        canvas.drawRect(Rect.fromLTWH(x, y, w, h), Paint()..color = c);

    fill(0, 0, size.width, size.height, Colors.black);
    const x = _outline, y = _outline;
    final w = size.width - 2 * _outline;
    final h = size.height - 2 * _outline;
    final hi = Color.lerp(base, Colors.white, 0.4)!;
    final sh = Color.lerp(base, Colors.black, 0.35)!;
    final top = pressed ? sh : hi;
    final bottom = pressed ? hi : sh;

    fill(x, y, w, h, base);
    fill(x, y, w, _light, top);
    fill(x, y, _light, h, top);
    fill(x, y + h - _dark, w, _dark, bottom);
    fill(x + w - _dark, y, _dark, h, bottom);
  }

  @override
  bool shouldRepaint(_BevelPainter old) =>
      old.base != base || old.pressed != pressed;
}
