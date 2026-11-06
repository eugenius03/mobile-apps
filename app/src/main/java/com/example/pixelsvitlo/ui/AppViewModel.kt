package com.example.pixelsvitlo.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.pixelsvitlo.data.OutageApi
import com.example.pixelsvitlo.data.OutageApiException
import com.example.pixelsvitlo.data.OutageGroup
import com.example.pixelsvitlo.data.Prefs
import com.example.pixelsvitlo.data.Schedule
import com.example.pixelsvitlo.data.TrackedGroup
import java.time.Instant
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class LoadStatus { Idle, Loading, Ready, Error }

data class GroupData(
    val schedule: Schedule? = null,
    val fetchedAt: Instant? = null,
    val stale: Boolean = false,
    val status: LoadStatus = LoadStatus.Idle,
    val error: String? = null,
)

data class AppState(
    val tracked: List<TrackedGroup> = emptyList(),
    val mainId: Int? = null,
    val possibleAsOn: Boolean = false,
    val data: Map<Int, GroupData> = emptyMap(),
    val groups: List<OutageGroup> = emptyList(),
    val groupsStatus: LoadStatus = LoadStatus.Idle,
    val groupsError: String? = null,
    val now: Instant = Instant.now(),
) {
    val main: TrackedGroup? get() = tracked.firstOrNull { it.id == mainId }

    val others: List<TrackedGroup> get() = tracked.filter { it.id != mainId }

    fun find(id: Int): TrackedGroup? = tracked.firstOrNull { it.id == id }

    fun data(id: Int): GroupData = data[id] ?: GroupData()

    val offline: Boolean get() = tracked.any { data(it.id).stale }

    val staleSince: Instant? get() = tracked.map { data(it.id) }.filter { it.stale }.mapNotNull { it.fetchedAt }.minOrNull()
}

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val prefs = Prefs(application)
    private val _state = MutableStateFlow(initialState())

    val state: StateFlow<AppState> = _state

    init {
        loadGroups()
        refreshAll()
        viewModelScope.launch {
            var ticks = 0
            while (true) {
                delay(TICK_MS)
                ticks++
                if (ticks % REFRESH_EVERY_TICKS == 0) refreshAll() else mutate { it }
            }
        }
    }

    private fun initialState(): AppState {
        val tracked = prefs.loadTracked()
        val main = prefs.loadMain()
        return AppState(
            tracked = tracked,
            mainId = if (tracked.any { it.id == main }) main else tracked.firstOrNull()?.id,
            possibleAsOn = prefs.loadPossibleAsOn(),
        )
    }

    private fun mutate(f: (AppState) -> AppState) = _state.update { f(it).copy(now = Instant.now()) }

    private fun updateData(id: Int, f: (GroupData) -> GroupData) = mutate {
        if (it.find(id) == null) it else it.copy(data = it.data + (id to f(it.data(id))))
    }

    fun loadGroups() {
        viewModelScope.launch {
            mutate { it.copy(groupsStatus = LoadStatus.Loading) }
            try {
                val groups = withContext(Dispatchers.IO) { OutageApi.fetchGroups() }
                mutate { it.copy(groups = groups, groupsStatus = LoadStatus.Ready) }
            } catch (e: OutageApiException) {
                mutate { it.copy(groupsStatus = LoadStatus.Error, groupsError = e.message) }
            }
        }
    }

    fun refreshAll() {
        viewModelScope.launch {
            _state.value.tracked.map { async { refreshGroup(it.id) } }.awaitAll()
        }
    }

    fun refreshGroup(id: Int) {
        viewModelScope.launch { fetchGroup(id) }
    }

    private suspend fun fetchGroup(id: Int) {
        val group = _state.value.find(id) ?: return
        updateData(id) { it.copy(status = LoadStatus.Loading, error = null) }
        try {
            val (raw, parsed) = withContext(Dispatchers.IO) {
                val raw = OutageApi.fetchScheduleRaw(group.group)
                raw to OutageApi.parseSchedule(raw)
            }
            val now = Instant.now()
            prefs.saveCache(id, raw, now)
            updateData(id) { GroupData(parsed, now, false, LoadStatus.Ready) }
        } catch (e: OutageApiException) {
            val cached = prefs.loadCache(id)?.let { c ->
                runCatching { OutageApi.parseSchedule(c.raw) to c.fetchedAt }.getOrNull()
            }
            updateData(id) { d ->
                when {
                    d.schedule != null -> d.copy(error = e.message, stale = true, status = LoadStatus.Ready)
                    cached != null -> GroupData(cached.first, cached.second, true, LoadStatus.Ready, e.message)
                    else -> d.copy(error = e.message, status = LoadStatus.Error)
                }
            }
        }
    }

    fun add(group: OutageGroup, nickname: String, address: String = "") {
        val existing = _state.value.find(group.id)
        if (existing != null) {
            if (address.isNotEmpty() && existing.address.isEmpty()) {
                mutate { s -> s.copy(tracked = s.tracked.map { if (it.id == group.id) it.copy(address = address) else it }) }
                saveTracked()
            }
            return
        }
        mutate { s ->
            s.copy(
                tracked = s.tracked + TrackedGroup(group.id, group.number, nickname.trim(), address),
                mainId = s.mainId ?: group.id,
            )
        }
        saveTracked()
        refreshGroup(group.id)
    }

    fun remove(id: Int) {
        mutate { s ->
            val left = s.tracked.filter { it.id != id }
            s.copy(
                tracked = left,
                data = s.data - id,
                mainId = if (s.mainId == id) left.firstOrNull()?.id else s.mainId,
            )
        }
        saveTracked()
    }

    fun setMain(id: Int) {
        if (_state.value.find(id) == null) return
        mutate { it.copy(mainId = id) }
        saveTracked()
    }

    fun rename(id: Int, nickname: String) {
        mutate { s -> s.copy(tracked = s.tracked.map { if (it.id == id) it.copy(nickname = nickname.trim()) else it }) }
        saveTracked()
    }

    fun clearAll() {
        mutate { it.copy(tracked = emptyList(), data = emptyMap(), mainId = null) }
        saveTracked()
    }

    fun setPossibleAsOn(value: Boolean) {
        prefs.savePossibleAsOn(value)
        mutate { it.copy(possibleAsOn = value) }
    }

    private fun saveTracked() = _state.value.let { prefs.saveTracked(it.tracked, it.mainId) }

    private companion object {
        const val TICK_MS = 60_000L
        const val REFRESH_EVERY_TICKS = 15
    }
}
