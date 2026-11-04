import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class Pixel {
  static const bg = Color(0xFFF1F4F8);
  static const accent = Color(0xFF0E7490);
  static const accentDark = Color(0xFF164E63);
  static const onAccentMuted = Color(0xFFCFFAFE);
  static const ink = Color(0xFF0F172A);
  static const muted = Color(0xFF475569);
  static const on = Color(0xFF86EFAC);
  static const off = Color(0xFFFCA5A5);
  static const possible = Color(0xFFFDE68A);
  static const danger = Color(0xFFFEE2E2);
  static const dangerText = Color(0xFFB91C1C);
  static const neutral = Color(0xFFE2E8F0);
  static const border = Color(0xFF000000);
  static const borderWidth = 3.0;
  static const shadow = BoxShadow(color: Colors.black, offset: Offset(4, 4));
}

TextStyle label(double size, {bool bold = false, Color color = Pixel.ink}) =>
    TextStyle(
      fontSize: size,
      fontWeight: bold ? FontWeight.bold : FontWeight.normal,
      color: color,
      height: 1.25,
    );

TextStyle mono(double size, {Color color = Pixel.ink}) => TextStyle(
  fontSize: size,
  fontWeight: FontWeight.bold,
  color: color,
  fontFamily: defaultTargetPlatform == TargetPlatform.android
      ? 'monospace'
      : 'Courier New',
  height: 1.25,
);

ThemeData buildTheme() => ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: Pixel.accent, surface: Pixel.bg),
  scaffoldBackgroundColor: Pixel.bg,
  splashFactory: NoSplash.splashFactory,
  highlightColor: Colors.transparent,
  textSelectionTheme: const TextSelectionThemeData(cursorColor: Pixel.accent),
);
