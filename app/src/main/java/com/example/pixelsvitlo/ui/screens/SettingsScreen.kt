package com.example.pixelsvitlo.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.pixelsvitlo.R
import com.example.pixelsvitlo.ui.AppViewModel
import com.example.pixelsvitlo.ui.components.BevelButton
import com.example.pixelsvitlo.ui.components.ConfirmDialog
import com.example.pixelsvitlo.ui.components.Header
import com.example.pixelsvitlo.ui.components.HeaderIconButton
import com.example.pixelsvitlo.ui.components.HeaderTitle
import com.example.pixelsvitlo.ui.components.MutedLabel
import com.example.pixelsvitlo.ui.components.SectionLabel
import com.example.pixelsvitlo.ui.theme.Pixel

@Composable
fun SettingsScreen(app: AppViewModel, onBack: () -> Unit) {
    val state by app.state.collectAsStateWithLifecycle()
    var confirmClear by remember { mutableStateOf(false) }
    val asOn = state.possibleAsOn

    Box(Modifier.fillMaxSize().background(Pixel.Bg)) {
        Column(Modifier.fillMaxSize()) {
            Header {
                HeaderIconButton(R.drawable.ic_arrow_left, onBack)
                HeaderTitle("Налаштування", null, Modifier.weight(1f).padding(start = 6.dp))
            }
            Column(
                Modifier.fillMaxSize().verticalScroll(rememberScrollState()).navigationBarsPadding()
                    .padding(16.dp, 20.dp, 16.dp, 28.dp),
                verticalArrangement = Arrangement.spacedBy(28.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SectionLabel("Можливе світло")
                    MutedLabel("Деякі проміжки позначені як можливі. Показувати їх окремим кольором чи вважати, що світло є.")
                    Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        BevelButton(
                            { app.setPossibleAsOn(false) },
                            Modifier.weight(1f),
                            "Окремий колір",
                            base = if (asOn) Color.White else Pixel.Accent,
                            textColor = if (asOn) Color.Black else Color.White,
                        )
                        BevelButton(
                            { app.setPossibleAsOn(true) },
                            Modifier.weight(1f),
                            "Як світло є",
                            base = if (asOn) Pixel.Accent else Color.White,
                            textColor = if (asOn) Color.White else Color.Black,
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SectionLabel("Про дані")
                    MutedLabel(
                        "Графіки беруться з неофіційного API eSvitlo.cv. Час київський, оновлення кожні 15 хвилин. " +
                            "Без інтернету показується останній збережений графік із відповідною позначкою.",
                    )
                }

                BevelButton(
                    { confirmClear = true },
                    Modifier.fillMaxWidth(),
                    "Видалити всі групи",
                    R.drawable.ic_trash,
                    base = Pixel.Danger,
                    textColor = Color.Black,
                    enabled = state.tracked.isNotEmpty(),
                )
            }
        }

        if (confirmClear) {
            ConfirmDialog(
                title = "Видалити всі групи",
                message = "Перестати відстежувати всі групи?",
                confirmText = "Видалити",
                onConfirm = {
                    confirmClear = false
                    app.clearAll()
                },
                onDismiss = { confirmClear = false },
            )
        }
    }
}
