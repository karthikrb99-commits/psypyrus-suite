package com.example.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.*
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PsyPyrusMainLayout(
    viewModel: PsyPyrusViewModel,
    modifier: Modifier = Modifier
) {
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()
    val currentScreen by viewModel.currentScreen.collectAsStateWithLifecycle()
    val isBiometricVerified by viewModel.isBiometricVerified.collectAsStateWithLifecycle()

    val configuration = LocalConfiguration.current
    val isWideScreen = configuration.screenWidthDp >= 600

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (!isBiometricVerified) {
            BiometricLockScreen(onVerify = { viewModel.toggleBiometric() })
        } else {
            if (isWideScreen) {
                // Wide Screen Canonical Layout: side navigation rail
                Row(modifier = Modifier.fillMaxSize()) {
                    PsyPyrusNavRail(
                        activeRole = activeRole,
                        currentScreen = currentScreen,
                        onScreenSelected = { viewModel.navigate(it) },
                        onSwitchRole = { viewModel.switchRole(it) },
                        onToggleBiometric = { viewModel.toggleBiometric() }
                    )
                    VerticalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Box(modifier = Modifier.weight(1f)) {
                        ActiveScreenContent(currentScreen, viewModel)
                    }
                }
            } else {
                // Compact Screen Layout: standard Scaffold with bottom nav bar and top bar
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Healing,
                                        contentDescription = "PsyPyrus",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "PsyPyrus AI",
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Badge(containerColor = MaterialTheme.colorScheme.tertiaryContainer) {
                                        Text(
                                            text = "OS",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onTertiaryContainer,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                            },
                            actions = {
                                // Easy role switcher in the toolbar
                                Button(
                                    onClick = {
                                        val nextRole = if (activeRole == "Professional") "Patient" else "Professional"
                                        viewModel.switchRole(nextRole)
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                        contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                    ),
                                    modifier = Modifier.testTag("role_switch_button").height(38.dp)
                                ) {
                                    Icon(
                                        imageVector = if (activeRole == "Professional") Icons.Default.SupervisorAccount else Icons.Default.Mood,
                                        contentDescription = "Role Mode Icon",
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = activeRole, fontSize = 11.sp)
                                }

                                IconButton(
                                    onClick = { viewModel.toggleBiometric() },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LockOpen,
                                        contentDescription = "Lock Device",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.background
                            )
                        )
                    },
                    bottomBar = {
                        PsyPyrusBottomBar(
                            activeRole = activeRole,
                            currentScreen = currentScreen,
                            onScreenSelected = { viewModel.navigate(it) }
                        )
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        ActiveScreenContent(currentScreen, viewModel)
                    }
                }
            }
        }
    }
}

@Composable
fun ActiveScreenContent(screen: String, viewModel: PsyPyrusViewModel) {
    AnimatedContent(
        targetState = screen,
        transitionSpec = {
            fadeIn(animationSpec = tween(220)) togetherWith fadeOut(animationSpec = tween(90))
        },
        label = "ScreenTransition"
    ) { activeScreen ->
        when (activeScreen) {
            "Dashboard" -> DashboardScreen(viewModel)
            "AI Copilot" -> AiCopilotScreen(viewModel)
            "Digital MSE" -> DigitalMseScreen(viewModel)
            "Diagnostics" -> DiagnosticsScreen(viewModel)
            "Teletherapy" -> TeletherapyScreen(viewModel)
            "Planner" -> TreatmentPlannerScreen(viewModel)
            "Assessments" -> AssessmentsScreen(viewModel)
            "Wellness" -> WellnessScreen(viewModel)
            "Analytics" -> AnalyticsScreen(viewModel)
            "HIPAA Shield" -> SecurityScreen(viewModel)
            else -> DashboardScreen(viewModel)
        }
    }
}

// Custom Navigation Rail for Tablets
@Composable
fun PsyPyrusNavRail(
    activeRole: String,
    currentScreen: String,
    onScreenSelected: (String) -> Unit,
    onSwitchRole: (String) -> Unit,
    onToggleBiometric: () -> Unit
) {
    NavigationRail(
        containerColor = MaterialTheme.colorScheme.surface,
        header = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(vertical = 12.dp)) {
                Icon(
                    imageVector = Icons.Default.Healing,
                    contentDescription = "PsyPyrus Logo",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(36.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text("PsyPyrus", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("AI OS v1", fontSize = 10.sp, color = MaterialTheme.colorScheme.primary)
            }
        }
    ) {
        val navItems = getNavItems(activeRole)
        Column(
            modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            navItems.forEach { item ->
                NavigationRailItem(
                    selected = currentScreen == item.label,
                    onClick = { onScreenSelected(item.label) },
                    icon = { Icon(imageVector = item.icon, contentDescription = item.label) },
                    label = { Text(item.label, fontSize = 9.sp) },
                    alwaysShowLabel = false
                )
            }
        }

        VerticalDivider(modifier = Modifier.height(20.dp))

        // Rail Bottom Controls
        IconButton(
            onClick = {
                val nextRole = if (activeRole == "Professional") "Patient" else "Professional"
                onSwitchRole(nextRole)
            },
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                imageVector = if (activeRole == "Professional") Icons.Default.VerifiedUser else Icons.Default.AccountCircle,
                contentDescription = "Switch Mode",
                tint = MaterialTheme.colorScheme.secondary
            )
        }

        IconButton(onClick = onToggleBiometric, modifier = Modifier.size(48.dp)) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = "Fingerprint Screen",
                tint = MaterialTheme.colorScheme.primary
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
    }
}

