package com.example.pixelsvitlo.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.pixelsvitlo.R
import com.example.pixelsvitlo.ui.AppViewModel
import com.example.pixelsvitlo.ui.GroupRow
import com.example.pixelsvitlo.ui.LoadStatus
import com.example.pixelsvitlo.ui.Present
import com.example.pixelsvitlo.ui.components.BevelButton
import com.example.pixelsvitlo.ui.components.FlatCard
import com.example.pixelsvitlo.ui.components.GroupCard
import com.example.pixelsvitlo.ui.components.Header
import com.example.pixelsvitlo.ui.components.HeaderIconButton
import com.example.pixelsvitlo.ui.components.HeaderTitle
import com.example.pixelsvitlo.ui.components.MutedLabel
import com.example.pixelsvitlo.ui.components.OfflineBanner
import com.example.pixelsvitlo.ui.components.PixelIcon
import com.example.pixelsvitlo.ui.components.PressBox
import com.example.pixelsvitlo.ui.components.SectionLabel
import com.example.pixelsvitlo.ui.components.TitleRow
import com.example.pixelsvitlo.ui.components.Txt
import com.example.pixelsvitlo.ui.theme.Pixel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(app: AppViewModel, onAdd: () -> Unit, onOpen: (Int) -> Unit, onSettings: () -> Unit) {
    val state by app.state.collectAsStateWithLifecycle()
    val loading = state.tracked.any { state.data(it.id).status == LoadStatus.Loading }
    var pulled by remember { mutableStateOf(false) }
    LaunchedEffect(loading) { if (!loading) pulled = false }

    Column(Modifier.fillMaxSize().background(Pixel.Bg)) {
        Header {
            HeaderTitle("Svitlo", "Графік відключень у Чернівцях", Modifier.weight(1f).padding(start = 10.dp))
            if (state.tracked.isNotEmpty()) HeaderIconButton(R.drawable.ic_plus, onAdd)
            HeaderIconButton(R.drawable.ic_sliders, onSettings)
        }

        if (state.tracked.isEmpty()) {
            Column(
                Modifier.fillMaxSize().padding(horizontal = 32.dp),
                verticalArrangement = Arrangement.spacedBy(28.dp, Alignment.CenterVertically),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Txt("До якої групи ви належите?", size = 24, bold = true, align = TextAlign.Center)
                    MutedLabel("Додайте її, щоб бачити, коли є світло, а коли його вимкнуть.", align = TextAlign.Center)
                }
                BevelButton(onAdd, Modifier.size(190.dp), icon = R.drawable.ic_plus, iconSize = 96)
            }
        } else {
            PullToRefreshBox(isRefreshing = pulled, onRefresh = { pulled = true; app.refreshAll() }) {
                Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).navigationBarsPadding()
                        .padding(16.dp, 16.dp, 16.dp, 28.dp),
                    verticalArrangement = Arrangement.spacedBy(28.dp),
                ) {
                    if (state.offline) OfflineBanner(state.staleSince)
                    state.main?.let { main ->
                        PressBox(onClick = { onOpen(main.id) }) {
                            GroupCard(Present.card(main, state.data(main.id), state.possibleAsOn, state.now, futureOnly = true))
                        }
                    }
                    if (state.others.isNotEmpty()) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            SectionLabel("Інші групи")
                            state.others.forEach { g ->
                                OtherRow(Present.row(g, state.data(g.id), state.possibleAsOn, state.now)) { onOpen(g.id) }
                            }
                        }
                    }
                    BevelButton(onAdd, Modifier.align(Alignment.CenterHorizontally), "Додати групу", R.drawable.ic_plus)
                }
            }
        }
    }
}

@Composable
private fun OtherRow(row: GroupRow, onClick: () -> Unit) {
    PressBox(onClick = onClick) {
        FlatCard(Modifier.fillMaxWidth(), row.color, PaddingValues(14.dp, 12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
                if (row.icon != 0) PixelIcon(row.icon) else Box(Modifier.size(24.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    TitleRow(row.title, row.subTitle, row.address, titleSize = 17, addressSize = 13)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Txt(row.state, size = 14, bold = true)
                        Txt(row.slot, size = 14, bold = true, mono = true)
                    }
                }
                PixelIcon(R.drawable.ic_chevron_right)
            }
        }
    }
}
