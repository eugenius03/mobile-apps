package com.example.pixelsvitlo.data

import android.content.Context
import java.time.Instant
import org.json.JSONArray
import org.json.JSONObject

data class TrackedGroup(val id: Int, val number: Int, val nickname: String = "", val address: String = "") {
    val name: String get() = nickname.ifBlank { "Група $number" }.trim()

    val subName: String get() = if (nickname.isBlank()) "" else "Група $number"

    val group: OutageGroup get() = OutageGroup(id, number)
}

class CachedSchedule(val raw: String, val fetchedAt: Instant)

class Prefs(context: Context) {
    private val prefs = context.getSharedPreferences("pixelsvitlo", Context.MODE_PRIVATE)

    fun loadTracked(): List<TrackedGroup> = runCatching {
        val arr = JSONArray(prefs.getString(KEY_TRACKED, "[]"))
        List(arr.length()) {
            val o = arr.getJSONObject(it)
            TrackedGroup(o.getInt("id"), o.getInt("number"), o.optString("nickname"), o.optString("address"))
        }
    }.getOrDefault(emptyList())

    fun loadMain(): Int = prefs.getInt(KEY_MAIN, -1)

    fun saveTracked(tracked: List<TrackedGroup>, mainId: Int?) {
        val arr = JSONArray(
            tracked.map {
                JSONObject().put("id", it.id).put("number", it.number).put("nickname", it.nickname).put("address", it.address)
            },
        )
        prefs.edit().putString(KEY_TRACKED, arr.toString()).putInt(KEY_MAIN, mainId ?: -1).apply()
    }

    fun loadPossibleAsOn(): Boolean = prefs.getBoolean(KEY_POSSIBLE, false)

    fun savePossibleAsOn(v: Boolean) {
        prefs.edit().putBoolean(KEY_POSSIBLE, v).apply()
    }

    fun loadCache(groupId: Int): CachedSchedule? {
        val raw = prefs.getString("schedule_$groupId", null) ?: return null
        if (!prefs.contains("schedule_at_$groupId")) return null
        return CachedSchedule(raw, Instant.ofEpochMilli(prefs.getLong("schedule_at_$groupId", 0)))
    }

    fun saveCache(groupId: Int, raw: String, at: Instant) {
        prefs.edit().putString("schedule_$groupId", raw).putLong("schedule_at_$groupId", at.toEpochMilli()).apply()
    }

    private companion object {
        const val KEY_TRACKED = "tracked_groups"
        const val KEY_MAIN = "main_group"
        const val KEY_POSSIBLE = "possible_as_on"
    }
}