@Composable
fun PsyPyrusBottomBar(
    activeRole: String,
    currentScreen: String,
    onScreenSelected: (String) -> Unit
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp,
        modifier = Modifier.height(72.dp)
    ) {
        val navItems = getNavItems(activeRole)
        navItems.forEach { item ->
            val isSelected = currentScreen == item.label
            NavigationBarItem(
                selected = isSelected,
                onClick = { onScreenSelected(item.label) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = { Text(item.label, fontSize = 9.sp, fontWeight = FontWeight.Medium) },
                alwaysShowLabel = false,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    }
}

data class NavItem(val label: String, val icon: ImageVector)

private fun getNavItems(role: String): List<NavItem> {
    return if (role == "Professional") {
        listOf(
            NavItem("Dashboard", Icons.Default.Dashboard),
            NavItem("AI Copilot", Icons.Default.AutoAwesome),
            NavItem("Digital MSE", Icons.Default.Assignment),
            NavItem("Diagnostics", Icons.Default.Troubleshoot),
            NavItem("Teletherapy", Icons.Default.Videocam),
            NavItem("Planner", Icons.Default.CalendarMonth),
            NavItem("Assessments", Icons.Default.Grading),
            NavItem("Analytics", Icons.Default.Analytics),
            NavItem("HIPAA Shield", Icons.Default.Security)
        )
    } else {
        listOf(
            NavItem("Dashboard", Icons.Default.Mood),
            NavItem("Wellness", Icons.Default.SelfImprovement),
            NavItem("Assessments", Icons.Default.Grading),
            NavItem("Teletherapy", Icons.Default.Videocam),
            NavItem("HIPAA Shield", Icons.Default.Security)
        )
    }
}

// --- BIOMETRIC SECURITY LOCK SCREEN ---
@Composable
fun BiometricLockScreen(onVerify: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().background(
            Brush.verticalGradient(
                colors = listOf(DarkCharcoalBg, Color(0xFF020617))
            )
        ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp).fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Default.EnhancedEncryption,
                contentDescription = "HIPAA E2E Encrypted Shield",
                tint = TealSecondary,
                modifier = Modifier.size(80.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "PsyPyrus AI OS",
                fontSize = 28.sp,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Text(
                "HIPAA and GDPR Cryptographic Workspace",
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.6f),
                modifier = Modifier.padding(top = 4.dp)
            )
            Spacer(modifier = Modifier.height(48.dp))
            Surface(
                modifier = Modifier.size(100.dp).clickable { onVerify() }.testTag("fingerprint_verify_button"),
                shape = CircleShape,
                color = TealSecondary.copy(alpha = 0.15f),
                border = BorderStroke(2.dp, TealSecondary)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Fingerprint,
                        contentDescription = "Authenticate Session",
                        modifier = Modifier.size(54.dp),
                        tint = TealSecondary
                    )
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "Tap standard scanner node to verify session credentials.",
                textAlign = TextAlign.Center,
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.8f),
                modifier = Modifier.padding(horizontal = 24.dp)
            )
            Spacer(modifier = Modifier.height(40.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Https,
                        contentDescription = "Shield Guard",
                        tint = GoldAccent,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "AES-GCM-256 local health vault initialized.",
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.7f),
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

// --- WIDGET COMPONENTS: APP BAR & CLINICAL CARDS ---
@Composable
fun SectionHeader(title: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

// --- A. PRACTICE MANAGEMENT DASHBOARD ---
@Composable
fun DashboardScreen(viewModel: PsyPyrusViewModel) {
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val appointments by viewModel.appointments.collectAsStateWithLifecycle()
    val scoreList by viewModel.allScores.collectAsStateWithLifecycle()
    val homeworkTasks by viewModel.activePatientHomework.collectAsStateWithLifecycle()

    var showAddApptDialog by remember { mutableStateOf(false) }
    var selectedPatForAppt by remember { mutableStateOf<Patient?>(null) }
    var apptTime by remember { mutableStateOf("Today, 04:00 PM") }
    var apptNotes by remember { mutableStateOf("Periodic diagnostic restructurings.") }
    var isApptVideo by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("dashboard_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = if (activeRole == "Professional") "Clinical Suite Dashboard" else "Wellness Hub Dashboard",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (activeRole == "Professional") "Dr. Katherine Brewster" else "Patient Access Node",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (activeRole == "Professional")
                            "Secure mental health operating environment. Under HIPAA regulations."
                        else
                            "Track details, practice mindfulness breathing and schedule sessions.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
            }
        }

        if (activeRole == "Professional") {
            // RISK ALERTS SECTION (Professional Role)
            val severePatients = patients.filter { it.riskStatus == "Severe" || it.riskStatus == "Moderate" }
            if (severePatients.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SoftRed.copy(alpha = 0.1f)),
                        border = BorderStroke(1.dp, SoftRed)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = "Severe Alert",
                                    tint = SoftRed,
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "URGENT RISK ALERTS (${severePatients.size})",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = SoftRed
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            severePatients.forEach { pat ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(pat.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("Flagged Risk: ${pat.riskStatus} | Clinical: ${pat.specialty}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                    }
                                    Button(
                                        onClick = {
                                            viewModel.setSelectedPatient(pat.id)
                                            viewModel.navigate("AI Copilot")
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = SoftRed),
                                        contentPadding = PaddingValues(horizontal = 12.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text("Review AI", fontSize = 11.sp, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // REVENUE & STATS PORTLET
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("ACTIVE FILE CASES", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Text("${patients.size}", fontSize = 28.sp, fontWeight = FontWeight.Black)
                            Text("Compliant records in SQLite", fontSize = 9.sp, color = Color.Gray)
                        }
                    }
                    Card(modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("SNAPSHOT REVENUE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TealSecondary)
                            val totalFee = appointments.filter { it.status == "Completed" }.sumOf { it.fee } + (appointments.filter { it.status == "Scheduled" }.sumOf { it.fee } * 0.7)
                            Text("$${totalFee.toInt()}", fontSize = 28.sp, fontWeight = FontWeight.Black)
                            Text("Billed & Pending contracts", fontSize = 9.sp, color = Color.Gray)
                        }
                    }
                }
            }

            // APPOINTMENTS LIST PANEL
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Today's Practice Appointments", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    IconButton(onClick = {
                        if (patients.isNotEmpty()) {
                            selectedPatForAppt = patients.first()
                            showAddApptDialog = true
                        }
                    }) {
                        Icon(imageVector = Icons.Default.AddCircle, contentDescription = "Schedule Appt", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            val scheduled = appointments.filter { it.status == "Scheduled" }
            if (scheduled.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                        Text("No further appointments scheduled.", color = Color.Gray)
                    }
                }
            } else {
                items(scheduled) { appt ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(appt.patientName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    if (appt.isVideo) {
                                        Badge(containerColor = MaterialTheme.colorScheme.secondaryContainer) {
                                            Text("Video", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                        }
                                    }
                                }
                                Text("Time: ${appt.dateTime} | Fee Case: $${appt.fee}", fontSize = 12.sp, color = Color.Gray)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(appt.notes, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f))
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(horizontalAlignment = Alignment.End) {
                                Button(
                                    onClick = {
                                        viewModel.setSelectedPatient(appt.patientId)
                                        viewModel.conductAppointment(appt.id, "Completed")
                                        if (appt.isVideo) viewModel.navigate("Teletherapy") else viewModel.navigate("AI Copilot")
                                    },
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Text("Start", fontSize = 11.sp)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                TextButton(
                                    onClick = { viewModel.deleteAppointment(appt.id) },
                                    modifier = Modifier.height(28.dp),
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text("Cancel", fontSize = 11.sp, color = SoftRed)
                                }
                            }
                        }
                    }
                }
            }

            // CLINICAL RECOMMENDATIONS PORTER
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = "Stars", tint = TealSecondary, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("AI CLINICAL PRACTICE SUGGESTIONS", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("• GAD-7 Anxiety scores for Sarah Jenkins improved by 40% over the last fortnight. Consider dropping cognitive restructuring pacing schedule in next session.", fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("• Liam Carter (Severe MDD risk) completed his sleep diary. Initial sleep latency latency remains high at 90 minutes. AI Suggests adding sleep hygiene instruction protocols.", fontSize = 12.sp)
                    }
                }
            }

        } else {
            // PATIENT ROLE VIEW
            item {
                Text("Your Secure Care Coordination", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
            }

            val clientAppts = appointments.filter { it.status == "Scheduled" }
            if (clientAppts.isNotEmpty()) {
                items(clientAppts) { appt ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        border = BorderStroke(1.dp, TealSecondary.copy(alpha = 0.5f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Therapy Session: Dr. Brewster", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Badge(containerColor = TealSecondary) {
                                    Text("JOIN ROOM", fontSize = 9.sp, color = Color.White, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                }
                            }
                            Text("Scheduled: ${appt.dateTime}", fontSize = 12.sp, color = Color.Gray)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Session focus: ${appt.notes}", fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = {
                                    viewModel.navigate("Teletherapy")
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.Videocam, contentDescription = "Enter Video Chat")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Launch Video Telehealth Link")
                            }
                        }
                    }
                }
            } else {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("No pending coordinates.", color = Color.Gray)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = { viewModel.navigate("Teletherapy") }) {
                                Text("Browse Available Providers")
                            }
                        }
                    }
                }
            }

            // DYNAMIC BIO-BEHAVIORAL HOMEWORK
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("DAILY CLINICAL HOMEWORK ASSIGNMENTS", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        if (homeworkTasks.isEmpty()) {
                            Text("No active homework tasks assigned by Dr. Brewster. Focus on mindfulness and breathing exercises.", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(vertical = 8.dp))
                        } else {
                            homeworkTasks.forEach { task ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth().clickable { viewModel.toggleHomeworkStatus(task) }.padding(vertical = 4.dp)
                                ) {
                                    Checkbox(
                                        checked = task.isCompleted,
                                        onCheckedChange = { viewModel.toggleHomeworkStatus(task) },
                                        modifier = Modifier.testTag("homework_checkbox_${task.id}")
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = task.description,
                                        fontSize = 13.sp,
                                        textDecoration = if (task.isCompleted) androidx.compose.ui.text.style.TextDecoration.LineThrough else androidx.compose.ui.text.style.TextDecoration.None,
                                        color = if (task.isCompleted) Color.Gray else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ADD APPOINTMENT DIALOG
    if (showAddApptDialog && selectedPatForAppt != null) {
        AlertDialog(
            onDismissRequest = { showAddApptDialog = false },
            title = { Text("Schedule EHR Appointment") },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Select Patient Target:")
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        patients.forEach { pat ->
                            val isSelected = pat.id == selectedPatForAppt?.id
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedPatForAppt = pat },
                                label = { Text(pat.name) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = apptTime,
                        onValueChange = { apptTime = it },
                        label = { Text("Appointment Date & Time") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = apptNotes,
                        onValueChange = { apptNotes = it },
                        label = { Text("Therapy Notes Agenda") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Connect as Video Call:")
                        Switch(checked = isApptVideo, onCheckedChange = { isApptVideo = it })
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.addAppointment(
                        patientId = selectedPatForAppt!!.id,
                        patientName = selectedPatForAppt!!.name,
                        dateTime = apptTime,
                        notes = apptNotes,
                        isVideo = isApptVideo,
                        fee = 150.0
                    )
                    showAddApptDialog = false
                }) {
                    Text("Insert Schedule")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddApptDialog = false }) {
                    Text("Dismiss")
                }
            }
        )
    }
}

// --- B. AI CLINICAL COPILOT ---
@Composable
fun AiCopilotScreen(viewModel: PsyPyrusViewModel) {
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val selectedId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()

    val activePatient = patients.firstOrNull { it.id == selectedId } ?: patients.firstOrNull()

    var textInputState by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("ai_copilot_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("AI Clinical SOAP Copilot", Icons.Default.AutoAwesome)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Active Chart Subject Target:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        patients.forEach { patient ->
                            val isSel = patient.id == activePatient?.id
                            FilterChip(
                                selected = isSel,
                                onClick = { viewModel.setSelectedPatient(patient.id) },
                                label = { Text(patient.name) }
                            )
                        }
                    }
                }
            }
        }

        item {
            Text(
                "Clinical Speech Dictation / Session Transcript Draft:",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }

        item {
            OutlinedTextField(
                value = textInputState,
                onValueChange = { textInputState = it },
                placeholder = {
                    Text(
                        "Paste raw transcription text from therapy, or type clinical draft. Ask AI to formulate medical SOAP documents..."
                    )
                },
                modifier = Modifier.fillMaxWidth().height(160.dp).testTag("copilot_transcription_input"),
                shape = RoundedCornerShape(12.dp)
            )
        }

        // Action Quick Templates
        item {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        textInputState = "Patient reports worsening anxiety symptoms over the past 3 weeks, linked to increased corporate stressors. Describes sleep onset latency (~90 mins) and somatic signs including epigastric tightness, muscle scanning tension, and mild palpitations."
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant, contentColor = MaterialTheme.colorScheme.onSurfaceVariant),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text("Sample Anxiety Case", fontSize = 11.sp)
                }

                Button(
                    onClick = {
                        textInputState = "Presented with recurrent low mood throughout the day. Slept 10 hours but complains of feeling fully unrefreshed, reports complete lock on feelings, feels like can't continue doing things. Thoughts of escape but has a good family core."
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant, contentColor = MaterialTheme.colorScheme.onSurfaceVariant),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text("Sample Depression Case", fontSize = 11.sp)
                }
            }
        }

        item {
            Button(
                onClick = {
                    if (activePatient != null && textInputState.isNotEmpty()) {
                        viewModel.triggerAiSoapNote(textInputState, activePatient.id)
                    }
                },
                modifier = Modifier.fillMaxWidth().testTag("generate_soap_button").height(48.dp),
                enabled = !isAiLoading && textInputState.isNotEmpty()
            ) {
                if (isAiLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                } else {
                    Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = "Sparkle")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Compile Compliant SOAP Note")
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.error)
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.PrivacyTip, contentDescription = "Compliance Disclaimer", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "AI provides decision support only. Final clinical judgment remains with the licensed practitioner.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }

        if (aiResultText.isNotEmpty()) {
            item {
                Text("PsyPyrus AI Compiled Report Document:", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            }
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SelectionContainer {
                            Text(
                                text = aiResultText,
                                fontSize = 13.sp,
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 19.sp,
                                modifier = Modifier.fillMaxWidth().testTag("ai_result_output")
                            )
                        }
                    }
                }
            }
        }
    }
}

