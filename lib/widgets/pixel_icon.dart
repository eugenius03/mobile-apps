import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

class PixelIcon extends StatelessWidget {
  const PixelIcon(this.name, {super.key, this.size = 24});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) =>
      SvgPicture.asset('assets/icons/$name.svg', width: size, height: size);
}
