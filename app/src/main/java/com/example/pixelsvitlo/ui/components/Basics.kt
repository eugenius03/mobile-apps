package com.example.pixelsvitlo.ui.components

import androidx.compose.runtime.getValue
import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.pixelsvitlo.ui.theme.Pixel

@Composable
fun Txt(
    text: String,
    modifier: Modifier = Modifier,
    size: Int = 15,
    bold: Boolean = false,
    color: Color = Pixel.Ink,
    mono: Boolean = false,
    maxLines: Int = Int.MAX_VALUE,
    align: TextAlign? = null,
) {
    BasicText(
        text = text,
        modifier = modifier,
        style = TextStyle(
            color = color,
            fontSize = size.sp,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
            fontFamily = if (mono) FontFamily.Monospace else FontFamily.Default,
            textAlign = align ?: TextAlign.Unspecified,
        ),
        maxLines = maxLines,
        overflow = if (maxLines == 1) TextOverflow.Ellipsis else TextOverflow.Clip,
    )
}

@Composable
fun SectionLabel(text: String) = Txt(text, size = 17, bold = true)

@Composable
fun MutedLabel(text: String, modifier: Modifier = Modifier, size: Int = 13, align: TextAlign? = null) =
    Txt(text, modifier, size = size, color = Pixel.Muted, align = align)

@Composable
fun PixelIcon(@DrawableRes id: Int, modifier: Modifier = Modifier, size: Dp = 24.dp, tint: Color = Color.Black) {
    Image(painterResource(id), null, modifier.size(size), colorFilter = ColorFilter.tint(tint))
}

@Composable
fun FlatCard(
    modifier: Modifier = Modifier,
    background: Color = Color.White,
    padding: PaddingValues = PaddingValues(12.dp),
    content: @Composable BoxScope.() -> Unit,
) {
    Box(modifier.background(background).border(Pixel.Border, Color.Black).padding(padding), content = content)
}

fun Modifier.hardShadow(offset: Dp = 4.dp): Modifier = drawBehind {
    val s = offset.toPx()
    drawRect(Color.Black, topLeft = Offset(s, s), size = size)
}

@Composable
fun PixelCard(
    modifier: Modifier = Modifier,
    background: Color = Color.White,
    padding: PaddingValues = PaddingValues(12.dp),
    content: @Composable BoxScope.() -> Unit,
) {
    Box(modifier.hardShadow().background(background).border(Pixel.Border, Color.Black).padding(padding), content = content)
}

@Composable
fun PressBox(
    modifier: Modifier = Modifier,
    pressedScale: Float = 0.97f,
    enabled: Boolean = true,
    onClick: () -> Unit,
    content: @Composable () -> Unit,
) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val s by animateFloatAsState(if (pressed) pressedScale else 1f, tween(80), label = "press")
    Box(
        modifier.scale(s).clickable(source, indication = null, enabled = enabled, onClick = onClick),
    ) { content() }
}