// --- C. DIGITAL MSE MODULE ---
@Composable
fun DigitalMseScreen(viewModel: PsyPyrusViewModel) {
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val selectedId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()

    val activePatient = patients.firstOrNull { it.id == selectedId } ?: patients.firstOrNull()

    // MSE State selections
    var appearanceState by remember { mutableStateOf("Well-groomed, appropriate attire") }
    var behaviorState by remember { mutableStateOf("Cooperative, normal motor activity") }
    var speechState by remember { mutableStateOf("Normative rate, volume and responsive tone") }
    var moodState by remember { mutableStateOf("Anxious, restricted affect range") }
    var attentionState by remember { mutableStateOf("Stable attention, focused") }
    var insightRating by remember { mutableStateOf(4f) } // Grade 1 to 6
    var judgmentState by remember { mutableStateOf("Socially sound, personal choices appropriate") }
    var commentsState by remember { mutableStateOf("Anxiety somatic traits visible in foot tap.") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("digital_mse_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Digital Mental Status Examination", Icons.Default.Assignment)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Patient Records Selector:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        patients.forEach { p ->
                            FilterChip(
                                selected = p.id == activePatient?.id,
                                onClick = { viewModel.setSelectedPatient(p.id) },
                                label = { Text(p.name) }
                            )
                        }
                    }
                }
            }
        }

        // Structured selectors
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                MseRadioGroup("1. Appearance & Hygiene", appearanceState, listOf(
                    "Well-groomed, appropriate attire",
                    "Disheveled, poor hygiene",
                    "Posture tense, hyper-vigilant"
                )) { appearanceState = it }

                MseRadioGroup("2. Motor Activity & Behavior", behaviorState, listOf(
                    "Cooperative, normal motor activity",
                    "Psychomotor agitation (restless / tapping)",
                    "Guarded, uncooperative"
                )) { behaviorState = it }

                MseRadioGroup("3. Speech Characteristics", speechState, listOf(
                    "Normative rate, volume and responsive tone",
                    "Pressured, rapid rate, loud volume",
                    "Incoherent, slow, hesitant"
                )) { speechState = it }

                MseRadioGroup("4. Mood & Affect Quality", moodState, listOf(
                    "Anxious, restricted affect range",
                    "Depressed mood, flat affect",
                    "Euthymic, congruent affect"
                )) { moodState = it }

                MseRadioGroup("5. Thought Content & Stream", attentionState, listOf(
                    "Stable attention, focused",
                    "Flight of ideas, delusional traits",
                    "Distractible attention, tangential"
                )) { attentionState = it }

                // Insight Grade
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("6. Patient Insight (Grade 1 - 6)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(
                            "Grade ${insightRating.toInt()}: " + when(insightRating.toInt()) {
                                1 -> "Complete denial of illness."
                                2 -> "Slight awareness but denying."
                                3 -> "Awareness but blaming external factors."
                                4 -> "Intellectual awareness (knows he is ill but no changes)."
                                5 -> "True intellectual insight."
                                else -> "True emotional insight with deep somatic action."
                            },
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                        Slider(
                            value = insightRating,
                            onValueChange = { insightRating = it },
                            valueRange = 1f..6f,
                            steps = 4,
                            modifier = Modifier.testTag("insight_slider")
                        )
                    }
                }

                MseRadioGroup("7. Judgment Appraisal", judgmentState, listOf(
                    "Socially sound, personal choices appropriate",
                    "Impaired social, poor risk evaluation",
                    "Intact test judgment capacity"
                )) { judgmentState = it }

                OutlinedTextField(
                    value = commentsState,
                    onValueChange = { commentsState = it },
                    label = { Text("Descriptive comments / perceived anomalies") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        item {
            Button(
                onClick = {
                    if (activePatient != null) {
                        viewModel.triggerAiMseNarrative(
                            patientId = activePatient.id,
                            appearance = appearanceState,
                            behavior = behaviorState,
                            speech = speechState,
                            mood = moodState,
                            attention = attentionState,
                            insight = insightRating.toInt(),
                            judgment = judgmentState,
                            notes = commentsState
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth().testTag("compile_mse_button").height(48.dp),
                enabled = !isAiLoading
            ) {
                if (isAiLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                } else {
                    Icon(imageVector = Icons.Default.Transform, contentDescription = "Build prose")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("AI-Assist: Synthesize Prose Narrative")
                }
            }
        }

        if (aiResultText.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Synthesized Examination Block:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(aiResultText, fontSize = 13.sp, lineHeight = 20.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun MseRadioGroup(title: String, selected: String, options: List<String>, onSelected: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(8.dp))
            options.forEach { opt ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().clickable { onSelected(opt) }.padding(vertical = 4.dp)
                ) {
                    RadioButton(selected = opt == selected, onClick = { onSelected(opt) }, modifier = Modifier.size(48.dp))
                    Text(opt, fontSize = 12.sp, modifier = Modifier.padding(start = 4.dp))
                }
            }
        }
    }
}

// --- D. DIAGNOSTIC ASSISTANT ---
@Composable
fun DiagnosticsScreen(viewModel: PsyPyrusViewModel) {
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()
    val localDiagnosticResults by viewModel.localDiagnosticResults.collectAsStateWithLifecycle()
    val clinicalTrials by viewModel.clinicalTrials.collectAsStateWithLifecycle()
    val isTrialsLoading by viewModel.isTrialsLoading.collectAsStateWithLifecycle()
    val activePatientId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val activePatient = patients.firstOrNull { it.id == activePatientId }

    var evaluationMode by remember { mutableStateOf("DSM-5") } // "DSM-5" or "Mock"

    // --- MOCK DISORDER STATES ---
    val basicCriteriaList = listOf(
        "Above 18",
        "Above 21",
        "1 year",
        "6 months",
        "Not attributable to Physiological conditions",
        "Not better explained by other Physiological conditions"
    )
    val mockSymptomsList = listOf(
        "PDss1", "PDss2", "PDss3", "PDss4", "PDss5", "PDss6",
        "CDss1", "CDss2",
        "HDss1", "HDss2", "HDss3", "HDss4", "HDss5", "HDss6"
    )
    
    val selectedBasicCriteria = remember { mutableStateListOf<String>() }
    val selectedMockSymptoms = remember { mutableStateListOf<String>() }

    // --- DSM-5 STATES ---
    val mddSymptomsMap = listOf(
        "depressed_mood" to "Depressed mood / sadness",
        "anhedonia" to "Loss of interest or pleasure (Anhedonia)",
        "appetite_change" to "Weight or appetite change",
        "insomnia" to "Insomnia or hypersomnia",
        "psychomotor" to "Psychomotor agitation or retardation",
        "fatigue" to "Fatigue or loss of energy",
        "worthlessness" to "Feelings of worthlessness or guilt",
        "concentration_difficulty" to "Concentration difficulty or indecisiveness",
        "suicidal_ideation" to "Thoughts of death or suicidal ideation"
    )
    val gadSymptomsMap = listOf(
        "excessive_anxiety" to "Excessive anxiety / worry (more days than not)",
        "restlessness" to "Restlessness or feeling keyed up/on edge",
        "fatigue" to "Being easily fatigued",
        "concentration_difficulty" to "Difficulty concentrating or mind going blank",
        "irritability" to "Irritability",
        "muscle_tension" to "Muscle tension",
        "sleep_disturbance" to "Sleep disturbance"
    )
    val exclusionsMap = listOf(
        "No physiological substance attribution" to "Not attributable to substance physiological effects",
        "No medical condition attribution" to "Not attributable to other medical conditions",
        "No manic/hypomanic history" to "No history of manic/hypomanic episodes"
    )

    val selectedMddSymptoms = remember { mutableStateListOf<String>() }
    val selectedGadSymptoms = remember { mutableStateListOf<String>() }
    val selectedExclusions = remember { mutableStateListOf<String>() }
    var durationWeeks by remember { mutableStateOf(12f) }

    // Text inputs for clinical context
    var symptomsTextSummary by remember { mutableStateOf("") }
    var mseFindingsSummary by remember { mutableStateOf("Cooperative, slightly tense posture, restricted affect.") }

    // Sync symptoms text summary based on selections
    LaunchedEffect(evaluationMode, selectedBasicCriteria.size, selectedMockSymptoms.size, selectedMddSymptoms.size, selectedGadSymptoms.size, durationWeeks, selectedExclusions.size) {
        if (evaluationMode == "Mock") {
            viewModel.runLocalMockDiagnostics(selectedBasicCriteria.toList(), selectedMockSymptoms.toList())
            symptomsTextSummary = "Mock Evaluation Mode:\nBasic Criteria met: ${selectedBasicCriteria.joinToString(", ")}\nSpecific symptoms: ${selectedMockSymptoms.joinToString(", ")}"
        } else {
            viewModel.runLocalDsm5Diagnostics(
                mddSymptoms = selectedMddSymptoms.toList(),
                gadSymptoms = selectedGadSymptoms.toList(),
                durationWeeks = durationWeeks.toInt(),
                exclusions = selectedExclusions.toList()
            )
            val mddNames = selectedMddSymptoms.map { sym -> mddSymptomsMap.firstOrNull { it.first == sym }?.second ?: sym }
            val gadNames = selectedGadSymptoms.map { sym -> gadSymptomsMap.firstOrNull { it.first == sym }?.second ?: sym }
            symptomsTextSummary = "DSM-5-TR Evaluation Mode:\nMDD Indicators: ${mddNames.joinToString(", ")}\nGAD Indicators: ${gadNames.joinToString(", ")}\nExclusions: ${selectedExclusions.joinToString(", ")}\nDuration: ${durationWeeks.toInt()} weeks."
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("diagnostics_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("DSM-5-TR & ICD-10 Differential Diagnostician", Icons.Default.Troubleshoot)
        }

        // Mode Switcher Card
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Select Diagnostic Engine Mode:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = { evaluationMode = "DSM-5" },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (evaluationMode == "DSM-5") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer,
                                contentColor = if (evaluationMode == "DSM-5") MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSecondaryContainer
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("DSM-5-TR / ICD-10")
                        }
                        Button(
                            onClick = { evaluationMode = "Mock" },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (evaluationMode == "Mock") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer,
                                contentColor = if (evaluationMode == "Mock") MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSecondaryContainer
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Conceptual / Mock")
                        }
                    }
                }
            }
        }

        // Active Mode Checklist
        if (evaluationMode == "Mock") {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Mock Basic Criteria Checklist:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        basicCriteriaList.forEach { criterion ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth().clickable {
                                    if (criterion in selectedBasicCriteria) selectedBasicCriteria.remove(criterion) else selectedBasicCriteria.add(criterion)
                                }
                            ) {
                                Checkbox(
                                    checked = criterion in selectedBasicCriteria,
                                    onCheckedChange = {
                                        if (criterion in selectedBasicCriteria) selectedBasicCriteria.remove(criterion) else selectedBasicCriteria.add(criterion)
                                    }
                                )
                                Text(criterion, fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Mock Specific Symptoms Checklist:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Render symptoms in a grid-like flow
                        val chunks = mockSymptomsList.chunked(3)
                        chunks.forEach { chunk ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                chunk.forEach { sym ->
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f).clickable {
                                            if (sym in selectedMockSymptoms) selectedMockSymptoms.remove(sym) else selectedMockSymptoms.add(sym)
                                        }
                                    ) {
                                        Checkbox(
                                            checked = sym in selectedMockSymptoms,
                                            onCheckedChange = {
                                                if (sym in selectedMockSymptoms) selectedMockSymptoms.remove(sym) else selectedMockSymptoms.add(sym)
                                            }
                                        )
                                        Text(sym, fontSize = 11.sp)
                                    }
                                }
                                // Fill empty weights if chunk is not complete
                                if (chunk.size < 3) {
                                    repeat(3 - chunk.size) {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // DSM-5 Checklists
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("1. Major Depressive Disorder (MDD) Checklist:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(6.dp))
                        mddSymptomsMap.forEach { (code, name) ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth().clickable {
                                    if (code in selectedMddSymptoms) selectedMddSymptoms.remove(code) else selectedMddSymptoms.add(code)
                                }
                            ) {
                                Checkbox(
                                    checked = code in selectedMddSymptoms,
                                    onCheckedChange = {
                                        if (code in selectedMddSymptoms) selectedMddSymptoms.remove(code) else selectedMddSymptoms.add(code)
                                    }
                                )
                                Text(name, fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text("2. Generalized Anxiety Disorder (GAD) Checklist:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(6.dp))
                        gadSymptomsMap.forEach { (code, name) ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth().clickable {
                                    if (code in selectedGadSymptoms) selectedGadSymptoms.remove(code) else selectedGadSymptoms.add(code)
                                }
                            ) {
                                Checkbox(
                                    checked = code in selectedGadSymptoms,
                                    onCheckedChange = {
                                        if (code in selectedGadSymptoms) selectedGadSymptoms.remove(code) else selectedGadSymptoms.add(code)
                                    }
                                )
                                Text(name, fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text("3. Duration & Exclusion Protocols:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text("Symptom Duration: ${durationWeeks.toInt()} weeks", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Slider(
                            value = durationWeeks,
                            onValueChange = { durationWeeks = it },
                            valueRange = 0f..52f,
                            steps = 52,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        exclusionsMap.forEach { (code, name) ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth().clickable {
                                    if (code in selectedExclusions) selectedExclusions.remove(code) else selectedExclusions.add(code)
                                }
                            ) {
                                Checkbox(
                                    checked = code in selectedExclusions,
                                    onCheckedChange = {
                                        if (code in selectedExclusions) selectedExclusions.remove(code) else selectedExclusions.add(code)
                                    }
                                )
                                Text(name, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        // Real-Time Local Engine Diagnostic Outcomes
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.2f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.tertiary.copy(alpha = 0.5f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Search, contentDescription = "Trials", tint = MaterialTheme.colorScheme.tertiary)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Live ClinicalTrials.gov Finder", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.tertiary)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Query active, recruiting human trials from ClinicalTrials.gov matching the active subject's diagnostic profile: ${activePatient?.specialty ?: "None"}.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { viewModel.fetchClinicalTrialsForActivePatient() },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                        modifier = Modifier.fillMaxWidth().testTag("find_trials_button"),
                        enabled = !isTrialsLoading
                    ) {
                        if (isTrialsLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                        } else {
                            Text("Query Active Recruiting Trials")
                        }
                    }

                    if (clinicalTrials.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(8.dp))
                        clinicalTrials.forEach { trial ->
                            Column(modifier = Modifier.padding(vertical = 6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(trial.nctId, fontWeight = FontWeight.Black, fontSize = 11.sp, color = MaterialTheme.colorScheme.tertiary)
                                    Badge(containerColor = if (trial.status == "RECRUITING" || trial.status.contains("RECRUITING")) SoftGreen else MaterialTheme.colorScheme.surfaceVariant) {
                                        Text(trial.status, fontSize = 9.sp, color = Color.White)
                                    }
                                }
                                Text(trial.title, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(vertical = 2.dp))
                                Text("Conditions: ${trial.conditions}", fontSize = 11.sp, color = Color.Gray)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                }
            }
        }
    }
}


// --- E. TELETHERAPY CLIENT & SESSION ---
@Composable
fun TeletherapyScreen(viewModel: PsyPyrusViewModel) {
    var callActive by remember { mutableStateOf(false) }
    var micMuted by remember { mutableStateOf(false) }
    var recordingEnabled by remember { mutableStateOf(true) }
    var secureChatInput by remember { mutableStateOf("") }
    var chatList by remember { mutableStateOf(listOf(
        "Dr. Brewster: Hi Liam. Glad you joined. We'll check your GAD-7 metrics today.",
        "Liam: Yes, corporative stress was high this past week but practiced somatic breathing."
    )) }

    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("teletherapy_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Telehealth Secure Video & Voice Suite", Icons.Default.Videocam)
        }

        if (!callActive) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(imageVector = Icons.Default.Duo, contentDescription = "Camera", modifier = Modifier.size(72.dp), tint = TealSecondary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Active Telehealth Room: PSY-PYR-401", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("E2E encrypted room. Fully compliant.", fontSize = 12.sp, color = Color.Gray)
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                callActive = true
                                viewModel.logAudit("Initiated Video Session", "Video telehealth session locked for room PSY-PYR-401.")
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Text("Secure Connect Video Line")
                        }
                    }
                }
            }
        } else {
            // Interactive calling mock layout
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.Black),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Interactive Video grid
                        Row(
                            modifier = Modifier.fillMaxWidth().height(180.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Professional Avatar card
                            Box(
                                modifier = Modifier.weight(1f).fillMaxHeight().background(Color.DarkGray, RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Surface(shape = CircleShape, modifier = Modifier.size(60.dp), color = MaterialTheme.colorScheme.primary) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text("KB", color = Color.White, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Dr. Brewster (You)", color = Color.White, fontSize = 11.sp)
                                }
                            }

                            // Patient Box
                            Box(
                                modifier = Modifier.weight(1f).fillMaxHeight().background(Color.DarkGray, RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Surface(shape = CircleShape, modifier = Modifier.size(60.dp), color = TealSecondary) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text("LC", color = Color.White, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Liam Carter", color = Color.White, fontSize = 11.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    // Animated voice indicator
                                    VoiceWaveformAnimation()
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Controls
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(onClick = { micMuted = !micMuted }) {
                                Icon(
                                    imageVector = if (micMuted) Icons.Default.MicOff else Icons.Default.Mic,
                                    contentDescription = "Mic toggle",
                                    tint = if (micMuted) SoftRed else Color.White
                                )
                            }

                            IconButton(
                                onClick = { callActive = false },
                                modifier = Modifier.background(SoftRed, CircleShape).size(48.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CallEnd,
                                    contentDescription = "Hang Up",
                                    tint = Color.White
                                )
                            }

                            IconButton(onClick = { recordingEnabled = !recordingEnabled }) {
                                Icon(
                                    imageVector = if (recordingEnabled) Icons.Default.FiberManualRecord else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = "Record toggle",
                                    tint = if (recordingEnabled) SoftRed else Color.White
                                )
                            }
                        }
                    }
                }
            }

            // Chat & transcription core
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Secure Companion Chat Console", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(modifier = Modifier.height(120.dp).verticalScroll(rememberScrollState())) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                chatList.forEach { msg ->
                                    Text(msg, fontSize = 12.sp)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = secureChatInput,
                                onValueChange = { secureChatInput = it },
                                modifier = Modifier.weight(1f),
                                label = { Text("Secure text...") }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(onClick = {
                                if (secureChatInput.isNotEmpty()) {
                                    chatList = chatList + "Dr. Brewster: $secureChatInput"
                                    secureChatInput = ""
                                }
                            }, modifier = Modifier.size(48.dp)) {
                                Icon(imageVector = Icons.Default.Send, contentDescription = "Send secure", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            }

            item {
                Button(
                    onClick = {
                        val sessionData = chatList.joinToString("\n")
                        viewModel.triggerAiSoapNote(sessionData, 1L)
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    enabled = !isAiLoading
                ) {
                    Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = "Review Summaries")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Auto-Compile AI Meeting SOAP Note")
                }
            }

            if (aiResultText.isNotEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Automatic SOAP Summary Output:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(aiResultText, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VoiceWaveformAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "voiceWave")
    val scale1 by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(400, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "sig1"
    )
    val scale2 by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(350, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "sig2"
    )

    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.height(24.dp)
    ) {
        val voiceColor = TealSecondary
        Box(modifier = Modifier.width(3.dp).fillMaxHeight(scale1).background(voiceColor))
        Box(modifier = Modifier.width(3.dp).fillMaxHeight(scale2).background(voiceColor))
        Box(modifier = Modifier.width(3.dp).fillMaxHeight(scale1 * 0.8f).background(voiceColor))
        Box(modifier = Modifier.width(3.dp).fillMaxHeight(scale2 * 0.6f).background(voiceColor))
    }
}

// --- F. CARE PLANNER & TREATMENT ROADMAP ---
@Composable
fun TreatmentPlannerScreen(viewModel: PsyPyrusViewModel) {
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()
    val homeworkTasks by viewModel.activePatientHomework.collectAsStateWithLifecycle()

    var goalConfigTitle by remember { mutableStateOf("Improve sleep pacing routines / CBT-I") }
    var goalConfigDesc by remember { mutableStateOf("Complete daily abdominal breathing guides and sleep notebook.") }
    var newHomeworkDesc by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("planner_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("CBT Treatment Planner Core", Icons.Default.CalendarMonth)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Design SMART Therapy Goals:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = goalConfigTitle,
                        onValueChange = { goalConfigTitle = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Base Goals target") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = goalConfigDesc,
                        onValueChange = { goalConfigDesc = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Context & therapeutic notes") }
                    )
                }
            }
        }

        item {
            Button(
                onClick = {
                    val pHead = patients.firstOrNull()?.id ?: 1L
                    viewModel.triggerSmartTreatmentPlanner(goalConfigTitle, goalConfigDesc, pHead)
                },
                modifier = Modifier.fillMaxWidth().testTag("generate_plan_button").height(48.dp),
                enabled = !isAiLoading
            ) {
                if (isAiLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                } else {
                    Icon(imageVector = Icons.Default.ModelTraining, contentDescription = "Goals logo")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Auto-Formulate SMART Details")
                }
            }
        }

        if (aiResultText.isNotEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("AI Formulated Therapy Roadmap:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(aiResultText, fontSize = 12.sp, lineHeight = 18.sp)
                    }
                }
            }
        }

        // Clinician Homework Management Section
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Assign Homework Task for Active Subject:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = newHomeworkDesc,
                        onValueChange = { newHomeworkDesc = it },
                        modifier = Modifier.fillMaxWidth().testTag("add_homework_input"),
                        label = { Text("Homework description") },
                        placeholder = { Text("e.g. Complete sleep tracking, log anxiety triggers...") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            viewModel.addHomework(newHomeworkDesc)
                            newHomeworkDesc = ""
                        },
                        modifier = Modifier.align(Alignment.End).testTag("add_homework_button")
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = "Add Homework")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Assign Homework")
                    }
                }
            }
        }

        item {
            Text("Active Assigned Homework Checklist", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }

        if (homeworkTasks.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(60.dp), contentAlignment = Alignment.Center) {
                    Text("No homework tasks currently assigned.", color = Color.Gray, fontSize = 13.sp)
                }
            }
        } else {
            items(homeworkTasks) { task ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Checkbox(
                                checked = task.isCompleted,
                                onCheckedChange = { viewModel.toggleHomeworkStatus(task) },
                                modifier = Modifier.testTag("planner_homework_check_${task.id}")
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = task.description,
                                fontSize = 13.sp,
                                textDecoration = if (task.isCompleted) androidx.compose.ui.text.style.TextDecoration.LineThrough else androidx.compose.ui.text.style.TextDecoration.None,
                                color = if (task.isCompleted) Color.Gray else MaterialTheme.colorScheme.onSurface
                            )
                        }
                        IconButton(onClick = { viewModel.deleteHomework(task.id) }, modifier = Modifier.testTag("delete_homework_button_${task.id}")) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete Homework", tint = SoftRed)
                        }
                    }
                }
            }
        }
    }
}


