package com.example.pixelsvitlo.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.pixelsvitlo.ui.Axis
import com.example.pixelsvitlo.ui.MainCardItem
import com.example.pixelsvitlo.ui.Timeline
import com.example.pixelsvitlo.ui.Fmt
import com.example.pixelsvitlo.ui.theme.Pixel
import java.time.Instant

@Composable
fun TimelineView(timeline: Timeline, modifier: Modifier = Modifier) {
    Canvas(modifier.fillMaxWidth().height(44.dp)) {
        val w = size.width / timeline.cells.size
        timeline.cells.forEachIndexed { i, c ->
            drawRect(c ?: Pixel.Bg, Offset(i * w, 0f), Size(w + 0.5f, size.height))
        }
        if (timeline.nowIndex in timeline.cells.indices) {
            drawRect(Color.Black, Offset(timeline.nowIndex * w, 0f), Size(4.dp.toPx(), size.height))
        }
    }
}

private val AxisStyle = TextStyle(color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)

private enum class Anchor { Left, Center, Right }

@Composable
fun AxisView(axis: Axis, modifier: Modifier = Modifier) {
    val measurer: TextMeasurer = rememberTextMeasurer()
    Canvas(modifier.fillMaxWidth().height(22.dp)) {
        val pad = 6.dp.toPx()
        val inner = size.width - 2 * pad
        val span = 24 - axis.startHour

        fun label(text: String, hour: Double, anchor: Anchor) {
            val layout = measurer.measure(text, AxisStyle)
            val cx = pad + ((hour - axis.startHour) / span).toFloat() * inner
            val x = when (anchor) {
                Anchor.Left -> cx
                Anchor.Right -> cx - layout.size.width
                Anchor.Center -> cx - layout.size.width / 2f
            }
            drawText(layout, topLeft = Offset(x, (size.height - layout.size.height) / 2f))
        }

        val half = axis.startHour % 1 != 0.0
        val hh = "%02d".format(axis.startHour.toInt())
        label(if (half) "$hh:30" else if (axis.stepHours == 3) "$hh:00" else hh, axis.startHour, Anchor.Left)
        for (h in axis.stepHours until 24 step axis.stepHours) {
            if (h - axis.startHour < 2 || 24 - h < 2) continue
            label("%02d".format(h), h.toDouble(), Anchor.Center)
        }
        label("24", 24.0, Anchor.Right)
    }
}

@Composable
fun TitleRow(title: String, subTitle: String, address: String, titleSize: Int, addressSize: Int) {
    Row(verticalAlignment = Alignment.Bottom) {
        Txt(title, size = titleSize, bold = true)
        if (subTitle.isNotEmpty()) MutedLabel(subTitle, Modifier.padding(start = 8.dp, bottom = 1.dp))
        if (address.isNotEmpty()) {
            Txt(
                "· $address",
                Modifier.weight(1f).padding(start = 10.dp, bottom = 1.dp),
                size = addressSize,
                color = Pixel.Muted,
                maxLines = 1,
            )
        }
    }
}

@Composable
fun GroupCard(item: MainCardItem, modifier: Modifier = Modifier, showAddress: Boolean = true) {
    PixelCard(modifier.padding(end = 4.dp, bottom = 4.dp).fillMaxWidth(), item.color, PaddingValues(18.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            TitleRow(item.title, item.subTitle, if (showAddress) item.address else "", titleSize = 20, addressSize = 14)

            if (!item.ready) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    if (item.loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.Black, strokeWidth = 2.dp)
                    Txt(item.message)
                }
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    FlatCard(Modifier.size(72.dp), item.tile, PaddingValues(0.dp)) {
                        PixelIcon(item.icon, Modifier.align(Alignment.Center), size = 48.dp)
                    }
                    Txt(item.label, size = 30, bold = true)
                }
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Txt(item.until, bold = true)
                    if (item.next.isNotEmpty()) Txt(item.next, size = 14)
                }
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SectionLabel(item.dayTitle)
                    FlatCard(padding = PaddingValues(0.dp)) {
                        Column {
                            item.timeline?.let { TimelineView(it) }
                            item.axis?.let { AxisView(it, Modifier.padding(vertical = 2.dp)) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OfflineBanner(fetchedAt: Instant?) {
    FlatCard(Modifier.fillMaxWidth(), Pixel.Possible, PaddingValues(12.dp, 10.dp)) {
        Txt(
            if (fetchedAt != null) {
                "Офлайн. Показано збережений графік від ${Fmt.localDate(fetchedAt)} ${Fmt.localHm(fetchedAt)}."
            } else {
                "Офлайн. Показано збережений графік."
            },
            size = 13,
        )
    }
}
