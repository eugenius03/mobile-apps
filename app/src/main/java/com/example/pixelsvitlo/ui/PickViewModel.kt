package com.example.pixelsvitlo.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.pixelsvitlo.data.AddressHit
import com.example.pixelsvitlo.data.OutageApi
import com.example.pixelsvitlo.data.OutageApiException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class HouseItem(val number: String, val groupText: String, val hit: AddressHit)

class PickViewModel(private val app: AppViewModel) : ViewModel() {
    var nickname by mutableStateOf("")

    var districts by mutableStateOf(listOf(OutageApi.CITY))
        private set

    var district by mutableStateOf(OutageApi.CITY)
        private set

    var districtText by mutableStateOf(OutageApi.CITY)
        private set

    var districtOpen by mutableStateOf(false)
        private set

    private var districtFilter by mutableStateOf<String?>(null)

    var streetQuery by mutableStateOf("")
        private set

    var street by mutableStateOf<String?>(null)
        private set

    var streets by mutableStateOf<List<String>>(emptyList())
        private set

    var houseQuery by mutableStateOf("")

    var addressError by mutableStateOf<String?>(null)
        private set

    private var houses by mutableStateOf<List<AddressHit>>(emptyList())
    private var searching by mutableStateOf(false)
    private var searchJob: Job? = null

    val districtSuggestions: List<String>
        get() = if (!districtOpen) {
            emptyList()
        } else {
            districts.filter { districtFilter.isNullOrBlank() || it.contains(districtFilter!!.trim(), ignoreCase = true) }
        }

    val showNoDistricts: Boolean get() = districtOpen && districtSuggestions.isEmpty()

    val showNoStreets: Boolean
        get() = street == null && !searching && addressError == null && streetQuery.trim().length >= MIN_STREET_CHARS && streets.isEmpty()

    val allSameGroup: Boolean get() = houses.isNotEmpty() && houses.map { it.groupId }.distinct().size == 1

    val wholeStreetText: String get() = if (allSameGroup) "Вся вулиця · Група ${houses[0].groupNumber}" else ""

    val houseHint: String
        get() = when {
            houses.isEmpty() -> ""
            houseQuery.isBlank() -> "Будинків: ${houses.size}. Введіть номер, щоб звузити."
            houseItems.isEmpty() -> "Такого будинку на цій вулиці немає."
            else -> ""
        }

    val houseItems: List<HouseItem>
        get() {
            val q = houseQuery.trim()
            return houses
                .filter { q.isEmpty() || it.number.contains(q, ignoreCase = true) }
                .sortedWith(
                    compareBy<AddressHit> { if (it.number.startsWith(q, ignoreCase = true)) 0 else 1 }
                        .thenBy { it.number.length }
                        .thenBy(String.CASE_INSENSITIVE_ORDER) { it.number },
                )
                .take(MAX_ROWS)
                .map { HouseItem(it.number.ifEmpty { "Без номера" }, "Група ${it.groupNumber}", it) }
        }

    fun loadDistricts() {
        if (districts.size > 1) return
        viewModelScope.launch {
            try {
                districts = withContext(Dispatchers.IO) { OutageApi.fetchDistricts() }
            } catch (_: OutageApiException) {
            }
        }
    }

    fun onDistrictText(value: String) {
        districtText = value
        districtFilter = value
        districtOpen = true
        val exact = districts.firstOrNull { it.equals(value.trim(), ignoreCase = true) }
        if (exact != null && exact != district) selectDistrict(exact)
    }

    fun pickDistrict(value: String) {
        selectDistrict(value)
        districtOpen = false
    }

    fun toggleDistricts() {
        districtOpen = !districtOpen
        districtFilter = null
    }

    fun openDistricts() {
        districtOpen = true
        districtFilter = null
    }

    fun commitDistrict() {
        districtOpen = false
        if (districts.none { it == districtText }) districtText = district
    }

    private fun selectDistrict(value: String) {
        district = value
        districtText = value
        street = null
        houses = emptyList()
        streets = emptyList()
        onStreetQuery("")
    }

    fun onStreetQuery(value: String) {
        if (value == streetQuery) return
        streetQuery = value
        searchStreets()
    }

    private fun searchStreets() {
        searchJob?.cancel()
        val q = streetQuery.trim()
        if (q.length < MIN_STREET_CHARS) {
            searching = false
            streets = emptyList()
            addressError = null
            return
        }
        searchJob = viewModelScope.launch {
            delay(DEBOUNCE_MS)
            searching = true
            try {
                streets = withContext(Dispatchers.IO) { OutageApi.searchStreets(district, q) }.take(MAX_ROWS)
                addressError = null
            } catch (e: OutageApiException) {
                streets = emptyList()
                addressError = e.message
            } finally {
                searching = false
            }
        }
    }

    fun pickStreet(value: String) {
        searchJob?.cancel()
        viewModelScope.launch {
            try {
                houses = withContext(Dispatchers.IO) { OutageApi.fetchHouses(district, value) }
                street = value
                streets = emptyList()
                addressError = null
                houseQuery = ""
            } catch (e: OutageApiException) {
                addressError = e.message
            }
        }
    }

    fun clearStreet() {
        street = null
        houses = emptyList()
        houseQuery = ""
    }

    fun pickGroupNumber(id: Int, onDone: () -> Unit) {
        val group = app.state.value.groups.firstOrNull { it.id == id } ?: return
        app.add(group, nickname)
        nickname = ""
        onDone()
    }

    fun pickHouse(hit: AddressHit, whole: Boolean, onDone: () -> Unit) {
        val groups = app.state.value.groups
        val group = groups.firstOrNull { it.id == hit.groupId } ?: groups.firstOrNull { it.number == hit.groupNumber }
        if (group == null) {
            addressError = "Групи ${hit.groupNumber} поки немає."
            return
        }
        app.add(group, nickname, formatAddress(hit, whole))
        nickname = ""
        onDone()
    }

    fun pickWholeStreet(onDone: () -> Unit) {
        if (allSameGroup) pickHouse(houses[0], whole = true, onDone)
    }

    private fun formatAddress(hit: AddressHit, whole: Boolean): String {
        val name = street.orEmpty()
        val parts = buildList {
            if (district != OutageApi.CITY) add(district)
            add(if (name.any { it.isLowerCase() }) name else capitalize(name))
            if (!whole && hit.number.isNotEmpty()) add(hit.number)
        }
        return parts.joinToString(", ")
    }

    private fun capitalize(upper: String) = upper.lowercase().split(' ').joinToString(" ") { w ->
        w.replaceFirstChar { it.uppercase() }
    }

    private companion object {
        const val MIN_STREET_CHARS = 2
        const val MAX_ROWS = 8
        const val DEBOUNCE_MS = 300L
    }
}
