import 'package:flutter/material.dart';

import '../present.dart';
import '../theme.dart';
import 'pixel_card.dart';
import 'pixel_icon.dart';
import 'timeline.dart';

class GroupNameLine extends StatelessWidget {
  const GroupNameLine({
    super.key,
    required this.name,
    required this.subName,
    required this.address,
    required this.nameSize,
    required this.addressSize,
  });

  final String name;
  final String subName;
  final String address;
  final double nameSize;
  final double addressSize;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.baseline,
    textBaseline: TextBaseline.alphabetic,
    children: [
      Text(name, style: label(nameSize, bold: true)),
      if (subName.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(left: 8),
          child: Text(subName, style: label(13, color: Pixel.muted)),
        ),
      if (address.isNotEmpty)
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: 10),
            child: Text(
              '· $address',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: label(addressSize, color: Pixel.muted),
            ),
          ),
        ),
    ],
  );
}

class GroupCard extends StatelessWidget {
  const GroupCard(this.item, {this.showAddress = true, super.key});

  final CardItem item;
  final bool showAddress;

  @override
  Widget build(BuildContext context) {
    final g = item.group;
    return Padding(
      padding: const EdgeInsets.only(right: 4, bottom: 4),
      child: PixelCard(
        color: item.color,
        padding: const EdgeInsets.all(18),
        shadow: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GroupNameLine(
              name: g.name,
              subName: g.subName,
              address: showAddress ? g.address : '',
              nameSize: 20,
              addressSize: 14,
            ),
            const SizedBox(height: 14),
            if (item.ready) _ready() else _message(),
          ],
        ),
      ),
    );
  }

  Widget _message() => Row(
    children: [
      if (item.loading) ...[
        const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Colors.black,
          ),
        ),
        const SizedBox(width: 10),
      ],
      Flexible(child: Text(item.message, style: label(15))),
    ],
  );

  Widget _ready() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          PixelCard(
            color: item.tile,
            padding: EdgeInsets.zero,
            child: SizedBox(
              width: 66,
              height: 66,
              child: Center(child: PixelIcon(item.icon, size: 48)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(child: Text(item.label, style: label(30, bold: true))),
        ],
      ),
      const SizedBox(height: 14),
      Text(item.until, style: label(15, bold: true)),
      if (item.next.isNotEmpty) ...[
        const SizedBox(height: 4),
        Text(item.next, style: label(14)),
      ],
      const SizedBox(height: 14),
      Text(item.dayTitle, style: label(17, bold: true)),
      const SizedBox(height: 8),
      PixelCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            TimelineBar(item.timeline!),
            const SizedBox(height: 2),
            AxisBar(item.axis!),
            const SizedBox(height: 2),
          ],
        ),
      ),
    ],
  );
}
