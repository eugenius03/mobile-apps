package com.example.pixelsvitlo.ui.components

import androidx.compose.runtime.getValue
import androidx.activity.compose.BackHandler
import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.pixelsvitlo.ui.theme.Pixel

private fun Modifier.bevel(base: Color, pressed: Boolean): Modifier = drawBehind {
    val outline = 3.dp.toPx()
    val light = 3.dp.toPx()
    val dark = 4.dp.toPx()
    val w = size.width - 2 * outline
    val h = size.height - 2 * outline
    val hi = lerp(base, Color.White, 0.4f)
    val sh = lerp(base, Color.Black, 0.35f)
    val top = if (pressed) sh else hi
    val bottom = if (pressed) hi else sh

    drawRect(Color.Black)
    drawRect(base, Offset(outline, outline), Size(w, h))
    drawRect(top, Offset(outline, outline), Size(w, light))
    drawRect(top, Offset(outline, outline), Size(light, h))
    drawRect(bottom, Offset(outline, outline + h - dark), Size(w, dark))
    drawRect(bottom, Offset(outline + w - dark, outline), Size(dark, h))
}

@Composable
fun BevelButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    text: String = "",
    @DrawableRes icon: Int = 0,
    iconSize: Int = 24,
    base: Color = Pixel.Accent,
    textColor: Color = Color.White,
    enabled: Boolean = true,
) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.97f else 1f, tween(80), label = "bevel")
    Box(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .scale(scale)
            .bevel(base, pressed)
            .clickable(source, indication = null, enabled = enabled, onClick = onClick)
            .padding(18.dp, 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            if (icon != 0) PixelIcon(icon, size = iconSize.dp, tint = textColor)
            if (text.isNotEmpty()) Txt(text, size = 16, bold = true, color = textColor, align = TextAlign.Center)
        }
    }
}

@Composable
fun HeaderIconButton(@DrawableRes icon: Int, onClick: () -> Unit, modifier: Modifier = Modifier, alpha: Float = 1f) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.85f else 1f, tween(80), label = "headerIcon")
    Box(
        modifier
            .height(44.dp)
            .defaultMinSize(minWidth = 44.dp)
            .scale(scale)
            .clickable(source, indication = null, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        PixelIcon(icon, Modifier.alpha(alpha), tint = Color.White)
    }
}

@Composable
fun Header(background: Color = Pixel.Accent, content: @Composable RowScope.() -> Unit) {
    Column {
        Row(
            Modifier.fillMaxWidth().background(background).statusBarsPadding().padding(6.dp, 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
        Box(Modifier.fillMaxWidth().height(Pixel.Border).background(Color.Black))
    }
}

@Composable
fun HeaderTitle(title: String, subtitle: String?, modifier: Modifier = Modifier) {
    Column(modifier) {
        Txt(title, size = 24, bold = true, color = Color.White)
        if (!subtitle.isNullOrEmpty()) Txt(subtitle, size = 13, color = Pixel.OnAccentMuted)
    }
}

@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmText: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    BackHandler(onBack = onDismiss)
    Box(
        Modifier.fillMaxSize().background(Pixel.Scrim).clickable(remember { MutableInteractionSource() }, null, onClick = onDismiss),
        contentAlignment = Alignment.Center,
    ) {
        PixelCard(
            Modifier.padding(24.dp).clickable(remember { MutableInteractionSource() }, null) {},
            padding = PaddingValues(18.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Txt(title, size = 20, bold = true)
                Txt(message, size = 16)
                Row(Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    BevelButton(onDismiss, Modifier.weight(1f), "Скасувати", base = Pixel.Neutral, textColor = Color.Black)
                    BevelButton(onConfirm, Modifier.weight(1f), confirmText, base = Pixel.Off, textColor = Color.Black)
                }
            }
        }
    }
}

private val InputStyle = TextStyle(color = Pixel.Ink, fontSize = 16.sp)

@Composable
private fun InputFrame(
    empty: Boolean,
    placeholder: String,
    modifier: Modifier,
    trailing: (@Composable () -> Unit)?,
    field: @Composable () -> Unit,
) {
    FlatCard(modifier.fillMaxWidth(), padding = PaddingValues(12.dp, 2.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Box(Modifier.weight(1f).defaultMinSize(minHeight = 44.dp), contentAlignment = Alignment.CenterStart) {
                if (empty) Txt(placeholder, size = 16, color = Pixel.Muted, maxLines = 1)
                field()
            }
            trailing?.invoke()
        }
    }
}

@Composable
fun PixelInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    maxLength: Int = Int.MAX_VALUE,
) {
    InputFrame(value.isEmpty(), placeholder, modifier, null) {
        BasicTextField(
            value,
            { onValueChange(it.take(maxLength)) },
            Modifier.fillMaxWidth(),
            singleLine = true,
            textStyle = InputStyle,
            cursorBrush = SolidColor(Pixel.Ink),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
        )
    }
}

@Composable
fun PixelInput(
    value: TextFieldValue,
    onValueChange: (TextFieldValue) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    fieldModifier: Modifier = Modifier,
    trailing: (@Composable () -> Unit)? = null,
    onDone: () -> Unit = {},
) {
    InputFrame(value.text.isEmpty(), placeholder, modifier, trailing) {
        BasicTextField(
            value,
            onValueChange,
            fieldModifier.fillMaxWidth(),
            singleLine = true,
            textStyle = InputStyle,
            cursorBrush = SolidColor(Pixel.Ink),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { onDone() }),
        )
    }
}
