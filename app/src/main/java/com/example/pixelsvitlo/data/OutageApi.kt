package com.example.pixelsvitlo.data

import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.time.DateTimeException
import java.time.Instant
import java.time.OffsetDateTime
import org.json.JSONArray
import org.json.JSONException

class OutageApiException(message: String) : Exception(message)

object OutageApi {
    const val CITY = "Чернівці"
    const val UNEXPECTED = "Неочікувана відповідь сервера eSvitlo."

    private const val BASE = "https://e-svitlo-api.intercode.win"

    fun fetchGroups(): List<OutageGroup> = parse {
        val arr = JSONArray(get("/shutdowns/groups"))
        List(arr.length()) {
            val o = arr.getJSONObject(it)
            OutageGroup(o.getInt("id"), o.getInt("groupNumber"))
        }.sortedBy { it.number }
    }

    fun fetchDistricts(): List<String> = listOf(CITY) + parseStrings(get("/shutdowns/group-search/districts"))

    fun searchStreets(district: String, text: String): List<String> =
        parseStrings(get(addressQuery(district, text, null)))

    fun fetchHouses(district: String, street: String): List<AddressHit> = parse {
        val arr = JSONArray(get(addressQuery(district, street, "")))
        List(arr.length()) {
            val o = arr.getJSONObject(it)
            AddressHit(o.optString("addressNumber", ""), o.getInt("groupNumber"), o.getInt("groupId"))
        }
    }

    fun fetchScheduleRaw(group: OutageGroup): String = get("/shutdowns/schedule?groupIds=${group.id}")

    fun parseSchedule(raw: String): Schedule = parse {
        val arr = JSONArray(raw)
        Schedule(
            List(arr.length()) {
                val o = arr.getJSONObject(it)
                Slot(
                    start = parseInstant(o.getString("dateTime")),
                    availability = when (o.getInt("availability")) {
                        1 -> Availability.Off
                        2 -> Availability.Possible
                        else -> Availability.On
                    },
                )
            },
        )
    }

    // The street autocomplete must omit addressNumber: even an empty value makes the server return house records.
    private fun addressQuery(district: String, street: String, number: String?) =
        "/shutdowns/group-search?district=${enc(district)}&addressSearch=${enc(street)}" +
            (if (number == null) "" else "&addressNumber=${enc(number)}") + "&city="

    private fun enc(s: String) = URLEncoder.encode(s, "UTF-8")

    private fun parseStrings(body: String): List<String> = parse {
        val arr = JSONArray(body)
        List(arr.length()) { arr.getString(it) }.filter { it.isNotEmpty() }
    }

    private fun <T> parse(block: () -> T): T = try {
        block()
    } catch (e: JSONException) {
        throw OutageApiException(UNEXPECTED)
    } catch (e: DateTimeException) {
        throw OutageApiException(UNEXPECTED)
    }

    private fun parseInstant(s: String): Instant =
        runCatching { Instant.parse(s) }.getOrElse { OffsetDateTime.parse(s).toInstant() }

    private fun get(path: String): String {
        try {
            val conn = URL(BASE + path).openConnection() as HttpURLConnection
            try {
                conn.connectTimeout = 10_000
                conn.readTimeout = 10_000
                val code = conn.responseCode
                if (code != 200) throw OutageApiException("Помилка сервера (HTTP $code).")
                return conn.inputStream.bufferedReader().use { it.readText() }
            } finally {
                conn.disconnect()
            }
        } catch (e: OutageApiException) {
            throw e
        } catch (e: Exception) {
            throw OutageApiException("Немає зв'язку із сервером eSvitlo.")
        }
    }
}