// --- G. ASSESSMENTS LIBRARY & TRENDS ---
@Composable
fun AssessmentsScreen(viewModel: PsyPyrusViewModel) {
    var testSelection by remember { mutableStateOf("PHQ-9 (Depression)") }
    var runningScore by remember { mutableStateOf(0f) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("assessments_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Interactive Assessments Library", Icons.Default.Grading)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Select Assessment Standard:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("PHQ-9 (Depression)", "GAD-7 (Anxiety)", "DASS-21 Distress", "BDI Depression").forEach { item ->
                            val isChosen = testSelection == item
                            FilterChip(
                                selected = isChosen,
                                onClick = { testSelection = item; runningScore = 0f },
                                label = { Text(item) }
                            )
                        }
                    }
                }
            }
        }

        item {
            Text("Complete questionnaire below to generate immediate auto-scoring parameters:")
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(testSelection, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = MaterialTheme.colorScheme.primary)

                    AssessmentSliderItem("1. Little interest or pleasure in doing things?", 0f, 3f) { runningScore += it }
                    AssessmentSliderItem("2. Feeling down, depressed, or hopeless?", 0f, 3f) { runningScore += it }
                    AssessmentSliderItem("3. Trouble falling or staying asleep, or sleeping too much?", 0f, 3f) { runningScore += it }
                    AssessmentSliderItem("4. Feeling tired or having little energy?", 0f, 3f) { runningScore += it }
                }
            }
        }

        item {
            val sVal = runningScore.toInt()
            val textSeverity = when {
                sVal <= 4 -> "Minimal clinical traits"
                sVal <= 8 -> "Mild clinical levels"
                sVal <= 11 -> "Moderate clinical severity"
                else -> "Severe clinical conditions. Direct to professional review."
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (sVal > 8) SoftRed.copy(alpha = 0.1f) else SoftGreen.copy(alpha = 0.1f)
                ),
                border = BorderStroke(1.dp, if (sVal > 8) SoftRed else SoftGreen)
            ) {
                Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Auto-Scoring Evaluator", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("$sVal", fontSize = 48.sp, fontWeight = FontWeight.Black)
                    Text(textSeverity, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            viewModel.addAssessmentScore(
                                patientId = 1L,
                                type = testSelection.take(5).trim(),
                                score = sVal,
                                details = textSeverity
                            )
                        },
                        modifier = Modifier.testTag("save_assessment_button")
                    ) {
                        Text("Log Score to database")
                    }
                }
            }
        }
    }
}

