package com.example.pixelsvitlo.ui

import androidx.annotation.DrawableRes
import androidx.compose.ui.graphics.Color
import com.example.pixelsvitlo.R
import com.example.pixelsvitlo.data.Availability
import com.example.pixelsvitlo.data.Schedule
import com.example.pixelsvitlo.data.TrackedGroup
import com.example.pixelsvitlo.data.hm
import com.example.pixelsvitlo.data.kyivDay
import com.example.pixelsvitlo.data.kyivMidnight
import com.example.pixelsvitlo.ui.theme.Pixel
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class Timeline(val cells: List<Color?>, val nowIndex: Int)

class Axis(val startHour: Double, val stepHours: Int)

class RunItem(val range: String, val length: String, @DrawableRes val icon: Int, val color: Color)

class DayItem(val title: String, val runs: List<RunItem>)

class MainCardItem(
    val title: String,
    val subTitle: String,
    val address: String,
    val ready: Boolean = false,
    val message: String = "",
    val loading: Boolean = false,
    val color: Color = Color.White,
    val tile: Color = Color.White,
    @DrawableRes val icon: Int = 0,
    val label: String = "",
    val until: String = "",
    val next: String = "",
    val timeline: Timeline? = null,
    val axis: Axis? = null,
    val dayTitle: String = "",
)

class GroupRow(
    val id: Int,
    val title: String,
    val subTitle: String,
    val address: String,
    val color: Color,
    @DrawableRes val icon: Int,
    val state: String,
    val slot: String,
)

object Fmt {
    private val months = listOf("січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру")
    private val weekdays = listOf("нд", "пн", "вт", "ср", "чт", "пт", "сб")
    private val hmFormat = DateTimeFormatter.ofPattern("HH:mm")

    fun date(d: LocalDate, weekday: Boolean = false) =
        (if (weekday) "${weekdays[d.dayOfWeek.value % 7]} " else "") + "${d.dayOfMonth} ${months[d.monthValue - 1]}"

    fun localDate(t: Instant): String = date(t.atZone(ZoneId.systemDefault()).toLocalDate())

    fun localHm(t: Instant): String = hmFormat.format(t.atZone(ZoneId.systemDefault()))

    fun dur(d: Duration): String {
        val h = d.toHours()
        val m = d.toMinutes() % 60
        return when {
            h == 0L -> "$m хв"
            m == 0L -> "$h год"
            else -> "$h год $m хв"
        }
    }

    fun availColor(a: Availability, possibleAsOn: Boolean) = when (a) {
        Availability.On -> Pixel.On
        Availability.Off -> Pixel.Off
        Availability.Possible -> if (possibleAsOn) Pixel.On else Pixel.Possible
    }

    fun cardColor(a: Availability, possibleAsOn: Boolean) =
        if (a == Availability.On || (a == Availability.Possible && possibleAsOn)) Color.White else availColor(a, possibleAsOn)

    fun availLabel(a: Availability) = when (a) {
        Availability.On -> "Світло є"
        Availability.Off -> "Світла немає"
        Availability.Possible -> "Світло можливе"
    }

    fun availShort(a: Availability) = if (a == Availability.Possible) "Можливе" else availLabel(a)

    @DrawableRes
    fun availIcon(a: Availability) = when (a) {
        Availability.On -> R.drawable.ic_zap
        Availability.Off -> R.drawable.ic_zap_off
        Availability.Possible -> R.drawable.ic_hourglass
    }
}

object Present {
    private const val SLOTS = 48

    private fun dayLabel(day: LocalDate) = Fmt.date(day, weekday = true)

    private fun offText(off: Duration) = if (off.isZero) "без відключень" else "${Fmt.dur(off)} без світла"

    private fun nowSlot(day: LocalDate, now: Instant): Int =
        (Duration.between(kyivMidnight(day), now).toMinutes() / 30).toInt().coerceIn(0, SLOTS - 1)

