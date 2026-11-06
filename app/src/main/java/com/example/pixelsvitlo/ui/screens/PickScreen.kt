package com.example.pixelsvitlo.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.pixelsvitlo.R
import com.example.pixelsvitlo.ui.AppViewModel
import com.example.pixelsvitlo.ui.LoadStatus
import com.example.pixelsvitlo.ui.PickViewModel
import com.example.pixelsvitlo.ui.components.BevelButton
import com.example.pixelsvitlo.ui.components.FlatCard
import com.example.pixelsvitlo.ui.components.Header
import com.example.pixelsvitlo.ui.components.HeaderIconButton
import com.example.pixelsvitlo.ui.components.HeaderTitle
import com.example.pixelsvitlo.ui.components.MutedLabel
import com.example.pixelsvitlo.ui.components.PixelIcon
import com.example.pixelsvitlo.ui.components.PixelInput
import com.example.pixelsvitlo.ui.components.PressBox
import com.example.pixelsvitlo.ui.components.SectionLabel
import com.example.pixelsvitlo.ui.components.Txt
import com.example.pixelsvitlo.ui.theme.Pixel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun PickScreen(app: AppViewModel, onBack: () -> Unit) {
    val vm = viewModel<PickViewModel>(factory = viewModelFactory { initializer { PickViewModel(app) } })
    val state by app.state.collectAsStateWithLifecycle()
    val hasGroups = state.groups.isNotEmpty()
    val showError = !hasGroups && state.groupsStatus == LoadStatus.Error
    LaunchedEffect(Unit) { vm.loadDistricts() }

    Column(Modifier.fillMaxSize().background(Pixel.Bg).imePadding()) {
        Header {
            HeaderIconButton(R.drawable.ic_arrow_left, onBack)
            HeaderTitle(
                if (state.tracked.isEmpty()) "Оберіть свою групу" else "Додати групу",
                if (state.tracked.isEmpty()) "Перша група стане головною." else "Групи, які ви вже відстежуєте, затемнені.",
                Modifier.weight(1f).padding(start = 6.dp),
            )
        }

        when {
            hasGroups -> Form(vm, app, onBack)
            showError -> Column(
                Modifier.fillMaxSize().padding(32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Txt(state.groupsError ?: "Не вдалося завантажити групи.", align = TextAlign.Center)
                BevelButton({ app.loadGroups() }, text = "Спробувати ще")
            }
            else -> Column(
                Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator(Modifier.size(32.dp), color = Color.Black, strokeWidth = 3.dp)
                Txt("Завантаження груп…")
            }
        }
    }
}

@Composable
private fun Form(vm: PickViewModel, app: AppViewModel, onBack: () -> Unit) {
    val state by app.state.collectAsStateWithLifecycle()
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(16.dp, 20.dp, 16.dp, 24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionLabel("Назва")
            PixelInput(vm.nickname, { vm.nickname = it }, "Необов'язково, напр. Робота або Дім", maxLength = 20)
        }

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            SectionLabel("Знайти за адресою")
            DistrictField(vm)
            vm.districtSuggestions.forEach { d -> ListRow(d) { vm.pickDistrict(d) } }
            if (vm.showNoDistricts) MutedLabel("Такого району немає.")

            val street = vm.street
            if (street == null) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    PixelInput(vm.streetQuery, vm::onStreetQuery, "Вулиця, напр. Універс")
                    vm.streets.forEach { s -> ListRow(s) { vm.pickStreet(s) } }
                    if (vm.showNoStreets) MutedLabel("Вулиць не знайдено.")
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    PressBox(onClick = vm::clearStreet) {
                        FlatCard(Modifier.fillMaxWidth(), padding = PaddingValues(14.dp, 12.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                Txt(street, Modifier.weight(1f), size = 16, bold = true)
                                PixelIcon(R.drawable.ic_pencil)
                            }
                        }
                    }
                    if (vm.allSameGroup) BevelButton({ vm.pickWholeStreet(onBack) }, text = vm.wholeStreetText)
                    PixelInput(vm.houseQuery, { vm.houseQuery = it.take(12) }, "Номер будинку")
                    MutedLabel(vm.houseHint)
                    vm.houseItems.forEach { h ->
                        PressBox(onClick = { vm.pickHouse(h.hit, whole = false, onDone = onBack) }) {
                            FlatCard(Modifier.fillMaxWidth(), padding = PaddingValues(14.dp, 12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Txt(h.number, Modifier.weight(1f), bold = true, mono = true)
                                    Txt(h.groupText, bold = true)
                                }
                            }
                        }
                    }
                }
            }

            vm.addressError?.let { Txt(it, color = Pixel.ErrorText) }
        }

        SectionLabel("Або оберіть номер групи")
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            state.groups.chunked(3).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { g ->
                        PressBox(Modifier.weight(1f), onClick = { vm.pickGroupNumber(g.id, onBack) }) {
                            FlatCard(
                                Modifier.fillMaxWidth().height(92.dp),
                                if (state.find(g.id) == null) Color.White else Pixel.Bg,
                            ) {
                                Txt(g.number.toString(), Modifier.align(Alignment.Center), size = 34, bold = true, mono = true)
                            }
                        }
                    }
                    repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                }
            }
        }
    }
}

@Composable
private fun ListRow(text: String, onClick: () -> Unit) {
    PressBox(onClick = onClick) {
        FlatCard(Modifier.fillMaxWidth(), padding = PaddingValues(14.dp, 12.dp)) { Txt(text, size = 16) }
    }
}

@Composable
private fun DistrictField(vm: PickViewModel) {
    var field by remember { mutableStateOf(TextFieldValue(vm.districtText)) }
    var focused by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current
    LaunchedEffect(vm.districtText) { if (field.text != vm.districtText) field = TextFieldValue(vm.districtText) }

    PixelInput(
        field,
        { value ->
            if (value.text != field.text) vm.onDistrictText(value.text)
            field = value
        },
        "Район або місто",
        fieldModifier = Modifier.onFocusChanged {
            if (it.isFocused && !focused) {
                focused = true
                vm.openDistricts()
                scope.launch {
                    delay(80)
                    field = field.copy(selection = TextRange(0, field.text.length))
                }
            } else if (!it.isFocused && focused) {
                focused = false
                scope.launch {
                    delay(250)
                    vm.commitDistrict()
                }
            }
        },
        trailing = {
            Box(
                Modifier.size(44.dp).clickable(remember { MutableInteractionSource() }, null) { vm.toggleDistricts() },
                contentAlignment = Alignment.Center,
            ) {
                PixelIcon(R.drawable.ic_chevron_right, Modifier.rotate(90f))
            }
        },
        onDone = { focusManager.clearFocus() },
    )
}