@Composable
fun AssessmentSliderItem(question: String, min: Float, max: Float, onInteract: (Float) -> Unit) {
    var ratingVal by remember { mutableStateOf(0f) }
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(question, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Slider(
                value = ratingVal,
                onValueChange = {
                    onInteract(it - ratingVal)
                    ratingVal = it
                },
                valueRange = min..max,
                steps = 2,
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                when(ratingVal.toInt()) {
                    0 -> "Never"
                    1 -> "Several Days"
                    2 -> "More than half"
                    else -> "Nearly daily"
                },
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.width(80.dp)
            )
        }
    }
}

// --- H. PATIENT WELLNESS LOUNGE ---
@Composable
fun WellnessScreen(viewModel: PsyPyrusViewModel) {
    var timerRunning by remember { mutableStateOf(false) }
    var timerSeconds by remember { mutableStateOf(300) } // 5 mins

    // Breathing guide pacing variables
    var animateBreath by remember { mutableStateOf(false) }
    val scalingAnim by animateFloatAsState(
        targetValue = if (animateBreath) 1.5f else 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathScale"
    )

    var moodSliderState by remember { mutableStateOf(7f) }
    var gratitudeState by remember { mutableStateOf("Woke up early and finished my coffee peacefully.") }
    var statusPrompt by remember { mutableStateOf("Doing perfect. Focus on breathing.") }

    LaunchedEffect(timerRunning) {
        while (timerRunning && timerSeconds > 0) {
            delay(1000)
            timerSeconds--
        }
        if (timerSeconds == 0) {
            timerRunning = false
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("wellness_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Transpersonal Wellness Lounge", Icons.Default.SelfImprovement)
        }

        // BREATHE GUIDE
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Bio-Feedback Breath Restructuring (CBT)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(18.dp))

                    // Floating Circle Breathing Pacer
                    Box(
                        modifier = Modifier.shadow(12.dp, CircleShape).size(150.dp).clip(CircleShape).background(
                            Brush.verticalGradient(
                                colors = listOf(TealSecondary, IndigoPrimary)
                            )
                        ),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            modifier = Modifier.size(100.dp * scalingAnim).clip(CircleShape),
                            color = Color.White.copy(alpha = 0.2f)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = if (scalingAnim > 1.1f) "EXHALE" else "INHALE",
                                    fontWeight = FontWeight.Black,
                                    color = Color.White,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Synchronize with the scaling mandala. Box Breathing standard (4s - 4s - 4s).",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { animateBreath = !animateBreath }) {
                        Text(if (animateBreath) "Stop Guidance" else "Start Somatic Restructuring")
                    }
                }
            }
        }

        // TIMED MEDITATION TIMER
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Traditional Mindfulness Timer", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        val minsStr = String.format("%02d:%02d", timerSeconds / 60, timerSeconds % 60)
                        Text(minsStr, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                    }
                    Button(
                        onClick = { timerRunning = !timerRunning },
                        colors = ButtonDefaults.buttonColors(containerColor = if (timerRunning) SoftRed else MaterialTheme.colorScheme.primary)
                    ) {
                        Text(if (timerRunning) "Pause" else "Meditate")
                    }
                }
            }
        }

        // MOOD TRACK METRIC GRID
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Daily Wellness Register:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Evaluate Current Mood Score (1 - 10): ${moodSliderState.toInt()}", fontSize = 12.sp)
                    Slider(
                        value = moodSliderState,
                        onValueChange = { moodSliderState = it },
                        valueRange = 1f..10f,
                        steps = 8,
                        modifier = Modifier.testTag("mood_slider")
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = gratitudeState,
                        onValueChange = { gratitudeState = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("What are you grateful for today?") }
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            viewModel.addMoodLog(
                                score = moodSliderState.toInt(),
                                note = "Self-logged checklist entry.",
                                gratitude = gratitudeState,
                                breathingSec = if (animateBreath) 240 else 0
                            )
                            statusPrompt = "Logged entry successfully in local secure vault."
                        },
                        modifier = Modifier.fillMaxWidth().testTag("save_mood_button")
                    ) {
                        Text("Log Day Metrics")
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(statusPrompt, color = TealSecondary, fontSize = 11.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                }
            }
        }
    }
}

