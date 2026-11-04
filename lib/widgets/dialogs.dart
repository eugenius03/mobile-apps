import 'package:flutter/material.dart';

import '../theme.dart';
import 'bevel_button.dart';
import 'pixel_card.dart';

Future<bool> confirmDialog(
  BuildContext context,
  String title,
  String message,
  String confirmText,
) async {
  final result = await showDialog<bool>(
    context: context,
    barrierColor: const Color(0x99000000),
    builder: (dialog) => Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(24),
      child: Padding(
        padding: const EdgeInsets.only(right: 4, bottom: 4),
        child: PixelCard(
          padding: const EdgeInsets.all(18),
          shadow: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: label(20, bold: true)),
              const SizedBox(height: 14),
              Text(message, style: label(16)),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: BevelButton(
                      text: 'Скасувати',
                      color: Pixel.neutral,
                      textColor: Colors.black,
                      onTap: () => Navigator.pop(dialog, false),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: BevelButton(
                      text: confirmText,
                      color: Pixel.off,
                      textColor: Colors.black,
                      onTap: () => Navigator.pop(dialog, true),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );
  return result ?? false;
}
