import 'package:flutter/material.dart';

import '../present.dart';
import '../theme.dart';
import 'group_card.dart';
import 'pixel_card.dart';
import 'pixel_icon.dart';
import 'press_scale.dart';

class GroupRow extends StatelessWidget {
  const GroupRow(this.item, {super.key, required this.onTap});

  final RowItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final g = item.group;
    return PressScale(
      onTap: onTap,
      child: PixelCard(
        color: item.color,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            SizedBox(
              width: 24,
              child: item.icon == null ? null : PixelIcon(item.icon!),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GroupNameLine(
                    name: g.name,
                    subName: g.subName,
                    address: g.address,
                    nameSize: 17,
                    addressSize: 13,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(item.state, style: label(14, bold: true)),
                      const SizedBox(width: 6),
                      Text(item.slot, style: mono(14)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            const PixelIcon('chevron_right'),
          ],
        ),
      ),
    );
  }
}
