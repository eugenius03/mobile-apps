package com.example.pixelsvitlo.ui

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.runtime.Composable
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.pixelsvitlo.ui.screens.DetailScreen
import com.example.pixelsvitlo.ui.screens.HomeScreen
import com.example.pixelsvitlo.ui.screens.PickScreen
import com.example.pixelsvitlo.ui.screens.SettingsScreen

private fun NavController.back() {
    if (currentBackStackEntry?.lifecycle?.currentState == Lifecycle.State.RESUMED) popBackStack()
}

@Composable
fun AppNav() {
    val app = viewModel<AppViewModel>()
    val nav = rememberNavController()
    NavHost(
        nav,
        startDestination = "home",
        enterTransition = { EnterTransition.None },
        exitTransition = { ExitTransition.None },
    ) {
        composable("home") {
            HomeScreen(
                app,
                onAdd = { nav.navigate("pick") },
                onOpen = { nav.navigate("detail/$it") },
                onSettings = { nav.navigate("settings") },
            )
        }
        composable("pick") { PickScreen(app, nav::back) }
        composable("detail/{id}", listOf(navArgument("id") { type = NavType.IntType })) {
            DetailScreen(app, it.arguments!!.getInt("id"), nav::back)
        }
        composable("settings") { SettingsScreen(app, nav::back) }
    }
}