    private fun timeline(schedule: Schedule, day: LocalDate, asOn: Boolean, now: Instant, from: Int = 0): Timeline {
        val runs = schedule.runsForDay(day)
        val start = kyivMidnight(day)
        var nowIndex = -1
        val cells = (from until SLOTS).map { i ->
            val t = start.plusSeconds(1800L * i)
            if (now >= t && now < t.plusSeconds(1800)) nowIndex = i - from
            runs.firstOrNull { t >= it.start && t < it.end }?.let { Fmt.availColor(it.availability, asOn) }
        }
        return Timeline(cells, nowIndex)
    }

    private fun restOfDayTitle(schedule: Schedule, day: LocalDate, from: Int): String {
        val startUtc = kyivMidnight(day).plusSeconds(1800L * from)
        var off = Duration.ZERO
        for (r in schedule.runsForDay(day).filter { it.availability == Availability.Off }) {
            val s = maxOf(r.start, startUtc)
            if (r.end > s) off += Duration.between(s, r.end)
        }
        return "Решта дня · ${offText(off)}"
    }

    fun days(schedule: Schedule, asOn: Boolean, now: Instant): List<DayItem> = schedule.days().map { day ->
        val items = schedule.runsForDay(day).filter { it.availability != Availability.On }.map {
            RunItem("${it.start.hm()} – ${it.end.hm()}", Fmt.dur(it.length), Fmt.availIcon(it.availability), Fmt.availColor(it.availability, asOn))
        }
        val label = dayLabel(day)
        DayItem(if (items.isNotEmpty()) "Відключення · $label" else "$label · без відключень", items)
    }

    fun card(g: TrackedGroup, d: GroupData, asOn: Boolean, now: Instant, futureOnly: Boolean = false): MainCardItem {
        fun msg(m: String, loading: Boolean = false) = MainCardItem(g.name, g.subName, g.address, message = m, loading = loading)

        val schedule = d.schedule
            ?: return if (d.status == LoadStatus.Error) msg(d.error ?: "Щось пішло не так.") else msg("Перевіряємо мережу…", true)
        if (schedule.isEmpty) return msg("Для цієї групи немає даних.")
        val cur = schedule.currentRun(now) ?: return msg("Зараз поза опублікованим графіком.")

        val next = schedule.nextRun(now)
        val today = kyivDay(now)
        val from = if (futureOnly) nowSlot(today, now) else 0
        val until = if (next == null) {
            when (cur.availability) {
                Availability.Off -> "Час увімкнення ще не опубліковано"
                Availability.On -> "Наступне відключення ще не опубліковано"
                Availability.Possible -> "Наступну зміну ще не опубліковано"
            }
        } else {
            "До ${cur.end.hm()} · лишилось ${Fmt.dur(Duration.between(now, cur.end))}"
        }
        return MainCardItem(
            title = g.name,
            subTitle = g.subName,
            address = g.address,
            ready = true,
            color = Fmt.cardColor(cur.availability, asOn),
            tile = Fmt.availColor(cur.availability, asOn),
            icon = Fmt.availIcon(cur.availability),
            label = Fmt.availLabel(cur.availability),
            until = until,
            next = next?.let { "Далі: ${Fmt.availLabel(it.availability).lowercase()} ${it.start.hm()}–${it.end.hm()}" } ?: "",
            timeline = timeline(schedule, today, asOn, now, from),
            axis = Axis(from / 2.0, if (futureOnly) 3 else 6),
            dayTitle = if (futureOnly) {
                restOfDayTitle(schedule, today, from)
            } else {
                "${dayLabel(today)} · ${offText(schedule.offTime(today))}"
            },
        )
    }

    fun row(g: TrackedGroup, d: GroupData, asOn: Boolean, now: Instant): GroupRow {
        fun plain(state: String) = GroupRow(g.id, g.name, g.subName, g.address, Color.White, 0, state, "")

        val schedule = d.schedule
            ?: return plain(if (d.status == LoadStatus.Error) "Немає даних" else "Завантаження…")
        val cur = schedule.currentRun(now) ?: return plain("Зараз немає даних")
        val next = schedule.nextRun(now)
        return GroupRow(
            g.id, g.name, g.subName, g.address,
            Fmt.availColor(cur.availability, asOn), Fmt.availIcon(cur.availability),
            Fmt.availShort(cur.availability),
            if (next == null) "· з ${cur.start.hm()}" else "· ${cur.start.hm()}–${cur.end.hm()}",
        )
    }
}
