package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.example.ui.PsyPyrusMainLayout
import com.example.ui.PsyPyrusViewModel
import com.example.ui.theme.MyApplicationTheme

import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle

class MainActivity : ComponentActivity() {
    private val viewModel: PsyPyrusViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val activeTheme by viewModel.activeTheme.collectAsStateWithLifecycle()
            MyApplicationTheme(themeName = activeTheme) {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    PsyPyrusMainLayout(
                        viewModel = viewModel,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}