// --- I. CLINICAL ANALYTICS SCREEN WITH NATIVE CANVAS GRAPH ---
@Composable
fun AnalyticsScreen(viewModel: PsyPyrusViewModel) {
    val auditLogs by viewModel.auditLogs.collectAsStateWithLifecycle()
    val moodLogs by viewModel.moodLogs.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("analytics_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Clinical Case & Wellness Analytics", Icons.Default.Analytics)
        }

        item {
            Text("Interactive Multi-Day Behavioral Performance Analytics:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        // Custom canvas visualizer graph
        item {
            Card(
                modifier = Modifier.fillMaxWidth().height(220.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Daily Emotional Wellness Progress Grid (10-days scale)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Simple interactive canvas graph drawing the mood curve
                    Canvas(modifier = Modifier.fillMaxSize().weight(1f)) {
                        val width = size.width
                        val height = size.height

                        // Grid lines
                        val gridCount = 5
                        for (i in 0..gridCount) {
                            val y = (height / gridCount) * i
                            drawLine(
                                color = Color.LightGray.copy(alpha = 0.4f),
                                start = strokeRange(0f, y),
                                end = strokeRange(width, y),
                                strokeWidth = 1f
                            )
                        }

                        // Plotting points from actual mood logs in Room
                        val sortedLogs = moodLogs.take(8).reversed()
                        if (sortedLogs.size >= 2) {
                            val stepX = width / (sortedLogs.size - 1)
                            val path = Path()

                            sortedLogs.forEachIndexed { index, item ->
                                // mood score 1 to 10
                                val relativeY = height - ((item.moodScore / 10f) * height)
                                val x = stepX * index

                                if (index == 0) {
                                    path.moveTo(x, relativeY)
                                } else {
                                    path.lineTo(x, relativeY)
                                }

                                drawCircle(
                                    color = TealSecondary,
                                    radius = 6.dp.toPx(),
                                    center = strokeRange(x, relativeY)
                                )
                            }

                            drawPath(
                                path = path,
                                color = IndigoPrimary,
                                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                            )
                        } else {
                            // Draw fallback sine wellness curve
                            val path = Path()
                            val pointsCount = 40
                            for (i in 0..pointsCount) {
                                val x = (width / pointsCount) * i
                                val relativeY = (height / 2) + Math.sin(i * 0.4).toFloat() * (height / 3)
                                if (i == 0) path.moveTo(x, relativeY) else path.lineTo(x, relativeY)
                            }
                            drawPath(
                                path = path,
                                color = TealSecondary.copy(alpha = 0.5f),
                                style = Stroke(width = 2.dp.toPx())
                            )
                        }
                    }
                }
            }
        }

        item {
            Text("Registered Device HIPAA Logs Database:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        items(auditLogs.take(5)) { log ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(log.action, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                        val dates = SimpleDateFormat("dd-MM HH:mm", Locale.getDefault()).format(Date(log.timestamp))
                        Text(dates, fontSize = 9.sp, color = Color.Gray)
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(log.details, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f))
                }
            }
        }
    }
}

