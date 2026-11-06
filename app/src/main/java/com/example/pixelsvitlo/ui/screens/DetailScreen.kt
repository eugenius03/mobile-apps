package com.example.pixelsvitlo.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.pixelsvitlo.R
import com.example.pixelsvitlo.data.TrackedGroup
import com.example.pixelsvitlo.ui.AppViewModel
import com.example.pixelsvitlo.ui.Fmt
import com.example.pixelsvitlo.ui.Present
import com.example.pixelsvitlo.ui.components.BevelButton
import com.example.pixelsvitlo.ui.components.ConfirmDialog
import com.example.pixelsvitlo.ui.components.FlatCard
import com.example.pixelsvitlo.ui.components.OfflineBanner
import com.example.pixelsvitlo.ui.components.GroupCard
import com.example.pixelsvitlo.ui.components.Header
import com.example.pixelsvitlo.ui.components.HeaderIconButton
import com.example.pixelsvitlo.ui.components.MutedLabel
import com.example.pixelsvitlo.ui.components.PixelIcon
import com.example.pixelsvitlo.ui.components.SectionLabel
import com.example.pixelsvitlo.ui.components.Txt
import com.example.pixelsvitlo.ui.theme.Pixel
import kotlinx.coroutines.delay

@Composable
fun DetailScreen(app: AppViewModel, id: Int, onBack: () -> Unit) {
    val state by app.state.collectAsStateWithLifecycle()
    val group = state.find(id)
    var confirmRemove by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().background(Pixel.Bg)) {
        Column(Modifier.fillMaxSize()) {
            var editing by remember { mutableStateOf(false) }
            Header(if (editing) Pixel.AccentDark else Pixel.Accent) {
                HeaderIconButton(R.drawable.ic_arrow_left, onBack)
                Column(Modifier.weight(1f).padding(horizontal = 6.dp)) {
                    if (group != null) {
                        TitleEditor(group, editing, { editing = it }, { app.rename(id, it) })
                        val sub = (if (state.mainId == id) "Головна група" else "Відстежувана група") +
                            if (group.subName.isNotEmpty()) " · ${group.subName}" else ""
                        Txt(sub, size = 13, color = Pixel.OnAccentMuted)
                    }
                }
                HeaderIconButton(R.drawable.ic_reload, { app.refreshGroup(id) })
            }

            if (group != null) {
                val data = state.data(id)
                Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).navigationBarsPadding()
                        .padding(16.dp, 16.dp, 16.dp, 28.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp),
                ) {
                    if (data.stale) OfflineBanner(data.fetchedAt)

                    GroupCard(Present.card(group, data, state.possibleAsOn, state.now), showAddress = false)

                    if (group.address.isNotEmpty()) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            SectionLabel("Адреса")
                            FlatCard(Modifier.fillMaxWidth(), padding = PaddingValues(14.dp, 12.dp)) { Txt(group.address, size = 16) }
                        }
                    }

                    data.schedule?.takeIf { !it.isEmpty }?.let { schedule ->
                        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
                            Present.days(schedule, state.possibleAsOn, state.now).forEach { day ->
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    SectionLabel(day.title)
                                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        day.runs.forEach { run ->
                                            FlatCard(Modifier.fillMaxWidth(), run.color, PaddingValues(12.dp, 10.dp)) {
                                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                                    PixelIcon(run.icon)
                                                    Txt(run.range, Modifier.weight(1f), bold = true, mono = true)
                                                    Txt(run.length, size = 14)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        if (state.mainId != id) {
                            BevelButton({ app.setMain(id) }, Modifier.fillMaxWidth(), "Зробити головною", R.drawable.ic_star)
                        }
                        BevelButton(
                            { confirmRemove = true },
                            Modifier.fillMaxWidth(),
                            "Видалити групу",
                            R.drawable.ic_trash,
                            base = Pixel.Danger,
                            textColor = Color.Black,
                        )
                    }

                    data.fetchedAt?.let {
                        MutedLabel("Оновлено ${Fmt.localHm(it)}", Modifier.align(Alignment.CenterHorizontally), size = 12)
                    }
                }
            }
        }

        if (confirmRemove && group != null) {
            ConfirmDialog(
                title = "Видалити групу",
                message = "Перестати відстежувати «${group.name}»?",
                confirmText = "Видалити",
                onConfirm = {
                    confirmRemove = false
                    app.remove(id)
                    onBack()
                },
                onDismiss = { confirmRemove = false },
            )
        }
    }
}

@Composable
private fun TitleEditor(group: TrackedGroup, editing: Boolean, setEditing: (Boolean) -> Unit, save: (String) -> Unit) {
    var field by remember { mutableStateOf(TextFieldValue()) }
    var focused by remember { mutableStateOf(false) }
    val focus = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    val style = TextStyle(color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)

    fun start() {
        field = TextFieldValue(group.name, TextRange(0, group.name.length))
        setEditing(true)
    }

    fun finish() {
        if (!editing) return
        setEditing(false)
        val name = field.text.trim()
        save(if (name == "Група ${group.number}") "" else name)
    }

    LaunchedEffect(editing) {
        if (editing) {
            delay(120)
            focus.requestFocus()
        }
    }

    if (editing) {
        BasicTextField(
            field,
            { if (it.text.length <= MAX_NAME) field = it },
            Modifier.fillMaxWidth().focusRequester(focus).onFocusChanged {
                if (it.isFocused) {
                    focused = true
                } else if (focused) {
                    focused = false
                    finish()
                }
            },
            singleLine = true,
            textStyle = style,
            cursorBrush = SolidColor(Color.White),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
        )
    } else {
        Row(
            Modifier.pointerInput(group) { detectTapGestures(onDoubleTap = { start() }) },
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Txt(group.name, Modifier.weight(1f, fill = false), size = 24, bold = true, color = Color.White, maxLines = 1)
            Box(
                Modifier.size(44.dp, 28.dp).clickable(remember { MutableInteractionSource() }, null) { start() },
                contentAlignment = Alignment.Center,
            ) {
                PixelIcon(R.drawable.ic_pencil, Modifier.alpha(0.7f), tint = Color.White)
            }
        }
    }
}

private const val MAX_NAME = 20
