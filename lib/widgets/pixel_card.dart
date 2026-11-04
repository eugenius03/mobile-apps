import 'package:flutter/material.dart';

import '../theme.dart';

class PixelCard extends StatelessWidget {
  const PixelCard({
    super.key,
    required this.child,
    this.color = Colors.white,
    this.padding = const EdgeInsets.all(12),
    this.shadow = false,
  });

  final Widget child;
  final Color color;
  final EdgeInsetsGeometry padding;
  final bool shadow;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(
      color: color,
      border: Border.all(color: Pixel.border, width: Pixel.borderWidth),
      boxShadow: shadow ? const [Pixel.shadow] : null,
    ),
    child: child,
  );
}
