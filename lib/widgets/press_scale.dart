import 'package:flutter/widgets.dart';

class PressScale extends StatefulWidget {
  const PressScale({
    super.key,
    required this.child,
    this.onTap,
    this.onDoubleTap,
    this.scale = 0.97,
  });

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onDoubleTap;
  final double scale;

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool _down = false;

  void _set(bool down) => setState(() => _down = down);

  @override
  Widget build(BuildContext context) => GestureDetector(
    behavior: HitTestBehavior.opaque,
    onTapDown: (_) => _set(true),
    onTapUp: (_) => _set(false),
    onTapCancel: () => _set(false),
    onTap: widget.onTap,
    onDoubleTap: widget.onDoubleTap,
    child: AnimatedScale(
      scale: _down ? widget.scale : 1,
      duration: Duration(milliseconds: _down ? 70 : 110),
      curve: _down ? Curves.easeOutCubic : Curves.easeInCubic,
      child: widget.child,
    ),
  );
}