private fun strokeRange(x: Float, y: Float) = androidx.compose.ui.geometry.Offset(x, y)

// --- J. HIPAA SECURITY & AUDIT MODULE ---
@Composable
fun SecurityScreen(viewModel: PsyPyrusViewModel) {
    val auditLogs by viewModel.auditLogs.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("security_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("HIPAA Shield & Security Cryptography", Icons.Default.Security)
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = DarkCharcoalBg),
                border = BorderStroke(1.dp, GoldAccent)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("VAULT COMPLIANCE STATUS: VERIFIED", color = GoldAccent, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("• Local SQLite Core: Fully isolated with zero trace leaks.", color = Color.White, fontSize = 12.sp)
                    Text("• Gemini Security standards: Data processed through Enterprise private secure models.", color = Color.White, fontSize = 12.sp)
                    Text("• Biometric Hardware key: Active (AES-GCM encryption binds key state).", color = Color.White, fontSize = 12.sp)
                }
            }
        }

        // Live audit table
        item {
            Text("Real-Time HIPAA Compliance Database Access Logs:", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
        }

        items(auditLogs) { log ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Action: ${log.action}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                        val formattingStr = SimpleDateFormat("HH:mm:ss a (MM/dd)", Locale.getDefault()).format(Date(log.timestamp))
                        Text(formattingStr, fontSize = 9.sp, color = Color.Gray, fontFamily = FontFamily.Monospace)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Details: ${log.details}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f))
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Actor: ${log.actor}", fontSize = 10.sp, color = Color.Gray)
                        Text("Encryption: ${log.encryptionStandard}", fontSize = 10.sp, color = TealSecondary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
