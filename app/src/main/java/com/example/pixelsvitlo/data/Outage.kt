package com.example.pixelsvitlo.data

import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

enum class Availability { On, Off, Possible }

data class OutageGroup(val id: Int, val number: Int)

data class AddressHit(val number: String, val groupNumber: Int, val groupId: Int)

val KyivZone: ZoneId = runCatching { ZoneId.of("Europe/Kyiv") }.getOrElse { ZoneId.of("Europe/Kiev") }

private val hmFormat = DateTimeFormatter.ofPattern("HH:mm")

fun Instant.toKyiv(): ZonedDateTime = atZone(KyivZone)

fun Instant.hm(): String = hmFormat.format(toKyiv())

fun kyivDay(t: Instant): LocalDate = t.toKyiv().toLocalDate()

fun kyivMidnight(day: LocalDate): Instant = day.atStartOfDay(KyivZone).toInstant()

data class Slot(val start: Instant, val availability: Availability) {
    val end: Instant get() = start.plus(Duration.ofMinutes(30))
}

data class Run(val start: Instant, val end: Instant, val availability: Availability) {
    val length: Duration get() = Duration.between(start, end)
}

class Schedule(slots: List<Slot>) {
    val slots: List<Slot> = slots.sortedBy { it.start }

    private val runs: List<Run> = merge(this.slots)

    val isEmpty: Boolean get() = slots.isEmpty()

    fun currentRun(now: Instant): Run? = runs.firstOrNull { now >= it.start && now < it.end }

    fun nextRun(now: Instant): Run? {
        val cur = currentRun(now) ?: return null
        return runs.getOrNull(runs.indexOf(cur) + 1)
    }

    fun runsForDay(day: LocalDate): List<Run> {
        val startUtc = kyivMidnight(day)
        val endUtc = kyivMidnight(day.plusDays(1))
        return runs.mapNotNull { r ->
            val s = maxOf(r.start, startUtc)
            val e = minOf(r.end, endUtc)
            if (s < e) Run(s, e, r.availability) else null
        }
    }

    fun days(): List<LocalDate> = slots.map { kyivDay(it.start) }.distinct().sorted()

    fun offTime(day: LocalDate): Duration = runsForDay(day)
        .filter { it.availability == Availability.Off }
        .fold(Duration.ZERO) { a, r -> a.plus(r.length) }

    private companion object {
        fun merge(slots: List<Slot>): List<Run> {
            val out = ArrayList<Run>()
            for (s in slots) {
                val last = out.lastOrNull()
                if (last != null && last.availability == s.availability && last.end == s.start) {
                    out[out.size - 1] = last.copy(end = s.end)
                } else {
                    out.add(Run(s.start, s.end, s.availability))
                }
            }
            return out
        }
    }
}
