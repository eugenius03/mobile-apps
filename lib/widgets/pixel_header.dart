import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme.dart';
import 'pixel_icon.dart';
import 'press_scale.dart';

class PixelHeader extends StatelessWidget {
  const PixelHeader({
    super.key,
    required this.child,
    this.color = Pixel.accent,
  });

  final Widget child;
  final Color color;

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
    value: SystemUiOverlayStyle.light,
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          color: color,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(6, 8, 6, 8),
              child: child,
            ),
          ),
        ),
        Container(height: Pixel.borderWidth, color: Pixel.border),
      ],
    ),
  );
}

class HeaderIconButton extends StatelessWidget {
  const HeaderIconButton({super.key, required this.icon, required this.onTap});

  final String icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => PressScale(
    scale: 0.85,
    onTap: onTap,
    child: SizedBox(
      width: 44,
      height: 44,
      child: Center(child: PixelIcon(icon)),
    ),
  );
}

class HeaderTitle extends StatelessWidget {
  const HeaderTitle(this.title, {super.key, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(title, style: label(24, bold: true, color: Colors.white)),
      if (subtitle != null && subtitle!.isNotEmpty)
        Text(subtitle!, style: label(13, color: Pixel.onAccentMuted)),
    ],
  );
}
