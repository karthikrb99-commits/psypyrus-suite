package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val RetroCrtColorScheme = darkColorScheme(
    primary = Color(0xFF33FF33), // Terminal Green
    secondary = Color(0xFF00AA00),
    tertiary = Color(0xFF33FF33),
    background = Color(0xFF021004),
    surface = Color(0xFF041C06),
    onPrimary = Color.Black,
    onSecondary = Color.White,
    onBackground = Color(0xFF33FF33),
    onSurface = Color(0xFF88FF88)
)

val NeonCyberpunkColorScheme = darkColorScheme(
    primary = Color(0xFFFF007F), // Neon Pink
    secondary = Color(0xFF00F0FF), // Neon Cyan
    tertiary = Color(0xFFFFFF00), // Neon Yellow
    background = Color(0xFF0A0519),
    surface = Color(0xFF140D2D),
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color(0xFFE2E8F0),
    onSurface = Color(0xFFF8FAFC)
)

private val DarkColorScheme = darkColorScheme(
    primary = TealSecondary, // Teal pops magnificently in dark mode
    secondary = IndigoPrimary,
    tertiary = GoldAccent,
    background = DarkCharcoalBg,
    surface = DarkCharcoalSurf,
    onPrimary = Color(0xFF0F172A),
    onSecondary = Color.White,
    onTertiary = Color.Black,
    onBackground = Color(0xFFE2E8F0),
    onSurface = Color(0xFFF8FAFC)
)

private val LightColorScheme = lightColorScheme(
    primary = IndigoPrimary,
    secondary = TealSecondary,
    tertiary = GoldAccent,
    background = LightBg,
    surface = LightSurf,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF1E293B)
)

@Composable
fun MyApplicationTheme(
    themeName: String = "dark",
    content: @Composable () -> Unit
) {
    val colorScheme = when (themeName.lowercase()) {
        "light" -> LightColorScheme
        "retro crt scanline filter" -> RetroCrtColorScheme
        "neon cyberpunk theme" -> NeonCyberpunkColorScheme
        else -> DarkColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
