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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import android.widget.Toast
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.StrokeJoin
import kotlin.math.roundToInt
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
    val loggedInUser by viewModel.loggedInUser.collectAsStateWithLifecycle()

    val configuration = LocalConfiguration.current
    val isWideScreen = configuration.screenWidthDp >= 600

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        if (loggedInUser == null) {
            LoginSignupScreen(viewModel = viewModel)
        } else if (!isBiometricVerified) {
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
                        onToggleBiometric = { viewModel.toggleBiometric() },
                        onLogout = { viewModel.logout() }
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

                                IconButton(
                                    onClick = { viewModel.logout() },
                                    modifier = Modifier.size(48.dp).testTag("topbar_logout_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ExitToApp,
                                        contentDescription = "Logout",
                                        tint = MaterialTheme.colorScheme.error
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
            "Match & Book" -> MatchAndBookScreen(viewModel)
            "AI Copilot" -> AiCopilotScreen(viewModel)
            "Digital MSE" -> DigitalMseScreen(viewModel)
            "Diagnostics" -> DiagnosticsScreen(viewModel)
            "Peer Support" -> PeerSupportScreen(viewModel)
            "Teletherapy" -> TeletherapyScreen(viewModel)
            "Planner" -> TreatmentPlannerScreen(viewModel)
            "Assessments" -> AssessmentsScreen(viewModel)
            "Wellness" -> WellnessScreen(viewModel)
            "Analytics" -> AnalyticsScreen(viewModel)
            "HIPAA Shield" -> SecurityScreen(viewModel)
            "Homework" -> HomeworkTrackerScreen(viewModel)
            "Medications" -> MedicationsScreen(viewModel)
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
    onToggleBiometric: () -> Unit,
    onLogout: () -> Unit
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

        IconButton(onClick = onLogout, modifier = Modifier.size(48.dp).testTag("rail_logout_button")) {
            Icon(
                imageVector = Icons.Default.ExitToApp,
                contentDescription = "Logout From System",
                tint = MaterialTheme.colorScheme.error
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
            NavItem("Match & Book", Icons.Default.SupervisorAccount),
            NavItem("AI Copilot", Icons.Default.AutoAwesome),
            NavItem("Digital MSE", Icons.Default.Assignment),
            NavItem("Diagnostics", Icons.Default.Troubleshoot),
            NavItem("Peer Support", Icons.Default.Groups),
            NavItem("Teletherapy", Icons.Default.Videocam),
            NavItem("Planner", Icons.Default.CalendarMonth),
            NavItem("Homework", Icons.Default.DoneAll),
            NavItem("Medications", Icons.Default.Healing),
            NavItem("Assessments", Icons.Default.Grading),
            NavItem("Analytics", Icons.Default.Analytics),
            NavItem("HIPAA Shield", Icons.Default.Security)
        )
    } else {
        listOf(
            NavItem("Dashboard", Icons.Default.Mood),
            NavItem("Match & Book", Icons.Default.SupervisorAccount),
            NavItem("Wellness", Icons.Default.SelfImprovement),
            NavItem("Peer Support", Icons.Default.Groups),
            NavItem("Homework", Icons.Default.DoneAll),
            NavItem("Medications", Icons.Default.Healing),
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

data class CrisisAlertInfo(
    val id: String,
    val patientId: Long,
    val patientName: String,
    val patientDiagnosis: String,
    val triggerType: String,
    val severity: String,
    val timestamp: Long,
    val details: String,
    val originalNote: String
)

// --- A. PRACTICE MANAGEMENT DASHBOARD ---
@Composable
fun DashboardScreen(viewModel: PsyPyrusViewModel) {
    val context = LocalContext.current
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()
    val loggedInUser by viewModel.loggedInUser.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val appointments by viewModel.appointments.collectAsStateWithLifecycle()
    val scoreList by viewModel.allScores.collectAsStateWithLifecycle()
    val allNotes by viewModel.allNotes.collectAsStateWithLifecycle()
    val allMedications by viewModel.allMedications.collectAsStateWithLifecycle()
    val allAdherenceLogs by viewModel.allAdherenceLogs.collectAsStateWithLifecycle()
    val moodLogs by viewModel.moodLogs.collectAsStateWithLifecycle()
    val dismissedAlertIds by viewModel.dismissedAlertIds.collectAsStateWithLifecycle()
    val aiCrisisGuidelines by viewModel.aiCrisisGuidelines.collectAsStateWithLifecycle()
    val isCrisisAiLoading by viewModel.isCrisisAiLoading.collectAsStateWithLifecycle()

    val activeAlerts = remember(patients, moodLogs, scoreList, dismissedAlertIds) {
        val list = mutableListOf<CrisisAlertInfo>()
        moodLogs.forEach { log ->
            val alertId = "mood_${log.id}"
            if (!dismissedAlertIds.contains(alertId)) {
                val patient = patients.find { it.id == log.patientId }
                val scoreCritical = log.moodScore <= 3
                val textCritical = log.moodNote.contains("CRISIS", ignoreCase = true) ||
                                   log.moodNote.contains("suicide", ignoreCase = true) ||
                                   log.moodNote.contains("panic", ignoreCase = true) ||
                                   log.moodNote.contains("hopeless", ignoreCase = true)
                
                if (scoreCritical || textCritical) {
                    list.add(
                        CrisisAlertInfo(
                            id = alertId,
                            patientId = log.patientId,
                            patientName = patient?.name ?: "System Demo Account",
                            patientDiagnosis = patient?.specialty ?: "Anxiety Spectrum Disorder",
                            triggerType = if (scoreCritical) "Acute Mood Collapse" else "Panic & Distress Spike Indicator",
                            severity = "CRITICAL LIMIT",
                            timestamp = log.date,
                            details = "Self-logged score: ${log.moodScore}/10. Patient context: ${log.moodNote}",
                            originalNote = log.moodNote
                        )
                    )
                }
            }
        }
        scoreList.forEach { scoreEntry ->
            val alertId = "score_${scoreEntry.id}"
            if (!dismissedAlertIds.contains(alertId)) {
                val isSevere = (scoreEntry.type == "GAD-7" && scoreEntry.score >= 15) || 
                               (scoreEntry.type == "PHQ-9" && scoreEntry.score >= 15)
                if (isSevere) {
                    val patient = patients.find { it.id == scoreEntry.patientId }
                    list.add(
                        CrisisAlertInfo(
                            id = alertId,
                            patientId = scoreEntry.patientId,
                            patientName = patient?.name ?: "Unknown Client",
                            patientDiagnosis = patient?.specialty ?: "Clinical Evaluation Required",
                            triggerType = "Severe Clinical Assessment Threshold Exceeded (${scoreEntry.type})",
                            severity = "SEVERITY SPIKE",
                            timestamp = scoreEntry.date,
                            details = "Assessment Score: ${scoreEntry.score}/21 (${scoreEntry.details})",
                            originalNote = scoreEntry.details
                        )
                    )
                }
            }
        }
        list.sortByDescending { it.timestamp }
        list
    }

    var showAddApptDialog by remember { mutableStateOf(false) }
    var selectedPatForAppt by remember { mutableStateOf<Patient?>(null) }
    var apptTime by remember { mutableStateOf("Today, 04:00 PM") }
    var apptNotes by remember { mutableStateOf("Periodic diagnostic restructurings.") }
    var isApptVideo by remember { mutableStateOf(true) }

    // Dashboard View Switcher State (0: Clients List, 1: Session Notes, 2: Reminders & Schedule)
    var activeSubTab by remember { mutableStateOf(0) }
    var clientSearchQuery by remember { mutableStateOf("") }
    var noteSearchQuery by remember { mutableStateOf("") }

    // Add Client Expanded State
    var showAddPatientForm by remember { mutableStateOf(false) }
    var newPatName by remember { mutableStateOf("") }
    var newPatAge by remember { mutableStateOf("") }
    var newPatGender by remember { mutableStateOf("Female") }
    var newPatEmail by remember { mutableStateOf("") }
    var newPatPhone by remember { mutableStateOf("") }
    var newPatSpecialty by remember { mutableStateOf("Generalized Anxiety Disorder") }
    var newPatRisk by remember { mutableStateOf("None") }

    val scratchpadNotes by viewModel.scratchpadNotes.collectAsStateWithLifecycle()
    var scratchNoteText by remember { mutableStateOf("") }
    var scratchNoteTag by remember { mutableStateOf("Clinical Thought") }
    var attachingScratchNoteId by remember { mutableStateOf<Long?>(null) }
    var attachPatientIdSelected by remember { mutableStateOf<Long?>(null) }
    var attachNoteTitle by remember { mutableStateOf("SOAP Note (from Scratchpad)") }

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
                        text = if (activeRole == "Professional") {
                            loggedInUser?.fullName ?: "Dr. Katherine Brewster"
                        } else {
                            loggedInUser?.fullName ?: "Patient Access Node"
                        },
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (activeRole == "Professional") {
                            val spec = loggedInUser?.specialty
                            if (!spec.isNullOrBlank()) {
                                "Verified $spec. Encrypted mental health clinical space under HIPAA safeguards."
                            } else {
                                "Secure mental health operating environment. Under HIPAA regulations."
                            }
                        } else {
                            "Track details, practice mindfulness breathing and schedule sessions."
                        },
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
            }
        }

        if (activeRole == "Professional") {
            if (activeAlerts.isNotEmpty()) {
                item {
                    var expandedAlertId by remember { mutableStateOf<String?>(null) }
                    
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(BorderStroke(2.dp, SoftRed), RoundedCornerShape(16.dp))
                            .testTag("crisis_alert_container"),
                        colors = CardDefaults.cardColors(
                            containerColor = SoftRed.copy(alpha = 0.08f)
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(
                                        imageVector = Icons.Default.Warning,
                                        contentDescription = "Active Crisis Alerts Detected",
                                        tint = SoftRed,
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Text(
                                        text = "HIGH-PRIORITY CLINICAL CRISIS ALERTS (${activeAlerts.size})",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = SoftRed,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                                Badge(
                                    containerColor = SoftRed,
                                    contentColor = Color.White
                                ) {
                                    Text("IMMEDIATE ACTION REQUIRED", fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "The following clients have breached distress/anxiety thresholds. Review somatic inputs and apply clinical intervention resources immediately.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            activeAlerts.forEach { alert ->
                                val isExpanded = expandedAlertId == alert.id
                                
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, SoftRed.copy(alpha = 0.3f)),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surface
                                    )
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().clickable {
                                                expandedAlertId = if (isExpanded) null else alert.id
                                                if (!isExpanded) {
                                                    viewModel.clearCrisisGuidelines()
                                                }
                                            },
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                    Text(
                                                        text = alert.patientName,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 15.sp,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    Badge(containerColor = SoftRed.copy(alpha = 0.15f), contentColor = SoftRed) {
                                                        Text(alert.severity.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                                Text(
                                                    text = "Trigger: ${alert.triggerType}",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = SoftRed
                                                )
                                                Text(
                                                    text = "Primary Focus: ${alert.patientDiagnosis} • Logged ${SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()).format(Date(alert.timestamp))}",
                                                    fontSize = 11.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                            
                                            Icon(
                                                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                                contentDescription = "Show actions",
                                                tint = Color.Gray
                                            )
                                        }
                                        
                                        if (isExpanded) {
                                            Spacer(modifier = Modifier.height(10.dp))
                                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                                            Spacer(modifier = Modifier.height(10.dp))
                                            
                                            Text(
                                                text = "Somatic Context / Self-Report:",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Surface(
                                                modifier = Modifier.fillMaxWidth(),
                                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text(
                                                    text = alert.details,
                                                    fontSize = 12.sp,
                                                    modifier = Modifier.padding(10.dp),
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                            
                                            Spacer(modifier = Modifier.height(12.dp))
                                            
                                            Text(
                                                text = "Crisis Escalation Panel:",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.Gray
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Button(
                                                    onClick = {
                                                        Toast.makeText(context, "Initiating secure HIPAA voice-call connection to ${alert.patientName}...", Toast.LENGTH_LONG).show()
                                                        viewModel.logAudit("Crisis Communication Initiate", "Started high-priority clinical outreach voice check with client: ${alert.patientName}")
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                                    modifier = Modifier.weight(1f).height(36.dp),
                                                    contentPadding = PaddingValues(0.dp),
                                                    shape = RoundedCornerShape(8.dp)
                                                ) {
                                                    Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("Direct Call", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                }

                                                Button(
                                                    onClick = {
                                                        Toast.makeText(context, "Opening instant high-priority Telehealth portal...", Toast.LENGTH_SHORT).show()
                                                        viewModel.setSelectedPatient(alert.patientId)
                                                        viewModel.navigate("Teletherapy")
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = TealSecondary),
                                                    modifier = Modifier.weight(1.2f).height(36.dp),
                                                    contentPadding = PaddingValues(0.dp),
                                                    shape = RoundedCornerShape(8.dp)
                                                ) {
                                                    Icon(Icons.Default.Videocam, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("Telehealth Meet", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                }

                                                Button(
                                                    onClick = {
                                                        viewModel.generateCrisisInterventionGuidelines(
                                                            patientName = alert.patientName,
                                                            diagnosis = alert.patientDiagnosis,
                                                            triggerDetails = alert.triggerType,
                                                            patientNote = alert.originalNote
                                                        )
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary),
                                                    modifier = Modifier.weight(1.4f).height(36.dp),
                                                    contentPadding = PaddingValues(0.dp),
                                                    shape = RoundedCornerShape(8.dp)
                                                ) {
                                                    Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("AI De-escalation Plan", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                            
                                            if (aiCrisisGuidelines.isNotEmpty()) {
                                                Spacer(modifier = Modifier.height(12.dp))
                                                Card(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    colors = CardDefaults.cardColors(containerColor = IndigoPrimary.copy(alpha = 0.05f)),
                                                    border = BorderStroke(1.dp, IndigoPrimary.copy(alpha = 0.3f))
                                                ) {
                                                    Column(modifier = Modifier.padding(10.dp)) {
                                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                                            Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, tint = IndigoPrimary, modifier = Modifier.size(16.dp))
                                                            Spacer(modifier = Modifier.width(6.dp))
                                                            Text("AI CLINICAL CRISIS DE-ESCALATION PROTOCOLS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = IndigoPrimary)
                                                        }
                                                        Spacer(modifier = Modifier.height(6.dp))
                                                        if (isCrisisAiLoading) {
                                                            Row(
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                            ) {
                                                                CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                                                                Text("Compiling custom therapeutic directives...", fontSize = 11.sp, color = Color.Gray)
                                                            }
                                                        } else {
                                                            Text(
                                                                text = aiCrisisGuidelines,
                                                                fontSize = 11.sp,
                                                                color = MaterialTheme.colorScheme.onSurface
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            Spacer(modifier = Modifier.height(12.dp))
                                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                                            Spacer(modifier = Modifier.height(8.dp))
                                            
                                            TextButton(
                                                onClick = {
                                                    viewModel.dismissCrisisAlert(alert.id)
                                                    viewModel.clearCrisisGuidelines()
                                                    expandedAlertId = null
                                                    Toast.makeText(context, "Crisis event marked as triaged, audited and archived.", Toast.LENGTH_SHORT).show()
                                                },
                                                modifier = Modifier.align(Alignment.End)
                                            ) {
                                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Mark Triaged & Dismiss Flag", fontSize = 11.sp, color = SoftGreen, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // GLOBALLY ACCESSIBLE CLINICAL SCRATCHPAD (QUICK NOTES)
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("clinical_scratchpad_container"),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                    ),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.8f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(
                                    imageVector = Icons.Default.Create,
                                    contentDescription = "Session Scratchpad",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "APPOINTMENT QUICK-NOTES SCRATCHPAD",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Badge(
                                containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.15f),
                                contentColor = MaterialTheme.colorScheme.secondary
                            ) {
                                Text("GLOBAL SCRATCHPAD", fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = "Jot down rapid thoughts, diagnostic indicators, or observations during live appointments. Convert them into formal SOAP notes later with a single click.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Input Area
                        OutlinedTextField(
                            value = scratchNoteText,
                            onValueChange = { scratchNoteText = it },
                            label = { Text("Jot down immediate observation...", fontSize = 12.sp) },
                            placeholder = { Text("e.g. Client reports sleeping only 4 hours; showing motor retardation. Focus CBT next week.", fontSize = 11.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 85.dp)
                                .testTag("scratchpad_input_field"),
                            shape = RoundedCornerShape(12.dp),
                            textStyle = MaterialTheme.typography.bodySmall,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                            )
                        )
                        
                        Spacer(modifier = Modifier.height(10.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // Tag Selector
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.horizontalScroll(rememberScrollState())
                            ) {
                                Text("Tag:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.Gray)
                                listOf("Clinical Thought", "Somatic Obs", "Prescription", "Behavior").forEach { tag ->
                                    val isSelected = scratchNoteTag == tag
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { scratchNoteTag = tag },
                                        label = { Text(tag, fontSize = 10.sp) },
                                        modifier = Modifier.height(28.dp),
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                            selectedLabelColor = MaterialTheme.colorScheme.primary
                                        )
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Button(
                            onClick = {
                                if (scratchNoteText.isNotBlank()) {
                                    viewModel.addScratchpadNote(scratchNoteText, scratchNoteTag)
                                    scratchNoteText = ""
                                    Toast.makeText(context, "Saved to appointment queue. Attach to SOAP folder when ready.", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "Please write a thought first.", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier
                                .align(Alignment.End)
                                .height(36.dp)
                                .testTag("scratchpad_save_button"),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Scribble to Queue", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        
                        // List of Scratchpad Entries
                        if (scratchpadNotes.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(14.dp))
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                            Spacer(modifier = Modifier.height(10.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "PENDING OBSERVATIONS QUEUE (${scratchpadNotes.size})",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.Gray
                                )
                                TextButton(
                                    onClick = {
                                        viewModel.clearAllScratchpadNotes()
                                        Toast.makeText(context, "Scribbled thoughts queue wiped.", Toast.LENGTH_SHORT).show()
                                    },
                                    contentPadding = PaddingValues(0.dp),
                                    modifier = Modifier.height(24.dp)
                                ) {
                                    Text("Clear All", fontSize = 10.sp, color = MaterialTheme.colorScheme.error)
                                }
                            }
                            
                            scratchpadNotes.forEach { note ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .testTag("scratchpad_item_${note.id}"),
                                    border = BorderStroke(1.dp, GoldAccent.copy(alpha = 0.4f)),
                                    colors = CardDefaults.cardColors(
                                        containerColor = GoldAccent.copy(alpha = 0.05f)
                                    ),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Badge(
                                                    containerColor = when (note.tag) {
                                                        "Clinical Thought" -> MaterialTheme.colorScheme.primaryContainer
                                                        "Somatic Obs" -> TealSecondary.copy(alpha = 0.15f)
                                                        "Prescription" -> SoftOrange.copy(alpha = 0.15f)
                                                        else -> MaterialTheme.colorScheme.surfaceVariant
                                                    },
                                                    contentColor = when (note.tag) {
                                                        "Clinical Thought" -> MaterialTheme.colorScheme.primary
                                                        "Somatic Obs" -> TealSecondary
                                                        "Prescription" -> SoftOrange
                                                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                                                    }
                                                ) {
                                                    Text(note.tag.uppercase(), fontSize = 8.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp))
                                                }
                                                
                                                Text(
                                                    text = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date(note.timestamp)),
                                                    fontSize = 10.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                            
                                            IconButton(
                                                onClick = { viewModel.deleteScratchpadNote(note.id) },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Delete,
                                                    contentDescription = "Delete observation",
                                                    tint = SoftRed.copy(alpha = 0.8f),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                        
                                        Spacer(modifier = Modifier.height(6.dp))
                                        
                                        SelectionContainer {
                                            Text(
                                                text = note.text,
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                        }
                                        
                                        Spacer(modifier = Modifier.height(8.dp))
                                        
                                        // Attachment Actions block
                                        if (attachingScratchNoteId == note.id) {
                                            Surface(
                                                modifier = Modifier.fillMaxWidth(),
                                                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                                                shape = RoundedCornerShape(8.dp),
                                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text("Attach observation to SOAP note:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                    Spacer(modifier = Modifier.height(6.dp))
                                                    
                                                    Text("Select Target Patient:", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                                    
                                                    Row(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .horizontalScroll(rememberScrollState())
                                                            .padding(vertical = 4.dp),
                                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                    ) {
                                                        patients.forEach { patient ->
                                                            val isPatSelected = attachPatientIdSelected == patient.id
                                                            ElevatedCard(
                                                                modifier = Modifier.clickable { attachPatientIdSelected = patient.id },
                                                                colors = CardDefaults.cardColors(
                                                                    containerColor = if (isPatSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                                                ),
                                                                shape = RoundedCornerShape(8.dp)
                                                            ) {
                                                                Text(
                                                                    text = patient.name,
                                                                    fontSize = 11.sp,
                                                                    fontWeight = if (isPatSelected) FontWeight.Bold else FontWeight.Normal,
                                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                                                                    color = if (isPatSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                                                                )
                                                            }
                                                        }
                                                    }
                                                    
                                                    Spacer(modifier = Modifier.height(6.dp))
                                                    
                                                    OutlinedTextField(
                                                        value = attachNoteTitle,
                                                        onValueChange = { attachNoteTitle = it },
                                                        label = { Text("Clinical Folder Title", fontSize = 10.sp) },
                                                        modifier = Modifier.fillMaxWidth().height(48.dp),
                                                        textStyle = MaterialTheme.typography.bodySmall,
                                                        shape = RoundedCornerShape(6.dp),
                                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = MaterialTheme.colorScheme.primary)
                                                    )
                                                    
                                                    Spacer(modifier = Modifier.height(8.dp))
                                                    
                                                    Row(
                                                        modifier = Modifier.fillMaxWidth(),
                                                        horizontalArrangement = Arrangement.End,
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        TextButton(
                                                            onClick = {
                                                                attachingScratchNoteId = null
                                                                attachPatientIdSelected = null
                                                            },
                                                            modifier = Modifier.height(32.dp),
                                                            contentPadding = PaddingValues(horizontal = 8.dp)
                                                        ) {
                                                            Text("Dismiss", fontSize = 11.sp)
                                                        }
                                                        Spacer(modifier = Modifier.width(6.dp))
                                                        Button(
                                                            onClick = {
                                                                val patId = attachPatientIdSelected
                                                                if (patId != null) {
                                                                    viewModel.attachScratchpadNoteToSoap(
                                                                        noteId = note.id,
                                                                        text = note.text,
                                                                        patientId = patId,
                                                                        noteTitle = attachNoteTitle
                                                                    )
                                                                    val patName = patients.find { it.id == patId }?.name ?: "Client"
                                                                    Toast.makeText(context, "Scribbled observations locked & appended to SOAP folder of $patName", Toast.LENGTH_SHORT).show()
                                                                    attachingScratchNoteId = null
                                                                    attachPatientIdSelected = null
                                                                } else {
                                                                    Toast.makeText(context, "Please select a patient to file note under.", Toast.LENGTH_SHORT).show()
                                                                }
                                                            },
                                                            modifier = Modifier.height(32.dp).testTag("confirm_attachment_btn"),
                                                            colors = ButtonDefaults.buttonColors(containerColor = SoftGreen),
                                                            contentPadding = PaddingValues(horizontal = 12.dp),
                                                            shape = RoundedCornerShape(6.dp)
                                                        ) {
                                                            Icon(Icons.Default.Folder, contentDescription = null, modifier = Modifier.size(12.dp))
                                                            Spacer(modifier = Modifier.width(4.dp))
                                                            Text("File into SOAP Profile", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.End
                                            ) {
                                                TextButton(
                                                    onClick = {
                                                        attachingScratchNoteId = note.id
                                                        attachPatientIdSelected = patients.firstOrNull()?.id // Auto preselect first patient
                                                        attachNoteTitle = "SOAP Detail (from ${note.tag})"
                                                    },
                                                    modifier = Modifier.height(32.dp).testTag("attach_soap_trigger_${note.id}"),
                                                    contentPadding = PaddingValues(horizontal = 8.dp)
                                                ) {
                                                    Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp), tint = TealSecondary)
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("File to SOAP Note Folder", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TealSecondary)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // State-managed sub-navigation View Switcher
            item {
                TabRow(
                    selectedTabIndex = activeSubTab,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)),
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    Tab(
                        selected = activeSubTab == 0,
                        onClick = { activeSubTab = 0 },
                        text = { Text("Clients (${patients.size})", maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(Icons.Default.Group, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                    Tab(
                        selected = activeSubTab == 1,
                        onClick = { activeSubTab = 1 },
                        text = { Text("Session Notes (${allNotes.size})", maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(Icons.Default.Assignment, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                    Tab(
                        selected = activeSubTab == 2,
                        onClick = { activeSubTab = 2 },
                        text = { Text("Reminders (${appointments.filter { it.status == "Scheduled" }.size})", maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(Icons.Default.Alarm, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                }
            }

            // View Selection router
            when (activeSubTab) {
                0 -> { // VIEW 0: ACTIVE CLIENTS MANAGEMENT
                    item {
                        OutlinedTextField(
                            value = clientSearchQuery,
                            onValueChange = { clientSearchQuery = it },
                            placeholder = { Text("Search clients by name, diagnosis, or risk...", fontSize = 13.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                            trailingIcon = {
                                if (clientSearchQuery.isNotEmpty()) {
                                    IconButton(onClick = { clientSearchQuery = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = "Clear query")
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().testTag("client_search_input"),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }

                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().clickable { showAddPatientForm = !showAddPatientForm },
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.PersonAdd, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("Enroll New Practice Client", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                                    }
                                    Icon(
                                        imageVector = if (showAddPatientForm) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                                if (showAddPatientForm) {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    OutlinedTextField(
                                        value = newPatName,
                                        onValueChange = { newPatName = it },
                                        label = { Text("Full Name", fontSize = 12.sp) },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedTextField(
                                            value = newPatAge,
                                            onValueChange = { newPatAge = it },
                                            label = { Text("Age", fontSize = 12.sp) },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        OutlinedTextField(
                                            value = newPatGender,
                                            onValueChange = { newPatGender = it },
                                            label = { Text("Gender", fontSize = 12.sp) },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    OutlinedTextField(
                                        value = newPatEmail,
                                        onValueChange = { newPatEmail = it },
                                        label = { Text("Email Address", fontSize = 12.sp) },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    OutlinedTextField(
                                        value = newPatPhone,
                                        onValueChange = { newPatPhone = it },
                                        label = { Text("Phone Number", fontSize = 12.sp) },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    OutlinedTextField(
                                        value = newPatSpecialty,
                                        onValueChange = { newPatSpecialty = it },
                                        label = { Text("Clinical Diagnosis / Specialty Focus", fontSize = 12.sp) },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Assign Clinical Risk Priority:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Row(
                                        modifier = Modifier.horizontalScroll(rememberScrollState()).padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        listOf("None", "Low", "Moderate", "Severe").forEach { r ->
                                            val isSel = newPatRisk == r
                                            FilterChip(
                                                selected = isSel,
                                                onClick = { newPatRisk = r },
                                                label = { Text(r, fontSize = 11.sp) }
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Button(
                                        onClick = {
                                            if (newPatName.trim().isNotEmpty()) {
                                                val ageInt = newPatAge.toIntOrNull() ?: 30
                                                viewModel.addPatient(
                                                    name = newPatName,
                                                    age = ageInt,
                                                    gender = newPatGender,
                                                    email = newPatEmail,
                                                    phone = newPatPhone,
                                                    risk = newPatRisk,
                                                    specialty = newPatSpecialty
                                                )
                                                newPatName = ""
                                                newPatAge = ""
                                                newPatEmail = ""
                                                newPatPhone = ""
                                                newPatSpecialty = "Generalized Anxiety Disorder"
                                                newPatRisk = "None"
                                                showAddPatientForm = false
                                                Toast.makeText(context, "New client profile generated successfully in local database.", Toast.LENGTH_LONG).show()
                                            } else {
                                                Toast.makeText(context, "Please enter at least a Client Name.", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Icon(Icons.Default.Check, contentDescription = null)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Enroll Practice Client")
                                    }
                                }
                            }
                        }
                    }

                    val filteredPatients = patients.filter { pat ->
                        clientSearchQuery.isEmpty() ||
                        pat.name.contains(clientSearchQuery, ignoreCase = true) ||
                        pat.specialty.contains(clientSearchQuery, ignoreCase = true) ||
                        pat.riskStatus.contains(clientSearchQuery, ignoreCase = true)
                    }

                    if (filteredPatients.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                                Text("No registered active clients matching criteria.", color = Color.Gray, fontSize = 13.sp)
                            }
                        }
                    } else {
                        items(filteredPatients) { pat ->
                            val riskColor = when (pat.riskStatus) {
                                "Severe" -> SoftRed
                                "Moderate" -> SoftOrange
                                "Low" -> SoftGreen
                                else -> MaterialTheme.colorScheme.outline
                            }
                            val riskBg = when (pat.riskStatus) {
                                "Severe" -> SoftRed.copy(alpha = 0.1f)
                                "Moderate" -> SoftOrange.copy(alpha = 0.1f)
                                "Low" -> SoftGreen.copy(alpha = 0.1f)
                                else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                            }

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = pat.name,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 17.sp,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = "${pat.gender}, Age ${pat.age} | Born ${SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault()).format(java.util.Date(pat.registrationDate))}",
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = riskBg),
                                            border = BorderStroke(1.dp, riskColor),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                text = "Risk: ${pat.riskStatus.uppercase()}",
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = if (pat.riskStatus == "None") MaterialTheme.colorScheme.onSurfaceVariant else riskColor
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Troubleshoot,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.secondary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = pat.specialty,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                    }

                                    val activePatientMedications = allMedications.filter { it.patientId == pat.id && it.isActive }
                                    if (activePatientMedications.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.15f)),
                                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.tertiary.copy(alpha = 0.25f))
                                        ) {
                                            Column(modifier = Modifier.padding(10.dp)) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Default.Healing,
                                                        contentDescription = null,
                                                        tint = MaterialTheme.colorScheme.tertiary,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        "Active Prescriptions & Compliance:",
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.tertiary
                                                    )
                                                }
                                                Spacer(modifier = Modifier.height(6.dp))
                                                activePatientMedications.forEach { med ->
                                                    val medLogs = allAdherenceLogs.filter { it.medicationId == med.id }
                                                    val takenCount = medLogs.count { it.status == "Taken" }
                                                    val totalCount = medLogs.size
                                                    val complianceText = if (totalCount > 0) {
                                                        val rate = (takenCount * 100) / totalCount
                                                        "$rate% Adherent"
                                                    } else {
                                                        "No logs recorded"
                                                    }
                                                    
                                                    Row(
                                                        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                                                        horizontalArrangement = Arrangement.SpaceBetween,
                                                        verticalAlignment = Alignment.CenterVertically
                                                     ) {
                                                        Text(
                                                            text = "• ${med.name} ${med.dosage} (${med.frequency})",
                                                            fontSize = 11.sp,
                                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                                        )
                                                        Text(
                                                            text = complianceText,
                                                            fontSize = 11.sp,
                                                            fontWeight = FontWeight.ExtraBold,
                                                            color = if (complianceText.startsWith("100") || complianceText.contains("80") || complianceText.contains("90")) SoftGreen else if (complianceText.contains("No logs")) Color.Gray else SoftOrange
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))
                                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                                    Spacer(modifier = Modifier.height(12.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(text = "✉ ${pat.email}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text(text = "☏ ${pat.phone}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }

                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            FilledIconButton(
                                                onClick = {
                                                    selectedPatForAppt = pat
                                                    showAddApptDialog = true
                                                },
                                                modifier = Modifier.size(36.dp),
                                                colors = IconButtonDefaults.filledIconButtonColors(
                                                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                                    contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                                )
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.CalendarMonth,
                                                    contentDescription = "Schedule appointment",
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }

                                            Button(
                                                onClick = {
                                                    viewModel.setSelectedPatient(pat.id)
                                                    viewModel.navigate("Digital MSE")
                                                },
                                                contentPadding = PaddingValues(horizontal = 12.dp),
                                                modifier = Modifier.height(36.dp),
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                                )
                                            ) {
                                                Text("MSE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }

                                            Button(
                                                onClick = {
                                                    viewModel.setSelectedPatient(pat.id)
                                                    viewModel.navigate("AI Copilot")
                                                },
                                                contentPadding = PaddingValues(horizontal = 12.dp),
                                                modifier = Modifier.height(36.dp)
                                            ) {
                                                Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(12.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("AI", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                1 -> { // VIEW 1: RECENT CLINICAL SESSION NOTES
                    item {
                        OutlinedTextField(
                            value = noteSearchQuery,
                            onValueChange = { noteSearchQuery = it },
                            placeholder = { Text("Search patient notes, therapy plans, or keywords...", fontSize = 13.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                            trailingIcon = {
                                if (noteSearchQuery.isNotEmpty()) {
                                    IconButton(onClick = { noteSearchQuery = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = "Clear query")
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().testTag("note_search_input"),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }

                    val filteredNotes = allNotes.filter { note ->
                        val patientName = patients.firstOrNull { it.id == note.patientId }?.name ?: ""
                        noteSearchQuery.isEmpty() ||
                        note.title.contains(noteSearchQuery, ignoreCase = true) ||
                        note.bodyJson.contains(noteSearchQuery, ignoreCase = true) ||
                        patientName.contains(noteSearchQuery, ignoreCase = true)
                    }

                    if (filteredNotes.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                                Text("No recent sessions or notes match description.", color = Color.Gray, fontSize = 13.sp)
                            }
                        }
                    } else {
                        items(filteredNotes) { note ->
                            val associatedPatient = patients.firstOrNull { it.id == note.patientId }
                            val patientName = associatedPatient?.name ?: "Unknown Client"
                            val formattedDate = SimpleDateFormat("dd MMM yyyy, hh:mm a", java.util.Locale.getDefault()).format(java.util.Date(note.timestamp))

                            val cleanBody = try {
                                val json = org.json.JSONObject(note.bodyJson)
                                val s = json.optString("Subjective", "")
                                val o = json.optString("Objective", "")
                                val a = json.optString("Assessment", "")
                                val p = json.optString("Plan", "")
                                if (s.isNotEmpty() || o.isNotEmpty()) {
                                    "S: $s\n\nO: $o\n\nA: $a\n\nP: $p"
                                } else {
                                    note.bodyJson
                                }
                            } catch (e: Exception) {
                                note.bodyJson
                            }

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Icon(
                                                imageVector = if (note.noteType == "SOAP") Icons.Default.Description else Icons.Default.Assignment,
                                                contentDescription = null,
                                                tint = TealSecondary,
                                                modifier = Modifier.size(20.dp)
                                            )
                                            Text(
                                                text = note.title,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                        
                                        Badge(containerColor = MaterialTheme.colorScheme.secondaryContainer) {
                                            Icon(
                                                imageVector = Icons.Default.Security,
                                                contentDescription = null,
                                                modifier = Modifier.size(10.dp),
                                                tint = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("HIPAA SECURED", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSecondaryContainer, modifier = Modifier.padding(2.dp))
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Client: $patientName | Recorded: $formattedDate",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )

                                    Spacer(modifier = Modifier.height(10.dp))
                                    
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                                            .padding(12.dp)
                                    ) {
                                        SelectionContainer {
                                            Text(
                                                text = cleanBody,
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    fontFamily = FontFamily.Monospace,
                                                    fontSize = 11.sp,
                                                    lineHeight = 16.sp
                                                ),
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "🔒 ${note.riskDisclaimer}",
                                            fontSize = 9.sp,
                                            color = MaterialTheme.colorScheme.outline
                                        )

                                        if (associatedPatient != null) {
                                            TextButton(
                                                onClick = {
                                                    viewModel.setSelectedPatient(associatedPatient.id)
                                                    viewModel.navigate("AI Copilot")
                                                },
                                                modifier = Modifier.height(28.dp),
                                                contentPadding = PaddingValues(horizontal = 8.dp)
                                            ) {
                                                Text("EHR System", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                Icon(Icons.Default.ChevronRight, contentDescription = null, modifier = Modifier.size(14.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                2 -> { // VIEW 2: REMINDERS, APPOINTMENTS & ALERTS
                    // URGENT RISK ALERTS SECTION
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
                                            "URGENT CLINICAL REMINDERS & ALERTS (${severePatients.size})",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
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
                                                Text("Risk Flag: ${pat.riskStatus} | Specialty: ${pat.specialty}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
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
                                                Text("Review EHR", fontSize = 11.sp, color = Color.White)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // ACTIVE CASES & REVENUE PORTLETS
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

                    // TODAY'S APPOINTMENTS & REMINDERS LIST
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Upcoming Reminders & Practice Schedule", fontWeight = FontWeight.Bold, fontSize = 15.sp)
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
                                Text("No further reminders or scheduled slots today.", color = Color.Gray, fontSize = 13.sp)
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
                                        Text("Remind: ${appt.dateTime} | Fee Case: $${appt.fee}", fontSize = 12.sp, color = Color.Gray)
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

                    // CLINICAL RECOMMENDATIONS
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

            // WELLNESS HABIT STRUT
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("DAILY BIO-BEHAVIORAL HABITS", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = true, onCheckedChange = {})
                            Text("Mindfulness Breathing (completed 8 mins)", fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = false, onCheckedChange = {})
                            Text("Cognitive restructuring gratitude entry", fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = false, onCheckedChange = {})
                            Text("Occupational boundary: Close pc at 8 PM", fontSize = 13.sp)
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
    val context = LocalContext.current
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val selectedId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()
    val allNotes by viewModel.allNotes.collectAsStateWithLifecycle()

    var copilotMode by remember { mutableStateOf(0) } // 0: SOAP Writer, 1: Proactive Insights
    val proactiveInsights by viewModel.proactiveInsights.collectAsStateWithLifecycle()
    val isInsightsLoading by viewModel.isInsightsLoading.collectAsStateWithLifecycle()
    val allScores by viewModel.allScores.collectAsStateWithLifecycle()
    val moodLogs by viewModel.moodLogs.collectAsStateWithLifecycle()
    val allHomework by viewModel.allHomework.collectAsStateWithLifecycle()

    val activePatient = patients.firstOrNull { it.id == selectedId } ?: patients.firstOrNull()
    val patientNotes = allNotes.filter { it.patientId == (activePatient?.id ?: 1L) && it.noteType == "SOAP" }

    var textInputState by remember { mutableStateOf("") }
    
    // SOAP Editor States
    var subjectiveEdit by remember { mutableStateOf("") }
    var objectiveEdit by remember { mutableStateOf("") }
    var assessmentEdit by remember { mutableStateOf("") }
    var planEdit by remember { mutableStateOf("") }
    
    // Active Tab for structured viewer (0: S, 1: O, 2: A, 3: P)
    var activeTab by remember { mutableStateOf(0) }

    // Synchronize form states on new AI response
    LaunchedEffect(aiResultText) {
        if (aiResultText.isNotEmpty()) {
            val parsedResult = parseSoapSections(aiResultText)
            subjectiveEdit = parsedResult["Subjective"] ?: ""
            objectiveEdit = parsedResult["Objective"] ?: ""
            assessmentEdit = parsedResult["Assessment"] ?: ""
            planEdit = parsedResult["Plan"] ?: ""
        }
    }

    val hasData = subjectiveEdit.isNotEmpty() || objectiveEdit.isNotEmpty() || assessmentEdit.isNotEmpty() || planEdit.isNotEmpty()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("ai_copilot_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader(
                title = if (copilotMode == 0) "Structured AI SOAP Copilot" else "AI Proactive Clinical Copilot",
                icon = Icons.Default.AutoAwesome
            )
        }

        item {
            TabRow(selectedTabIndex = copilotMode, modifier = Modifier.fillMaxWidth()) {
                Tab(
                    selected = copilotMode == 0,
                    onClick = { copilotMode = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.PendingActions, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("SOAP Note Writer")
                        }
                    },
                    modifier = Modifier.testTag("copilot_tab_soap")
                )
                Tab(
                    selected = copilotMode == 1,
                    onClick = { copilotMode = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Troubleshoot, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("Proactive Case Insights")
                        }
                    },
                    modifier = Modifier.testTag("copilot_tab_insights")
                )
            }
        }

        // Active patient selection card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Target Patient Chart:",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleSmall
                        )
                        patients.firstOrNull { it.id == selectedId }?.let { active ->
                            SuggestionChip(
                                onClick = {},
                                label = { Text("ID: #${active.id} | ${active.specialty}") },
                                colors = SuggestionChipDefaults.suggestionChipColors(
                                    labelColor = MaterialTheme.colorScheme.primary
                                )
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        patients.forEach { patient ->
                            val isSel = patient.id == activePatient?.id
                            FilterChip(
                                selected = isSel,
                                onClick = { 
                                    viewModel.setSelectedPatient(patient.id)
                                    textInputState = ""
                                },
                                label = { Text(patient.name) }
                            )
                        }
                    }
                }
            }
        }

        if (copilotMode == 0) {
            // Input Transcript Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Clinical Raw Conversation Session Notes:",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = textInputState,
                        onValueChange = { textInputState = it },
                        placeholder = {
                            Text(
                                "Describe direct conversation sentences, paste physical session recordings, or jot down shorthand clinical notes here..."
                            )
                        },
                        modifier = Modifier.fillMaxWidth().height(160.dp).testTag("copilot_transcription_input"),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Quick Action Tags row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Or try Quick Clinical Scenarios:",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        AssistChip(
                            onClick = {
                                textInputState = "Patient Liam reports worsening depressive traits and social withdrawal over past 2 weeks. Notes intense brain fog and feeling completely flat. Sleeps 11 hours and wakes up unrefreshed. Objective score: PHQ-9 is 21. Assessment should include single episode major depression. Plan focuses on scheduling a routine sleep checklist and commencing CBT."
                            },
                            label = { Text("Liam (Depression Profile)") },
                            leadingIcon = { Icon(Icons.Default.MedicalServices, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        )

                        AssistChip(
                            onClick = {
                                textInputState = "Patient reports feeling highly keyed-up with racing thoughts and tight physical chest symptoms when preparing for work deliverables. GAD-7 is 14 indicating moderate to severe anxiety levels. Reports somatic muscular tightness. Assessment and differential options include F41.1. Plan covers mindfulness diaphragmatic training and PCP check for organic triggers (Thyroid panel)."
                            },
                            label = { Text("Anxiety Somatic Case") },
                            leadingIcon = { Icon(Icons.Default.Thermostat, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        )

                        AssistChip(
                            onClick = {
                                textInputState = "Patient Sophia presents with hyperarousal features connected to early childhood developmental trauma triggers. Describes sudden intrusion of memory, high threat scanning behavior, and difficulty concentrating during university lectures. GAD-7 is 16. Assessment points to moderate PTSD trauma. Plan centers on EMDR therapy phase 2 groundwork and daily breathing exercises."
                            },
                            label = { Text("Sophia (Trauma/PTSD)") },
                            leadingIcon = { Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // AI trigger Button
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
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                        } else {
                            Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = "Sparkle")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Generate Structured SOAP Note via Gemini")
                        }
                    }
                }
            }
        }

        // HIPAA Compliance Banner
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.PrivacyTip, 
                        contentDescription = "Compliance Disclaimer", 
                        tint = MaterialTheme.colorScheme.error, 
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "HIPAA Alert: All AI-generated SOAP notes must run through professional validation and audit logging before saving to the permanent EHR chart.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }

        // Dedicated Structured SOAP Note Editor & Review Workspace
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Clinical Workdesk: SOAP Note Editor",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                "Refine structured content before verifying",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        // Status indicator
                        AssistChip(
                            onClick = {},
                            label = { Text(if (hasData) "Draft Loaded" else "Input Pending") },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = if (hasData) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))

                    // Document Tabs (S, O, A, P)
                    val tabs = listOf("S - Subjective", "O - Objective", "A - Assessment", "P - Plan")
                    TabRow(selectedTabIndex = activeTab) {
                        tabs.forEachIndexed { index, title ->
                            Tab(
                                selected = activeTab == index,
                                onClick = { activeTab = index },
                                text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Tab contents
                    when (activeTab) {
                        0 -> {
                            TabContentField(
                                label = "Subjective (S) Components",
                                desc = "Patient's subjective reports, direct quotes, somatic symptoms, sleep metrics, and current perceived distress.",
                                value = subjectiveEdit,
                                onValueChange = { subjectiveEdit = it },
                                testTag = "soap_subjective_edit"
                            )
                        }
                        1 -> {
                            TabContentField(
                                label = "Objective (O) Components",
                                desc = "Observable mental status characteristics, professional checklists, active GAD-7 or PHQ-9 scale results, facial affect, and objective markers.",
                                value = objectiveEdit,
                                onValueChange = { objectiveEdit = it },
                                testTag = "soap_objective_edit"
                            )
                        }
                        2 -> {
                            TabContentField(
                                label = "Assessment (A) Components",
                                desc = "Clinical evaluation, diagnostic synthesis, differential classifications, matching DSM-5 diagnoses, ICD-10 medical codes, and safety screening.",
                                value = assessmentEdit,
                                onValueChange = { assessmentEdit = it },
                                testTag = "soap_assessment_edit"
                            )
                        }
                        3 -> {
                            TabContentField(
                                label = "Plan (P) Components",
                                desc = "Concrete therapy actions, targeted homework, wellness breathing logs, next session focus targets, and any PCPs referrals.",
                                value = planEdit,
                                onValueChange = { planEdit = it },
                                testTag = "soap_plan_edit"
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Editor Actions Footer
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Clean Draft Button
                        OutlinedButton(
                            onClick = {
                                subjectiveEdit = ""
                                objectiveEdit = ""
                                assessmentEdit = ""
                                planEdit = ""
                                Toast.makeText(context, "Editor Draft Cleared", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f).height(44.dp)
                        ) {
                            Icon(Icons.Default.Clear, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Clear", fontSize = 12.sp)
                        }

                        // Copy Button
                        OutlinedButton(
                            onClick = {
                                val fullText = """
                                    CLINICAL SOAP REPORT
                                    Patient: ${activePatient?.name ?: "Unknown"}
                                    Date: ${SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date())}
                                    -------------------------------
                                    SUBJECTIVE (S):
                                    $subjectiveEdit
                                    
                                    OBJECTIVE (O):
                                    $objectiveEdit
                                    
                                    ASSESSMENT (A):
                                    $assessmentEdit
                                    
                                    PLAN (P):
                                    $planEdit
                                    -------------------------------
                                    Compliance: HIPAA Verified digital chart.
                                """.trimIndent()
                                val clipboard = context.getSystemService(android.content.ClipboardManager::class.java)
                                val clip = android.content.ClipData.newPlainText("SOAP Note", fullText)
                                clipboard.setPrimaryClip(clip)
                                Toast.makeText(context, "Full SOAP copied to clipboard!", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1.2f).height(44.dp),
                            enabled = hasData
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copy Full", fontSize = 12.sp)
                        }

                        // Save & Commit Button
                        Button(
                            onClick = {
                                if (activePatient != null && (subjectiveEdit.isNotEmpty() || objectiveEdit.isNotEmpty() || assessmentEdit.isNotEmpty() || planEdit.isNotEmpty())) {
                                    val compiledString = """
                                        **SUBJECTIVE (S):**
                                        $subjectiveEdit
                                        
                                        **OBJECTIVE (O):**
                                        $objectiveEdit
                                        
                                        **ASSESSMENT (A):**
                                        $assessmentEdit
                                        
                                        **PLAN (P):**
                                        $planEdit
                                    """.trimIndent()
                                    
                                    viewModel.addClinicalNote(
                                        patientId = activePatient.id,
                                        title = "Validated Clinical SOAP Note",
                                        type = "SOAP",
                                        bodyHtml = compiledString,
                                        isRiskAlert = subjectiveEdit.contains("hurt") || assessmentEdit.contains("severe") || planEdit.contains("suicide")
                                    )
                                    Toast.makeText(context, "SOAP successfully committed to EHR!", Toast.LENGTH_SHORT).show()
                                } else {
                                    Toast.makeText(context, "Please fill out clinical data before saving.", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1.5f).height(44.dp),
                            enabled = hasData
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Commit to EHR", fontSize = 12.sp)
                        }
                    }

                    if (hasData) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    "Document Export Core (HIPAA Audited Code):",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = {
                                            DocumentExporter.exportSoapNoteToPdf(
                                                context = context,
                                                patientName = activePatient?.name ?: "Unknown Patient",
                                                dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date()),
                                                subjective = subjectiveEdit,
                                                objective = objectiveEdit,
                                                assessment = assessmentEdit,
                                                plan = planEdit
                                            )
                                            viewModel.logAudit("Document Generated", "Compiled and exported secure PDF SOAP Report for ${activePatient?.name ?: "Unknown"}")
                                        },
                                        modifier = Modifier.weight(1f).height(38.dp).testTag("export_soap_pdf_button"),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Export PDF", fontSize = 11.sp)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            DocumentExporter.exportSoapNoteToDocx(
                                                context = context,
                                                patientName = activePatient?.name ?: "Unknown Patient",
                                                dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date()),
                                                subjective = subjectiveEdit,
                                                objective = objectiveEdit,
                                                assessment = assessmentEdit,
                                                plan = planEdit
                                            )
                                            viewModel.logAudit("Document Generated", "Compiled and exported secure DOCX SOAP Report for ${activePatient?.name ?: "Unknown"}")
                                        },
                                        modifier = Modifier.weight(1f).height(38.dp).testTag("export_soap_docx_button"),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Icon(Icons.Default.Description, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Export DOCX", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // EHR Saved SOAP Note Records Hub
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "EHR SOAP Archive (${patientNotes.size} saved)",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Icon(
                        imageVector = Icons.Default.History, 
                        contentDescription = "Search archive",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                
                if (patientNotes.isEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f))
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp).fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.AssignmentLate, 
                                contentDescription = null, 
                                modifier = Modifier.size(36.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "No SOAP Notes saved for ${activePatient?.name ?: "this patient"}.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "Try typing session notes above and compiling via AI.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        patientNotes.forEach { note ->
                            Card(
                                modifier = Modifier.fillMaxWidth().clickable {
                                    // Parse and load this clinical note into the editor for viewing/editing!
                                    val parsed = parseSoapSections(note.bodyJson)
                                    subjectiveEdit = parsed["Subjective"] ?: ""
                                    objectiveEdit = parsed["Objective"] ?: ""
                                    assessmentEdit = parsed["Assessment"] ?: ""
                                    planEdit = parsed["Plan"] ?: ""
                                    Toast.makeText(context, "${note.title} loaded into Editor!", Toast.LENGTH_SHORT).show()
                                },
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = note.title,
                                            fontWeight = FontWeight.Bold,
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                        if (note.isRiskAlert) {
                                            Badge(containerColor = MaterialTheme.colorScheme.error) {
                                                Text("Risk Alert", fontSize = 10.sp, color = Color.White)
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = note.bodyJson.take(150).replace("**", "") + "...",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = SimpleDateFormat("dd MMM yyyy 'at' hh:mm a", Locale.getDefault()).format(Date(note.timestamp)),
                                            fontSize = 9.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                        )
                                        Text(
                                            text = "Tap to Edit Draft ✎",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        } else {
            // Trigger Analyzer Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("insights_trigger_card"),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "AI Proactive Clinical Copilot",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Analyze correlations across assessments, mood, clinical logs, homework state, and medications to extract therapeutic considerations.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (activePatient != null) {
                                    viewModel.triggerProactiveInsights(activePatient.id)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp).testTag("generate_insights_button"),
                            enabled = !isInsightsLoading && activePatient != null
                        ) {
                            if (isInsightsLoading) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                            } else {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Compile Proactive Patient Insights")
                            }
                        }
                    }
                }
            }

            // Insights display section
            if (proactiveInsights.isNotEmpty()) {
                item {
                    Text(
                        text = "Proactive Analysis Scorecard - ${activePatient?.name}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                // Render structured sections
                val sections = proactiveInsights.split("###").filter { it.trim().isNotEmpty() }
                if (sections.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                        ) {
                            Text(
                                text = proactiveInsights,
                                modifier = Modifier.padding(16.dp),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                } else {
                    items(sections) { rawSection ->
                        val lines = rawSection.trim().split("\n")
                        val header = lines.firstOrNull()?.trim() ?: ""
                        val content = lines.drop(1).joinToString("\n").trim()
                        
                        // Pick card border / background based on heading risk keyword
                        val containerColor = when {
                            header.contains("RISK") || header.contains("ALERT") || header.contains("⚠️") -> 
                                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)
                            header.contains("TREND") || header.contains("📈") -> 
                                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)
                            else -> 
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)
                        }
                        val borderColor = when {
                            header.contains("RISK") || header.contains("ALERT") || header.contains("⚠️") -> 
                                MaterialTheme.colorScheme.error.copy(alpha = 0.5f)
                            header.contains("TREND") || header.contains("📈") -> 
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                            else -> 
                                MaterialTheme.colorScheme.outlineVariant
                        }

                        Card(
                            modifier = Modifier.fillMaxWidth().testTag("insight_section_card"),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = containerColor),
                            border = BorderStroke(1.dp, borderColor)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = header,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = when {
                                        header.contains("RISK") || header.contains("ALERT") || header.contains("⚠️") -> MaterialTheme.colorScheme.error
                                        header.contains("TREND") || header.contains("📈") -> MaterialTheme.colorScheme.primary
                                        else -> MaterialTheme.colorScheme.onSurface
                                    }
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = content,
                                    style = MaterialTheme.typography.bodyMedium,
                                    lineHeight = 20.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            } else {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background)
                    ) {
                        Column(
                            modifier = Modifier.padding(32.dp).fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Troubleshoot,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "EHR Patient Data Insights Engine",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Current selection: ${activePatient?.name ?: "No patient selected"}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Compile clinical trends, potential risks, and recovery goals compiled by cross-referencing all database parameters.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.testTag("insights_welcome_desc")
                            )
                        }
                    }
                }
            }

            // Raw patient records panel for absolute transparency
            item {
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                Text(
                    text = "Raw Patient Diagnostic Parameters Logged",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // GAD-7/PHQ-9 assessments
            item {
                val patientScores = allScores.filter { it.patientId == (activePatient?.id ?: 1L) }
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("raw_assessments_card"),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
                    border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Standard Assessments (${patientScores.size} logs)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            Icon(Icons.Default.Grading, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        if (patientScores.isEmpty()) {
                            Text("No assessments recorded yet.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        } else {
                            patientScores.forEach { s ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("${s.type} Test: ${s.details}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
                                    Text("Score: ${s.score}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }
            }

            // Mood Tracking Log Snapshot
            item {
                val patientMoods = moodLogs.filter { it.patientId == (activePatient?.id ?: 1L) }
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("raw_moods_card"),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
                    border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Recent Mood & Somatic Logs (${patientMoods.size})", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            Icon(Icons.Default.Mood, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        if (patientMoods.isEmpty()) {
                            Text("No mood entries logged.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        } else {
                            patientMoods.take(3).forEach { m ->
                                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Self-Report: ${m.moodNote.take(40)}...", style = MaterialTheme.typography.bodySmall, maxLines = 1)
                                        Text("Score: ${m.moodScore}/10", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    }
                                    if (m.gratitude.isNotEmpty()) {
                                        Text("Gratitude: \"${m.gratitude}\"", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Clinical Homework & Compliance tracking
            item {
                val patientHw = allHomework.filter { it.patientId == (activePatient?.id ?: 1L) }
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("raw_homework_card"),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
                    border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Assigned Cognitive Homework (${patientHw.size})", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            Icon(Icons.Default.DoneAll, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        if (patientHw.isEmpty()) {
                            Text("No homework assigned.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        } else {
                            patientHw.forEach { h ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(h.title, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
                                        if (h.patientNotes.isNotEmpty()) {
                                            Text("Client Log: ${h.patientNotes}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                    Badge(
                                        containerColor = if (h.status == "Completed") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
                                    ) {
                                        Text(h.status, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TabContentField(
    label: String,
    desc: String,
    value: String,
    onValueChange: (String) -> Unit,
    testTag: String
) {
    Column {
        Text(
            text = label,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = desc,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            lineHeight = 14.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth().height(200.dp).testTag(testTag),
            shape = RoundedCornerShape(12.dp)
        )
    }
}

// Utility Parser to isolate S, O, A, P fields from clinical report outputs
fun parseSoapSections(rawText: String): Map<String, String> {
    val sections = mutableMapOf<String, String>()
    sections["Subjective"] = ""
    sections["Objective"] = ""
    sections["Assessment"] = ""
    sections["Plan"] = ""
    
    var currentSection = ""
    val lines = rawText.split("\n")
    val sb = StringBuilder()
    
    for (line in lines) {
        val trimmed = line.trim()
        val lower = trimmed.lowercase()
        
        val isSubjective = lower.startsWith("**subjective") || lower.startsWith("subjective") || lower.contains("subjective (s)") || lower.contains("subjective:")
        val isObjective = lower.startsWith("**objective") || lower.startsWith("objective") || lower.contains("objective (o)") || lower.contains("objective:")
        val isAssessment = lower.startsWith("**assessment") || lower.startsWith("assessment") || lower.contains("assessment (a)") || lower.contains("assessment:")
        val isPlan = lower.startsWith("**plan") || lower.startsWith("plan") || lower.contains("plan (p)") || lower.contains("plan:")
        
        if (isSubjective) {
            if (currentSection.isNotEmpty()) {
                sections[currentSection] = sb.toString().trim()
                sb.clear()
            }
            currentSection = "Subjective"
        } else if (isObjective) {
            if (currentSection.isNotEmpty()) {
                sections[currentSection] = sb.toString().trim()
                sb.clear()
            }
            currentSection = "Objective"
        } else if (isAssessment) {
            if (currentSection.isNotEmpty()) {
                sections[currentSection] = sb.toString().trim()
                sb.clear()
            }
            currentSection = "Assessment"
        } else if (isPlan) {
            if (currentSection.isNotEmpty()) {
                sections[currentSection] = sb.toString().trim()
                sb.clear()
            }
            currentSection = "Plan"
        } else {
            if (currentSection.isNotEmpty()) {
                sb.append(line).append("\n")
            } else {
                sb.append(line).append("\n")
            }
        }
    }
    
    if (currentSection.isNotEmpty()) {
        sections[currentSection] = sb.toString().trim()
    } else if (sb.isNotEmpty()) {
        sections["Subjective"] = sb.toString().trim()
    }
    
    return sections
}

// --- C. DIGITAL MSE MODULE ---

// Stateless helper functions for quick toggling of structured lists in textual fields
private fun toggleTermInString(currentText: String, term: String): String {
    val termsList = currentText
        .split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .toMutableList()

    // Check if term already exists in termsList case-insensitively
    val matchedIndex = termsList.indexOfFirst { it.equals(term, ignoreCase = true) }
    if (matchedIndex != -1) {
        termsList.removeAt(matchedIndex)
    } else {
        termsList.add(term)
    }
    return termsList.joinToString(", ")
}

private fun isTermSelected(currentText: String, term: String): Boolean {
    return currentText
        .split(",")
        .map { it.trim() }
        .any { it.equals(term, ignoreCase = true) }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MseChecklistGroup(
    title: String,
    icon: ImageVector,
    currentText: String,
    onTextChange: (String) -> Unit,
    checklistOptions: List<String>,
    placeholder: String,
    tag: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header with icon and title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            
            // FlowRow of Checklist Term Chips
            Text(
                text = "Structured Checklist (Tap to toggle):",
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(6.dp))
            
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                checklistOptions.forEach { option ->
                    val selected = isTermSelected(currentText, option)
                    FilterChip(
                        selected = selected,
                        onClick = {
                            val newText = toggleTermInString(currentText, option)
                            onTextChange(newText)
                        },
                        label = { Text(option, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                            labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Text area for direct editing & preview
            Text(
                text = "Active Clinical Descriptor Text:",
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = currentText,
                onValueChange = onTextChange,
                modifier = Modifier.fillMaxWidth().testTag(tag),
                placeholder = { Text(placeholder, fontSize = 12.sp) },
                textStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                shape = RoundedCornerShape(8.dp)
            )
        }
    }
}

@Composable
fun DigitalMseScreen(viewModel: PsyPyrusViewModel) {
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val selectedId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()
    val context = LocalContext.current

    val activePatient = patients.firstOrNull { it.id == selectedId } ?: patients.firstOrNull()

    // MSE State selections
    var appearanceState by remember { mutableStateOf("Well-groomed, appropriate attire, good eye contact") }
    var behaviorState by remember { mutableStateOf("Cooperative, normal motor activity") }
    var speechState by remember { mutableStateOf("Normative rate & rhythm, clear articulation, spontaneous") }
    var moodCheckState by remember { mutableStateOf("Euthymic mood") }
    var affectCheckState by remember { mutableStateOf("Congruent affect, full range affect") }
    var attentionState by remember { mutableStateOf("Logical / goal-directed, focused attention, alert and oriented") }
    var insightRating by remember { mutableStateOf(5f) } // Grade 1 to 6
    var judgmentState by remember { mutableStateOf("Socially sound and safe") }
    var commentsState by remember { mutableStateOf("Patient is responsive, shows optimal baseline cognitive metrics.") }

    // Predefined baseline checklist lists
    val appearanceOptions = listOf(
        "Well-groomed", "Appropriate attire", "Good eye contact", "Appears stated age",
        "Disheveled", "Poor hygiene", "Odorous", "Avoidant eye contact",
        "Tense posture", "Postural guarding", "Malnourished", "Frail"
    )

    val behaviorOptions = listOf(
        "Cooperative", "Calm", "Normal motor activity", "Responsive",
        "Psychomotor agitation", "Restless / pacing", "Fidgety", "Guarded",
        "Hostile", "Tremors", "Compulsive habits", "Psychomotor slowing"
    )

    val speechOptions = listOf(
        "Normative rate & rhythm", "Clear articulation", "Spontaneous",
        "Pressured speech", "Rapid speech", "Slow & hesitant", "Monotone",
        "Soft / whispered", "Loud", "Slurred", "Silent / mute"
    )

    val moodOptions = listOf(
        "Euthymic mood", "Anxious / worried", "Depressed mood", "Irritable",
        "Euphoric mood", "Apathetic", "Dysphoric", "Hopeless", "Apprehensive"
    )

    val affectOptions = listOf(
        "Congruent affect", "Full range affect", "Constricted affect",
        "Blunted / flat affect", "Labile / shifting affect", "Incongruent affect",
        "Somatic expression of anxiety"
    )

    val cognitiveOptions = listOf(
        "Logical / goal-directed", "Focused attention", "Alert and oriented",
        "Tangential thinking", "Circumstantial thinking", "Flight of ideas",
        "Loose associations", "Thought blocking", "Delusional traits",
        "Obsessive themes", "Hallucinations", "Distractible attention",
        "Suicidal ideation present", "No active suicidal thoughts"
    )

    val judgmentOptions = listOf(
        "Socially sound and safe", "Impaired social judgment", "Poor risk evaluation",
        "Intact test judgment capacity", "Impulsive decision-making"
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("digital_mse_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Digital Mental Status Examination", Icons.Default.Assignment)
        }

        // Intake Patient Selector
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Intake Patient Selection:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(6.dp))
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

        // Profile Quick-Loaders
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.3f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text("Symptom Base Templater (One-Tap Load):", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                    }
                    Text("Instantly load clinical baseline profiles to accelerate structured documenting.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        InputChip(
                            selected = false,
                            onClick = {
                                appearanceState = "Well-groomed, appropriate attire, good eye contact"
                                behaviorState = "Cooperative, normal motor activity"
                                speechState = "Normative rate & rhythm, clear articulation, spontaneous"
                                moodCheckState = "Euthymic mood"
                                affectCheckState = "Congruent affect, full range affect"
                                attentionState = "Logical / goal-directed, focused attention, alert and oriented"
                                insightRating = 5f
                                judgmentState = "Socially sound and safe"
                                commentsState = "Intact normative parameters. Patient coordinates and communicates with optimal cognitive baseline."
                                Toast.makeText(context, "Normative Stable Template loaded", Toast.LENGTH_SHORT).show()
                            },
                            label = { Text("Normative Stable (Healthy)", fontSize = 11.sp) }
                        )

                        InputChip(
                            selected = false,
                            onClick = {
                                appearanceState = "Disheveled, poor hygiene, avoidant eye contact"
                                behaviorState = "Psychomotor slowing, lethargic / slowed, guarded"
                                speechState = "Slow & hesitant, soft / whispered, monotone"
                                moodCheckState = "Depressed mood, hopeless"
                                affectCheckState = "Constricted affect, blunted / flat affect"
                                attentionState = "Tangential thinking, poor concentration"
                                insightRating = 3f
                                judgmentState = "Impaired social judgment, poor risk evaluation"
                                commentsState = "Persistent somatic sad posture. Restless and fatigue are highly apparent."
                                Toast.makeText(context, "Major Depressive Profile loaded", Toast.LENGTH_SHORT).show()
                            },
                            label = { Text("Major Depressive Profile", fontSize = 11.sp) }
                        )

                        InputChip(
                            selected = false,
                            onClick = {
                                appearanceState = "Tense posture, postural guarding, poor eye contact"
                                behaviorState = "Fidgety, restless / pacing, tremors"
                                speechState = "Rapid speech, slow & hesitant, soft / whispered"
                                moodCheckState = "Anxious / worried"
                                affectCheckState = "Constricted affect, somatic expression of anxiety"
                                attentionState = "Circumstantial thinking, distractible attention, poor concentration"
                                insightRating = 4f
                                judgmentState = "Intact test judgment capacity"
                                commentsState = "Patient exhibits continuous muscle guarding and rapid respiratory cadence."
                                Toast.makeText(context, "Panic / High Anxiety Template loaded", Toast.LENGTH_SHORT).show()
                            },
                            label = { Text("Acute Anxious Profile", fontSize = 11.sp) }
                        )

                        InputChip(
                            selected = false,
                            onClick = {
                                appearanceState = "Bizarre attire, bright colors, intense / staring eye contact"
                                behaviorState = "Psychomotor agitation, restless / pacing, fidgety"
                                speechState = "Pressured speech, rapid speech, loud"
                                moodCheckState = "Euphoric mood, irritable"
                                affectCheckState = "Labile / shifting affect, incongruent affect"
                                attentionState = "Flight of ideas, loose associations, delusional traits, distractible attention"
                                insightRating = 1f
                                judgmentState = "Poor risk evaluation, impulsive decision-making"
                                commentsState = "Expansiveness prominent. Speech rate is elevated, racing streams."
                                Toast.makeText(context, "Acute Mania Template loaded", Toast.LENGTH_SHORT).show()
                            },
                            label = { Text("Manic Episode Profile", fontSize = 11.sp) }
                        )
                    }
                }
            }
        }

        // STRUCTURED CHECKLIST GROUP PANELS
        item {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // 1. Appearance & Hygiene
                MseChecklistGroup(
                    title = "1. Appearance & Hygiene",
                    icon = Icons.Default.Face,
                    currentText = appearanceState,
                    onTextChange = { appearanceState = it },
                    checklistOptions = appearanceOptions,
                    placeholder = "Describe attire, hygiene, eye contact, physical presentation...",
                    tag = "mse_appearance_input"
                )

                // 2. Behavior & Motor activity
                MseChecklistGroup(
                    title = "2. Motor Activity & Behavior",
                    icon = Icons.Default.DirectionsRun,
                    currentText = behaviorState,
                    onTextChange = { behaviorState = it },
                    checklistOptions = behaviorOptions,
                    placeholder = "Describe posture, rapport, physical gestures, cooperativeness...",
                    tag = "mse_behavior_input"
                )

                // 3. Speech Characteristics
                MseChecklistGroup(
                    title = "3. Speech Patterns",
                    icon = Icons.Default.RecordVoiceOver,
                    currentText = speechState,
                    onTextChange = { speechState = it },
                    checklistOptions = speechOptions,
                    placeholder = "Describe speech rate, cadence, production volume, flow...",
                    tag = "mse_speech_input"
                )

                // 4. Mood (Subjective State)
                MseChecklistGroup(
                    title = "4a. Mood (Patient's Subjective Report)",
                    icon = Icons.Default.EmojiEmotions,
                    currentText = moodCheckState,
                    onTextChange = { moodCheckState = it },
                    checklistOptions = moodOptions,
                    placeholder = "Describe inner feeling, self-reported states (e.g., sad, happy, nervous)...",
                    tag = "mse_mood_input"
                )

                // 5. Affect (Observed Expression)
                MseChecklistGroup(
                    title = "4b. Affect (Clinician's Observation)",
                    icon = Icons.Default.Visibility,
                    currentText = affectCheckState,
                    onTextChange = { affectCheckState = it },
                    checklistOptions = affectOptions,
                    placeholder = "Describe observed emotional range, intensity, congruency...",
                    tag = "mse_affect_input"
                )

                // 6. Cognitive / Thought Processes & Attention
                MseChecklistGroup(
                    title = "5. Cognitive & Thought Processes",
                    icon = Icons.Default.Psychology,
                    currentText = attentionState,
                    onTextChange = { attentionState = it },
                    checklistOptions = cognitiveOptions,
                    placeholder = "Describe stream of thought, focus, associations, attention capacity...",
                    tag = "mse_cognitive_input"
                )

                // 7. Clinical Judgment Checklist
                MseChecklistGroup(
                    title = "6. Judgment Appraisal",
                    icon = Icons.Default.Gavel,
                    currentText = judgmentState,
                    onTextChange = { judgmentState = it },
                    checklistOptions = judgmentOptions,
                    placeholder = "Describe safety patterns, decision quality, testing behavior...",
                    tag = "mse_judgment_input"
                )

                // 8. Patient Insight Grade Segment
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.LockOpen, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("7. Patient Insight Rating (Grade 1 - 6)", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Score Grade ${insightRating.toInt()}: " + when(insightRating.toInt()) {
                                1 -> "Complete denial of illness."
                                2 -> "Slight awareness but denying."
                                3 -> "Awareness but blaming external factors."
                                4 -> "Intellectual awareness (knows he is ill but no changes)."
                                5 -> "True intellectual insight."
                                else -> "True emotional insight with deep somatic action."
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
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

                // 9. Descriptive Comments
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Additional Clinical Notes / Perceived Anomalies:",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = commentsState,
                            onValueChange = { commentsState = it },
                            placeholder = { Text("Enter supplementary clinical insights...", fontSize = 12.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }
            }
        }

        // Formulate Action Panel
        item {
            Button(
                onClick = {
                    if (activePatient != null) {
                        viewModel.triggerAiMseNarrative(
                            patientId = activePatient.id,
                            appearance = appearanceState,
                            behavior = behaviorState,
                            speech = speechState,
                            mood = "Subjective mood: $moodCheckState; Observed affect: $affectCheckState",
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
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
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
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("Synthesized Examination Block:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        SelectionContainer {
                            Text(
                                text = aiResultText,
                                style = MaterialTheme.typography.bodyMedium,
                                lineHeight = 20.sp,
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }
    }
}

// --- D. DIAGNOSTIC ASSISTANT ---
@Composable
fun DiagnosticsScreen(viewModel: PsyPyrusViewModel) {

    val localDiagnosticResults by viewModel.localDiagnosticResults.collectAsStateWithLifecycle()
    val clinicalTrials by viewModel.clinicalTrials.collectAsStateWithLifecycle()
    val isTrialsLoading by viewModel.isTrialsLoading.collectAsStateWithLifecycle()
    val activePatientId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val activePatient = patients.firstOrNull { it.id == activePatientId }

    // --- OFFLINE CHECKER STATES ---
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

    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()
    val icdSearchResults by viewModel.icdSearchResults.collectAsStateWithLifecycle()
    val isIcdLoading by viewModel.isIcdLoading.collectAsStateWithLifecycle()
    val context = LocalContext.current

    var icdSearchQuery by remember { mutableStateOf("") }

    // Symptoms inputs for AI Companion
    var symptomsInput by remember { mutableStateOf("Chronic sadness, diminished interest in code development, waking at 3:00 AM, heavy self-criticism, difficulty concentrating.") }
    var mseFindings by remember { mutableStateOf("Poor eye contact, restricted sad affect range, psychomotor slowing.") }

    // Tab Selection state (0: DSM-5 Lookup Guide, 1: AI Clinical Copilot)
    var activeDiagnosticMode by remember { mutableStateOf(0) }

    // Search and Categorization state for DSM Guide
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All Disorders") }
    var expandedDisorderName by remember { mutableStateOf<String?>(null) }

    // Dynamic Criteria Checklist Check state
    val criteriaChecks = remember { mutableStateMapOf<String, Boolean>() }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("diagnostics_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("DSM-5-TR & ICD-10 Diagnostic Workspace", Icons.Default.Troubleshoot)
        }

        // Sub-Navigation Tabs
        item {
                        TabRow(selectedTabIndex = activeDiagnosticMode) {
                Tab(
                    selected = activeDiagnosticMode == 0,
                    onClick = { activeDiagnosticMode = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("DSM-5 & ICD-10 Lookup", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    },
                    modifier = Modifier.testTag("tab_dsm_lookup")
                )
                Tab(
                    selected = activeDiagnosticMode == 1,
                    onClick = { activeDiagnosticMode = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.FactCheck, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("Rule-Based Checker & Trials", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    },
                    modifier = Modifier.testTag("tab_rule_checker")
                )
                Tab(
                    selected = activeDiagnosticMode == 2,
                    onClick = { activeDiagnosticMode = 2 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("AI Differential Companion", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    },
                    modifier = Modifier.testTag("tab_ai_differential")
                )
            }
        }

        // TAB CONTENT
        if (activeDiagnosticMode == 0) {
            // --- 1. DSM-5 & ICD-10 Direct Search Lookup Engine ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Interactive Criterion Lookup Engine",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            "Quick scan diagnostic criteria thresholds, billing codes, and differential parameters.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { 
                                searchQuery = it 
                                expandedDisorderName = null
                            },
                            placeholder = { Text("Search by symptom (e.g., fatigue, sleep) or disorder name...") },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search Icon", tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                            trailingIcon = {
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(onClick = { searchQuery = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = "Clear Search")
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().testTag("diagnostics_search_query"),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Category Chips Scroll Row
                        Text("Category Filters:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            DsmDatabase.categories.forEach { cat ->
                                FilterChip(
                                    selected = selectedCategory == cat,
                                    onClick = { 
                                        selectedCategory = cat 
                                        expandedDisorderName = null
                                    },
                                    label = { Text(cat, fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                }
            }

            // List matching results
            val filteredDisorders = DsmDatabase.disorders.filter { dis ->
                val matchesCategory = (selectedCategory == "All Disorders" || dis.category == selectedCategory)
                val matchesQuery = if (searchQuery.isEmpty()) true else {
                    dis.name.lowercase().contains(searchQuery.lowercase()) ||
                    dis.briefDescription.lowercase().contains(searchQuery.lowercase()) ||
                    dis.symptomsKeywords.any { it.lowercase().contains(searchQuery.lowercase()) }
                }
                matchesCategory && matchesQuery
            }

            if (filteredDisorders.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp).fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.SearchOff,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                "No DSM-5 disorders match your search criteria.",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "Try general symptoms like 'sadness', 'sleep', 'worry' or another category filter.",
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            } else {
                item {
                    Text(
                        "Clinical Entries Found: ${filteredDisorders.size}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                items(filteredDisorders) { dis ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .animateContentSize(),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(
                            modifier = Modifier
                                .clickable {
                                    expandedDisorderName = if (expandedDisorderName == dis.name) null else dis.name
                                }
                                .padding(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = dis.name,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(
                                            text = "Category: ${dis.category}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Text(
                                            text = "•",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = "ICD-10: ${dis.icd10Code}",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                IconButton(onClick = {
                                    expandedDisorderName = if (expandedDisorderName == dis.name) null else dis.name
                                }) {
                                    Icon(
                                        imageVector = if (expandedDisorderName == dis.name) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = "Expand details"
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = dis.briefDescription,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = if (expandedDisorderName == dis.name) Int.MAX_VALUE else 2,
                                lineHeight = 16.sp
                            )

                            if (expandedDisorderName == dis.name) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                                Spacer(modifier = Modifier.height(12.dp))

                                // Dynamic Twin Code Badges
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(10.dp).fillMaxWidth(),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("ICD-10 CLINICAL CODE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                            Text(dis.icd10Code, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                        }
                                    }

                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(10.dp).fillMaxWidth(),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("DSM-5 MANUAL CODE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                            Text(dis.dsmCode, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Detailed Criteria Checklist Workstation
                                Text("DSM-5-TR Evaluation Standard:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = dis.criteriaSummary,
                                    fontSize = 12.sp,
                                    lineHeight = 17.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                // Interactive Criteria Assessment Grid
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            "Criteria Sourcing Checklist (Meets if ≥ ${dis.minCriteriaRequired} items checked):",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))

                                        var checkedCount = 0
                                        dis.criteriaList.forEachIndexed { sIdx, crit ->
                                            val key = "${dis.name}_$sIdx"
                                            val isChecked = criteriaChecks[key] ?: false
                                            if (isChecked) checkedCount++

                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clickable { criteriaChecks[key] = !isChecked }
                                                    .padding(vertical = 4.dp),
                                                verticalAlignment = Alignment.Top
                                            ) {
                                                Checkbox(
                                                    checked = isChecked,
                                                    onCheckedChange = { criteriaChecks[key] = it },
                                                    modifier = Modifier.size(24.dp)
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = crit,
                                                    fontSize = 11.sp,
                                                    lineHeight = 14.sp,
                                                    color = if (isChecked) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(12.dp))
                                        Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                                        Spacer(modifier = Modifier.height(8.dp))

                                        // Dynamic checklist metrics
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "Matched criteria: $checkedCount of ${dis.criteriaList.size}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )

                                            val meetsThreshold = checkedCount >= dis.minCriteriaRequired
                                            SuggestionChip(
                                                onClick = {},
                                                label = {
                                                    Text(
                                                        text = if (meetsThreshold) "Diagnostic Threshold Met!" else "${dis.minCriteriaRequired - checkedCount} More Required",
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                },
                                                colors = SuggestionChipDefaults.suggestionChipColors(
                                                    containerColor = if (meetsThreshold) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                                                    labelColor = if (meetsThreshold) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Differential & Comorbidities mapping
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Differential Diagnoses:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        dis.differentials.forEach { diff ->
                                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
                                                Icon(Icons.Default.Compare, contentDescription = null, modifier = Modifier.size(11.dp), tint = MaterialTheme.colorScheme.primary)
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(diff, fontSize = 10.sp, lineHeight = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            }
                                        }
                                    }

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Common Comorbidities:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        dis.comorbidities.forEach { comorbid ->
                                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
                                                Icon(Icons.Default.Link, contentDescription = null, modifier = Modifier.size(11.dp), tint = MaterialTheme.colorScheme.secondary)
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(comorbid, fontSize = 10.sp, lineHeight = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Recommended Interventions
                                Text("Evidenced Practice Interventions:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    dis.interventions.forEach { action ->
                                        SuggestionChip(
                                            onClick = {},
                                            label = { Text(action, fontSize = 9.sp) }
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Actions: Copy Criteria Report or Direct to AI Assistant
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = {
                                            val currentCheckedCount = dis.criteriaList.filterIndexed { idx, _ -> criteriaChecks["${dis.name}_$idx"] == true }.size
                                            val fullCriteriaText = """
                                                DIAGNOSTIC CRITERIA SUMMARY REPORT
                                                Disorder: ${dis.name}
                                                DSM-5 Code: ${dis.dsmCode}  |  ICD-10 Code: ${dis.icd10Code}
                                                Category: ${dis.category}
                                                ----------------------------------------
                                                Observed checklist status:
                                                ${dis.criteriaList.mapIndexed { idx, valStr ->
                                                    val isCheck = criteriaChecks["${dis.name}_$idx"] == true
                                                    "  [${if (isCheck) "X" else " "}] $valStr"
                                                }.joinToString("\n")}
                                                Checked count: $currentCheckedCount (Goal >= ${dis.minCriteriaRequired})
                                                Threshold Met: ${currentCheckedCount >= dis.minCriteriaRequired}
                                                ----------------------------------------
                                                Differentials: ${dis.differentials.joinToString(", ")}
                                                Comorbidities: ${dis.comorbidities.joinToString(", ")}
                                                Interventions: ${dis.interventions.joinToString(", ")}
                                            """.trimIndent()
                                            val clipboard = context.getSystemService(android.content.ClipboardManager::class.java)
                                            val clip = android.content.ClipData.newPlainText("DSM SOAP Criterion", fullCriteriaText)
                                            clipboard.setPrimaryClip(clip)
                                            Toast.makeText(context, "${dis.name} criteria scorecard copied!", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.weight(1f).height(38.dp)
                                    ) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Copy Criteria Report", fontSize = 11.sp)
                                    }

                                    Button(
                                        onClick = {
                                            symptomsInput = "Practitioner analyzing patient presenting features matching ${dis.name}: ${dis.briefDescription}. Specifically assessing symptoms list."
                                            mseFindings = "Psychomotor indicators hinting at DSM ${dis.dsmCode} / ICD-10 ${dis.icd10Code}."
                                            activeDiagnosticMode = 1 // Switch automatically to AI Differential Companion!
                                            Toast.makeText(context, "Parameters compiled to AI Differential!", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.weight(1.3f).height(38.dp)
                                    ) {
                                        Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Compile into AI Analyst", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "WHO ICD-11 Official Registry Search",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            "Directly query the World Health Organization classification database. Falls back to offline registry on network loss.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = icdSearchQuery,
                                onValueChange = { icdSearchQuery = it },
                                placeholder = { Text("Query ICD-11 (e.g. Depressive, Panic, GAD)...") },
                                modifier = Modifier.weight(1f).testTag("icd11_search_query_input"),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )
                            Button(
                                onClick = { viewModel.searchIcd11(icdSearchQuery) },
                                modifier = Modifier.height(56.dp).testTag("icd11_search_button"),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                if (isIcdLoading) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp),
                                        color = MaterialTheme.colorScheme.onPrimary,
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Icon(Icons.Default.Search, contentDescription = "Search WHO")
                                }
                            }
                        }

                        if (icdSearchResults.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "WHO ICD-11 Registry Matches:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                icdSearchResults.forEach { res ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(12.dp).fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                    Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                                                        Text(res.code, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                                    }
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        res.title,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 13.sp,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                }
                                                if (res.uri.isNotEmpty()) {
                                                    Spacer(modifier = Modifier.height(2.dp))
                                                    Text(
                                                        res.uri,
                                                        fontSize = 10.sp,
                                                        color = MaterialTheme.colorScheme.secondary,
                                                        lineHeight = 12.sp
                                                    )
                                                }
                                            }
                                            IconButton(
                                                onClick = {
                                                    val clipboard = context.getSystemService(android.content.ClipboardManager::class.java)
                                                    val clip = android.content.ClipData.newPlainText("ICD-11 Code", "${res.code}: ${res.title}")
                                                    clipboard.setPrimaryClip(clip)
                                                    Toast.makeText(context, "ICD-11 Code Copied!", Toast.LENGTH_SHORT).show()
                                                }
                                            ) {
                                                Icon(Icons.Default.ContentCopy, contentDescription = "Copy Code", modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (!isIcdLoading && icdSearchQuery.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "No matches found in WHO registry or local fallback.",
                                fontSize = 12.sp,
                                color = Color.Gray,
                                fontStyle = FontStyle.Italic
                            )
                        }
                    }
                }
            }
        }
        else if (activeDiagnosticMode == 1) {
            // --- 2. OFFLINE RULE-BASED CHECKER & TRIALS ---
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
        } else {
            // --- 3. AI CLINICAL DIFFERENTIAL COMPANION ---
            // --- 2. AI CLINICAL DIFFERENTIAL COMPANION ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "AI Diagnostic Formulation Assistant",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            "Perform real-time symptom matches using generative models to assist with differential selections and documentation.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Presenting Somatic & Cognitive Symptoms:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = symptomsInput,
                            onValueChange = { symptomsInput = it },
                            modifier = Modifier.fillMaxWidth().testTag("diagnostics_symptoms_input"),
                            placeholder = { Text("Enter observed custom clinical symptoms...") }
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Psychiatric MSE Findings & Direct Observations:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = mseFindings,
                            onValueChange = { mseFindings = it },
                            modifier = Modifier.fillMaxWidth().testTag("diagnostics_mse_findings_input"),
                            placeholder = { Text("Describe speech, affect, motor movements...") }
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Suggest pre-filled samples
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Or load sample presenting profiles:",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            AssistChip(
                                onClick = {
                                    symptomsInput = "Excessive, uncontrollable worry about career performance, kid safety, and financial savings. Present more days than not for 8 months. Keyed up, somatic back tension, sleep onset delays weekly."
                                    mseFindings = "Alert, co-operative. Muscle guarding noted. Anxious affect range."
                                },
                                label = { Text("Severe Worry (GAD)") }
                            )
                            AssistChip(
                                onClick = {
                                    symptomsInput = "Difficulty paying attention at university. Keeps dropping keys, misplacing lecture notes, making careless errors in lab assignments, fidgeting constantly, hyper-restlessness."
                                    mseFindings = "Fidgety motor activity during intake, speech rate normal but easily distracted."
                                },
                                label = { Text("Inattention (ADHD)") }
                            )
                            AssistChip(
                                onClick = {
                                    symptomsInput = "Sudden, intrusive traumatic nightmares of motor vehicle accident. Avoiding highway routes fully. Hypervigilance, scanning tunnels, detached from peer group."
                                    mseFindings = "Guarded, tense posture, physiological distress when mentioning route avoidance."
                                },
                                label = { Text("Intrusion (PTSD)") }
                            )
                        }
                    }
                }
            }

            item {
                Button(
                    onClick = { viewModel.triggerDiagnosticAssistant(symptomsInput, mseFindings) },
                    modifier = Modifier.fillMaxWidth().testTag("assess_diagnostics_button").height(48.dp),
                    enabled = !isAiLoading
                ) {
                    if (isAiLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Icon(imageVector = Icons.Default.Rule, contentDescription = "Assess")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Formulate Diagnostic Suggestions with Gemini")
                    }
                }
            }

            if (aiResultText.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Generative Diagnostic Appraisal", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                                Badge(containerColor = SoftGreen) {
                                    Text("High Confidence", fontSize = 10.sp, color = Color.White, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            SelectionContainer {
                                Text(
                                    text = aiResultText,
                                    fontSize = 13.sp,
                                    lineHeight = 20.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.testTag("ai_result_output")
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- E. TELETHERAPY CLIENT & SESSION ---


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
data class MonthInfo(val name: String, val year: Int, val startDayOfWeek: Int, val daysCount: Int, val monthVal: Int)

@Composable
fun TreatmentPlannerScreen(viewModel: PsyPyrusViewModel) {
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val isAiLoading by viewModel.isAiLoading.collectAsStateWithLifecycle()
    val aiResultText by viewModel.aiResultText.collectAsStateWithLifecycle()

    val availabilitySlots by viewModel.availabilitySlots.collectAsStateWithLifecycle()
    val loggedInUser by viewModel.loggedInUser.collectAsStateWithLifecycle()
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()

    var goalConfigTitle by remember { mutableStateOf("Improve sleep pacing routines / CBT-I") }
    var goalConfigDesc by remember { mutableStateOf("Complete daily abdominal breathing guides and sleep notebook.") }

    var plannerSubTab by remember { mutableStateOf(1) } // Default to 1 (Calendar & Session Slots) for immediate visibility
    
    // Calendar states
    var selectedDateString by remember { mutableStateOf("2026-06-09") } // June 9, 2026 is current local date
    var currentMonthIndex by remember { mutableStateOf(1) } // June 2026

    val monthsList = remember {
        listOf(
            MonthInfo("May", 2026, 5, 31, 5),
            MonthInfo("June", 2026, 1, 30, 6),
            MonthInfo("July", 2026, 3, 31, 7)
        )
    }

    // Booking states
    var selectedSlotForBooking by remember { mutableStateOf<AvailabilitySlot?>(null) }
    var bookingPatient by remember { mutableStateOf<Patient?>(null) }
    var bookingNotes by remember { mutableStateOf("Cognitive Behavioral Assessment") }
    var bookingIsVideo by remember { mutableStateOf(true) }
    var bookingFee by remember { mutableStateOf("150.0") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("planner_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Care Planner & Professional Scheduler", Icons.Default.CalendarMonth)
        }

        // Sub-navigation view switcher
        item {
            TabRow(
                selectedTabIndex = plannerSubTab,
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)),
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                Tab(
                    selected = plannerSubTab == 0,
                    onClick = { plannerSubTab = 0 },
                    text = { Text("🎯 CBT goals", maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    icon = { Icon(Icons.Default.ModelTraining, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
                Tab(
                    selected = plannerSubTab == 1,
                    onClick = { plannerSubTab = 1 },
                    text = { Text("📅 Practice Scheduler", maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    icon = { Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
            }
        }

        when (plannerSubTab) {
            0 -> { // SUBTAB 0: SMART GOALS
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
            }

            1 -> { // SUBTAB 1: PRACTICE CALENDAR SCHEDULER
                val activeMonth = monthsList[currentMonthIndex]
                
                // MONTH SELECTOR ROW
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkCharcoalSurf)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { if (currentMonthIndex > 0) currentMonthIndex-- },
                                enabled = currentMonthIndex > 0
                            ) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Prev Month", tint = if (currentMonthIndex > 0) Color.White else Color.Gray)
                            }
                            
                            Text(
                                text = "${activeMonth.name} ${activeMonth.year}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color.White
                            )

                            IconButton(
                                onClick = { if (currentMonthIndex < monthsList.size - 1) currentMonthIndex++ },
                                enabled = currentMonthIndex < monthsList.size - 1
                            ) {
                                Icon(Icons.Default.ArrowForward, contentDescription = "Next Month", tint = if (currentMonthIndex < monthsList.size - 1) Color.White else Color.Gray)
                            }
                        }
                    }
                }

                // 7-COLUMN MONTHLY CALENDAR GRID
                item {
                    val daysGrid = remember(currentMonthIndex) {
                        val list = mutableListOf<Int?>()
                        for (i in 0 until activeMonth.startDayOfWeek) {
                            list.add(null)
                        }
                        for (day in 1..activeMonth.daysCount) {
                            list.add(day)
                        }
                        list
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = DarkCharcoalBg.copy(alpha = 0.5f)),
                        border = BorderStroke(1.dp, CardBorderDark)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            // Weekday Headings
                            Row(modifier = Modifier.fillMaxWidth()) {
                                val weekdays = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
                                weekdays.forEach { h ->
                                    Text(
                                        text = h,
                                        modifier = Modifier.weight(1f),
                                        textAlign = TextAlign.Center,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.LightGray
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            // Weeks Grid
                            val weeks = daysGrid.chunked(7)
                            weeks.forEach { week ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    week.forEach { day ->
                                        if (day == null) {
                                            Box(modifier = Modifier.weight(1f).aspectRatio(1f))
                                        } else {
                                            val dateKey = String.format("%04d-%02d-%02d", activeMonth.year, activeMonth.monthVal, day)
                                            val isSelected = dateKey == selectedDateString
                                            
                                            // Get slot indicators
                                            val daySlots = availabilitySlots.filter { it.dateString == dateKey }
                                            val openCount = daySlots.filter { !it.isBooked }.size
                                            val bookedCount = daySlots.filter { it.isBooked }.size
                                            
                                            val cellBg = when {
                                                isSelected -> MaterialTheme.colorScheme.primary
                                                bookedCount > 0 -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)
                                                openCount > 0 -> SoftGreen.copy(alpha = 0.15f)
                                                else -> Color.Transparent
                                            }
                                            
                                            val cellBorder = when {
                                                isSelected -> BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
                                                openCount > 0 -> BorderStroke(1.dp, SoftGreen.copy(alpha = 0.5f))
                                                bookedCount > 0 -> BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
                                                else -> BorderStroke(1.dp, Color.Gray.copy(alpha = 0.15f))
                                            }

                                            Card(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .aspectRatio(1f)
                                                    .clickable { 
                                                        selectedDateString = dateKey
                                                        selectedSlotForBooking = null // reset booking form context
                                                    },
                                                colors = CardDefaults.cardColors(containerColor = cellBg),
                                                border = cellBorder,
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                                                        Text(
                                                            text = day.toString(),
                                                            fontSize = 13.sp,
                                                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                                                            color = if (isSelected) Color.White else Color.White.copy(alpha = 0.9f)
                                                        )
                                                        if (daySlots.isNotEmpty() && !isSelected) {
                                                            Row(
                                                                horizontalArrangement = Arrangement.spacedBy(2.dp),
                                                                verticalAlignment = Alignment.CenterVertically
                                                            ) {
                                                                if (bookedCount > 0) {
                                                                    Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
                                                                }
                                                                if (openCount > 0) {
                                                                    Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(SoftGreen))
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    // Padding columns
                                    if (week.size < 7) {
                                        for (idx in 0 until (7 - week.size)) {
                                            Box(modifier = Modifier.weight(1f).aspectRatio(1f))
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                            }
                        }
                    }
                }

                // PROFESSIONAL: SET AVAILABILITY ROW
                if (activeRole == "Professional") {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = DarkCharcoalSurf.copy(alpha = 0.6f)),
                            border = BorderStroke(1.dp, CardBorderDark)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(Icons.Default.Timer, contentDescription = null, tint = SoftGreen)
                                    Text("Set Availability for $selectedDateString", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                                }
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "Tap an hour slot to register or release clinical availability. Green slots represent open booking times for clients.",
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                // Standard scheduling hours scroll
                                val standardHours = listOf("09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM")
                                val daySlots = availabilitySlots.filter { it.dateString == selectedDateString }
                                
                                Row(
                                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    standardHours.forEach { hrs ->
                                        val existing = daySlots.find { it.timeSlot == hrs }
                                        val isCreated = existing != null
                                        val isBooked = existing?.isBooked == true
                                        
                                        val chipBg = when {
                                            isBooked -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                                            isCreated -> SoftGreen.copy(alpha = 0.15f)
                                            else -> Color.Transparent
                                        }
                                        val chipBorder = when {
                                            isBooked -> MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)
                                            isCreated -> SoftGreen
                                            else -> Color.Gray.copy(alpha = 0.3f)
                                        }
                                        val textCol = when {
                                            isBooked -> MaterialTheme.colorScheme.onPrimaryContainer
                                            isCreated -> SoftGreen
                                            else -> Color.Gray
                                        }

                                        Box(
                                            modifier = Modifier
                                                .height(38.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(chipBg)
                                                .border(1.dp, chipBorder, RoundedCornerShape(8.dp))
                                                .clickable {
                                                    if (isBooked) {
                                                        // Cannot remove/toggle booked slots from quick bar, manage list instead
                                                    } else {
                                                        val profName = loggedInUser?.fullName ?: "Dr. Katherine Brewster"
                                                        viewModel.toggleAvailabilitySlot(selectedDateString, hrs, profName)
                                                    }
                                                }
                                                .padding(horizontal = 12.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                Text(hrs, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = textCol)
                                                if (isBooked) {
                                                    Icon(Icons.Default.Lock, contentDescription = "Booked", modifier = Modifier.size(10.dp), tint = textCol)
                                                } else if (isCreated) {
                                                    Icon(Icons.Default.Check, contentDescription = "Active", modifier = Modifier.size(10.dp), tint = textCol)
                                                } else {
                                                    Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(10.dp), tint = textCol)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // INLINE DETAILED CLINICAL BOOKING DRAWER FORM
                selectedSlotForBooking?.let { slot ->
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().testTag("clinical_booking_card"),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.12f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Text("EHR Clinician Session Sync | ${slot.timeSlot}", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                                }
                                
                                Text("Assign Clinical Patient Target Profile:", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                Row(
                                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    patients.forEach { p ->
                                        val isSelected = bookingPatient?.id == p.id
                                        FilterChip(
                                            selected = isSelected,
                                            onClick = { bookingPatient = p },
                                            label = { Text(p.name, fontSize = 11.sp) }
                                        )
                                    }
                                }

                                OutlinedTextField(
                                    value = bookingNotes,
                                    onValueChange = { bookingNotes = it },
                                    label = { Text("Clinical Session Agenda Agenda", fontSize = 11.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp)
                                )

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Icon(Icons.Default.Videocam, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                                        Text("Teletherapy Video Link:", fontSize = 12.sp)
                                    }
                                    Switch(checked = bookingIsVideo, onCheckedChange = { bookingIsVideo = it })
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    OutlinedTextField(
                                        value = bookingFee,
                                        onValueChange = { bookingFee = it },
                                        label = { Text("Billed Fee Rate ($)", fontSize = 11.sp) },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true,
                                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp)
                                    )
                                    
                                    Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                val selPat = bookingPatient
                                                if (selPat != null) {
                                                    viewModel.bookSessionSlot(
                                                        slotId = slot.id,
                                                        patientId = selPat.id,
                                                        patientName = selPat.name,
                                                        notes = bookingNotes,
                                                        isVideo = bookingIsVideo,
                                                        fee = bookingFee.toDoubleOrNull() ?: 150.0
                                                    )
                                                    selectedSlotForBooking = null
                                                }
                                            },
                                            enabled = bookingPatient != null,
                                            modifier = Modifier.weight(1f).height(44.dp)
                                        ) {
                                            Text("Link Session", fontSize = 11.sp)
                                        }

                                        TextButton(
                                            onClick = { selectedSlotForBooking = null },
                                            modifier = Modifier.height(44.dp)
                                        ) {
                                            Text("Cancel", fontSize = 11.sp, color = SoftRed)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // REGISTERED SLOTS LIST FOR THE DAY
                item {
                    Text(
                        text = "Session Slots Registered • $selectedDateString",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White
                    )
                }

                val daySlots = availabilitySlots.filter { it.dateString == selectedDateString }
                if (daySlots.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.15f))
                        ) {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(Icons.Default.EventNote, contentDescription = null, modifier = Modifier.size(32.dp), tint = Color.Gray)
                                    Text("No sessions scheduled or availability registered on this date.", color = Color.Gray, fontSize = 12.sp, textAlign = TextAlign.Center)
                                    if (activeRole == "Professional") {
                                        Text("Toggle standard availability tags above to quick-create slots.", color = Color.Gray, fontSize = 10.sp, textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    items(daySlots) { slot ->
                        val isBooked = slot.isBooked
                        Card(
                            modifier = Modifier.fillMaxWidth().testTag("session_slot_item"),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, if (isBooked) MaterialTheme.colorScheme.primary.copy(alpha = 0.5f) else SoftGreen.copy(alpha = 0.5f)),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isBooked) DarkCharcoalSurf.copy(alpha = 0.5f) else SoftGreen.copy(alpha = 0.05f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(
                                            imageVector = if (slot.isVideo) Icons.Default.Videocam else Icons.Default.LocationOn,
                                            contentDescription = null,
                                            tint = if (isBooked) MaterialTheme.colorScheme.primary else SoftGreen,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Text(
                                            text = slot.timeSlot,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 15.sp,
                                            color = Color.White
                                        )
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(if (isBooked) MaterialTheme.colorScheme.primaryContainer else SoftGreen.copy(alpha = 0.2f))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = if (isBooked) "BOOKED" else "AVAILABLE OPEN",
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isBooked) MaterialTheme.colorScheme.onPrimaryContainer else SoftGreen
                                            )
                                        }
                                    }

                                    if (activeRole == "Professional" && !isBooked) {
                                        IconButton(onClick = { viewModel.removeAvailabilitySlot(slot.id) }) {
                                            Icon(Icons.Default.DeleteSweep, contentDescription = "Remove Slot", tint = SoftRed.copy(alpha = 0.8f))
                                        }
                                    }
                                }

                                if (isBooked) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = DarkCharcoalBg.copy(alpha = 0.4f)),
                                        shape = RoundedCornerShape(8.dp),
                                        border = BorderStroke(1.dp, CardBorderDark)
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                                                Text("EHR Sync Patient: ${slot.patientName}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.White)
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text("Clinical Notes agenda: ${slot.notes.ifBlank { "Standard Clinical Therapy Session" }}", fontSize = 11.sp, color = Color.Gray)
                                            Text("Billing rate contract: $${slot.fee} Billed", fontSize = 11.sp, color = Color.Gray)
                                            if (slot.isVideo) {
                                                Text("Telemedicine Gateway Node: SECURE-ROOM-${slot.id + 100}", fontSize = 11.sp, color = GoldAccent, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (activeRole == "Professional") {
                                            Button(
                                                onClick = {
                                                    viewModel.setSelectedPatient(slot.patientId ?: 1L)
                                                    viewModel.navigate("AI Copilot")
                                                },
                                                modifier = Modifier.height(34.dp).weight(1f),
                                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                            ) {
                                                Text("EHR File sync", fontSize = 11.sp)
                                            }

                                            if (slot.isVideo) {
                                                Button(
                                                    onClick = {
                                                        viewModel.setSelectedPatient(slot.patientId ?: 1L)
                                                        viewModel.navigate("Teletherapy")
                                                    },
                                                    modifier = Modifier.height(34.dp).weight(1f),
                                                    colors = ButtonDefaults.buttonColors(containerColor = TealSecondary)
                                                ) {
                                                    Text("Join Tele", fontSize = 11.sp)
                                                }
                                            }
                                        }

                                        Button(
                                            onClick = { viewModel.cancelBookedSessionSlot(slot.id) },
                                            modifier = Modifier.height(34.dp).weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = SoftRed)
                                        ) {
                                            Text("Cancel Book", fontSize = 11.sp)
                                        }
                                    }
                                } else {
                                    // Open slot workflow
                                    Spacer(modifier = Modifier.height(10.dp))
                                    if (activeRole == "Professional") {
                                        Button(
                                            onClick = {
                                                bookingPatient = patients.firstOrNull()
                                                selectedSlotForBooking = slot
                                                bookingNotes = "Standard cognitive session"
                                                bookingIsVideo = true
                                                bookingFee = "150.0"
                                            },
                                            modifier = Modifier.fillMaxWidth().height(36.dp)
                                        ) {
                                            Icon(Icons.Default.GroupAdd, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Assign EHR Client to Slot", fontSize = 11.sp)
                                        }
                                    } else {
                                        // Patient registers themselves!
                                        val curPatientName = loggedInUser?.fullName ?: "Liam Carter"
                                        Button(
                                            onClick = {
                                                val lookupPatient = patients.find { it.name.contains(curPatientName, ignoreCase = true) } ?: patients.firstOrNull()
                                                if (lookupPatient != null) {
                                                    viewModel.bookSessionSlot(
                                                        slotId = slot.id,
                                                        patientId = lookupPatient.id,
                                                        patientName = lookupPatient.name,
                                                        notes = "Booked by client via patient portal",
                                                        isVideo = true,
                                                        fee = 150.0
                                                    )
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = SoftGreen),
                                            modifier = Modifier.fillMaxWidth().height(36.dp)
                                        ) {
                                            Icon(Icons.Default.Event, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Schedule Appointment Here", fontSize = 11.sp)
                                        }
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
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
    var wellnessMode by remember { mutableStateOf(0) } // 0: Somatic Exercises, 1: Progress Analytics Dashboard
    
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

    var showDistressPanel by remember { mutableStateOf(false) }
    var distressLevel by remember { mutableStateOf(5f) }
    var distressNote by remember { mutableStateOf("") }
    
    var symTrembling by remember { mutableStateOf(false) }
    var symChestTightness by remember { mutableStateOf(false) }
    var symDread by remember { mutableStateOf(false) }
    var symHelplessness by remember { mutableStateOf(false) }
    
    var distressStatusMsg by remember { mutableStateOf("") }

    val moodLogs by viewModel.moodLogs.collectAsStateWithLifecycle()
    val allScores by viewModel.allScores.collectAsStateWithLifecycle()
    val selectedPatientId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()

    val activePatient = patients.find { it.id == selectedPatientId } ?: patients.firstOrNull()
    val activePatientId = activePatient?.id ?: 1L

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

        item {
            TabRow(selectedTabIndex = wellnessMode, modifier = Modifier.fillMaxWidth()) {
                Tab(
                    selected = wellnessMode == 0,
                    onClick = { wellnessMode = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Spa, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("Somatic Exercises")
                        }
                    },
                    modifier = Modifier.testTag("wellness_tab_exercises")
                )
                Tab(
                    selected = wellnessMode == 1,
                    onClick = { wellnessMode = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Timeline, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("Progress Dashboard")
                        }
                    },
                    modifier = Modifier.testTag("wellness_tab_dashboard")
                )
            }
        }

        if (wellnessMode == 0) {
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

            // ACUTE CRISIS DISTRESS SPIKE REGISTER
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(BorderStroke(1.dp, SoftRed.copy(alpha = 0.5f)), RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = if (showDistressPanel) SoftRed.copy(alpha = 0.04f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable { showDistressPanel = !showDistressPanel },
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = SoftRed)
                                Text("🚨 Log Acute Distress / Panic Spike", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = SoftRed)
                            }
                            Icon(
                                imageVector = if (showDistressPanel) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                tint = SoftRed
                            )
                        }
                        
                        if (showDistressPanel) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                "If you are experiencing severe somatic tightness, high-climbing panic waves, or acute helplessness, use this register to immediately notify your therapist.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Text("Rate Current Somatic/Anxiety Level (1 - 10): ${distressLevel.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Slider(
                                value = distressLevel,
                                onValueChange = { distressLevel = it },
                                valueRange = 1f..10f,
                                steps = 8,
                                colors = SliderDefaults.colors(
                                    thumbColor = SoftRed,
                                    activeTrackColor = SoftRed
                                )
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Active Somatic Symptoms:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = symTrembling, onCheckedChange = { symTrembling = it }, colors = CheckboxDefaults.colors(checkedColor = SoftRed))
                                    Text("Somatic Trembling or Shaking", fontSize = 12.sp)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = symChestTightness, onCheckedChange = { symChestTightness = it }, colors = CheckboxDefaults.colors(checkedColor = SoftRed))
                                    Text("Intense Somatic Chest Tightness", fontSize = 12.sp)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = symDread, onCheckedChange = { symDread = it }, colors = CheckboxDefaults.colors(checkedColor = SoftRed))
                                    Text("Acute Dread / Impending Panic Attack", fontSize = 12.sp)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = symHelplessness, onCheckedChange = { symHelplessness = it }, colors = CheckboxDefaults.colors(checkedColor = SoftRed))
                                    Text("Profound Emotional Helplessness", fontSize = 12.sp)
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = distressNote,
                                onValueChange = { distressNote = it },
                                label = { Text("What are you feeling right now? (Self-report description)") },
                                modifier = Modifier.fillMaxWidth().testTag("distress_note_input"),
                                shape = RoundedCornerShape(8.dp)
                            )
                            
                            Spacer(modifier = Modifier.height(14.dp))
                            Button(
                                onClick = {
                                    val syms = mutableListOf<String>()
                                    if (symTrembling) syms.add("Trembling")
                                    if (symChestTightness) syms.add("Chest Tightness")
                                    if (symDread) syms.add("Dread/Panic")
                                    if (symHelplessness) syms.add("Profound Helplessness")
                                    val symptomsStr = if (syms.isEmpty()) "None checked" else syms.joinToString(", ")
                                    
                                    viewModel.addMoodLog(
                                        score = if (distressLevel <= 5f) 3 else 2,
                                        note = "🚨 CRISIS distress logged. Anxiety level: ${distressLevel.toInt()}/10. Symptoms: $symptomsStr. Patient context: $distressNote",
                                        gratitude = "",
                                        breathingSec = 0
                                    )
                                    distressStatusMsg = "High-priority alert successfully secured in database & flagged to clinical dashboard."
                                    distressNote = ""
                                    symTrembling = false
                                    symChestTightness = false
                                    symDread = false
                                    symHelplessness = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = SoftRed),
                                modifier = Modifier.fillMaxWidth().testTag("submit_distress_button"),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Register Severe Stress Spike & Flag Therapist", fontWeight = FontWeight.Black)
                            }
                            
                            if (distressStatusMsg.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = distressStatusMsg,
                                    color = SoftRed,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
            }
        } else {
            // TAB 1: BRAND NEW RECHARTS-INSPIRED INTERACTIVE HISTORICAL CHART DASHBOARD
            item {
                InteractiveRechartsDashboard(
                    viewModel = viewModel,
                    activePatient = activePatient,
                    activePatientId = activePatientId,
                    moodLogs = moodLogs,
                    allScores = allScores
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InteractiveRechartsDashboard(
    viewModel: PsyPyrusViewModel,
    activePatient: Patient?,
    activePatientId: Long,
    moodLogs: List<MoodLog>,
    allScores: List<AssessmentScore>
) {
    val filteredMoodLogs = remember(moodLogs, activePatientId) {
        moodLogs.filter { it.patientId == activePatientId }.sortedBy { it.date }
    }
    val filteredScores = remember(allScores, activePatientId) {
        allScores.filter { it.patientId == activePatientId }.sortedBy { it.date }
    }

    val displayedMoods = remember(filteredMoodLogs) { filteredMoodLogs.takeLast(12) }
    val displayedScores = remember(filteredScores) { filteredScores.takeLast(8) }

    var chartType by remember { mutableStateOf(0) } // 0: Combined, 1: Daily Mood, 2: Assessment Scores
    var activeHoverPointMood by remember { mutableStateOf<MoodLog?>(null) }
    var activeHoverPointScore by remember { mutableStateOf<AssessmentScore?>(null) }
    var hoverX by remember { mutableStateOf(-1f) }

    val MoodColor = TealSecondary
    val AssessmentColor = IndigoPrimary

    val hasData = displayedMoods.isNotEmpty() || displayedScores.isNotEmpty()

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth().testTag("wellness_dashboard_card"),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Header Block
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Interactive Historical Wellness Center",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Aesthetic Recharts-inspired analytical tracking engine",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Badge(
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    ) {
                        Text(
                            "Recharts Style",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (!hasData) {
                    // Empty Trajectory placeholder
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Timeline,
                            contentDescription = null,
                            modifier = Modifier.size(56.dp),
                            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No Historical Progress Seeding Detected",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "We found no active logs recorded over multiple days for ${activePatient?.name ?: "this patient"}. Generative charts require historic logs to draw visual slopes.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.generateHistoricalWellnessData(activePatientId) },
                            modifier = Modifier.testTag("seed_historical_behavioral_data")
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Simulate 10-Day Recovery Course")
                        }
                    }
                } else {
                    // Legend Selector tabs
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        val options = listOf("Combined Track", "Daily Mood", "Assessments")
                        options.forEachIndexed { index, label ->
                            SegmentedButton(
                                selected = chartType == index,
                                onClick = {
                                    chartType = index
                                    activeHoverPointMood = null
                                    activeHoverPointScore = null
                                    hoverX = -1f
                                },
                                shape = SegmentedButtonDefaults.itemShape(index = index, count = options.size)
                            ) {
                                Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Line Chart Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (chartType == 0 || chartType == 1) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(MoodColor))
                                Text("Daily Mood Score (Left Y-Axis, 0-10)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        if (chartType == 0 || chartType == 2) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AssessmentColor))
                                Text("Assessments (Right Y-Axis, 0-27)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Interactive Custom Canvas Area Line Chart
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                    ) {
                        Canvas(
                            modifier = Modifier
                                .fillMaxSize()
                                .pointerInput(displayedMoods, displayedScores, chartType) {
                                    detectDragGestures(
                                        onDragStart = { offset -> hoverX = offset.x },
                                        onDragEnd = {
                                            hoverX = -1f
                                            activeHoverPointMood = null
                                            activeHoverPointScore = null
                                        },
                                        onDragCancel = {
                                            hoverX = -1f
                                            activeHoverPointMood = null
                                            activeHoverPointScore = null
                                        },
                                        onDrag = { change, _ ->
                                            change.consume()
                                            hoverX = change.position.x
                                        }
                                    )
                                }
                                .pointerInput(displayedMoods, displayedScores, chartType) {
                                    detectTapGestures(
                                        onPress = { offset ->
                                            hoverX = offset.x
                                            tryAwaitRelease()
                                            hoverX = -1f
                                            activeHoverPointMood = null
                                            activeHoverPointScore = null
                                        }
                                    )
                                }
                        ) {
                            val paddingLeft = 32.dp.toPx()
                            val paddingRight = 32.dp.toPx()
                            val paddingTop = 12.dp.toPx()
                            val paddingBottom = 24.dp.toPx()

                            val chartWidth = size.width - paddingLeft - paddingRight
                            val chartHeight = size.height - paddingTop - paddingBottom

                            // 1. Draw Grid lines and Y-axes labels
                            val gridCount = 5
                            for (i in 0..gridCount) {
                                val relativeY = paddingTop + (chartHeight / gridCount) * i
                                drawLine(
                                    color = Color.LightGray.copy(alpha = 0.3f),
                                    start = strokeRange(paddingLeft, relativeY),
                                    end = strokeRange(paddingLeft + chartWidth, relativeY),
                                    strokeWidth = 1f
                                )

                                // Left Labels (Mood scale)
                                val leftVal = (10 - (10f / gridCount) * i).roundToInt()
                                drawContext.canvas.nativeCanvas.drawText(
                                    leftVal.toString(),
                                    8f,
                                    relativeY + 4.dp.toPx(),
                                    android.graphics.Paint().apply {
                                        color = android.graphics.Color.GRAY
                                        textSize = 9.sp.toPx()
                                        textAlign = android.graphics.Paint.Align.LEFT
                                    }
                                )

                                // Right Labels (Assessments scale)
                                if (chartType == 0 || chartType == 2) {
                                    val rightVal = (27 - (27f / gridCount) * i).roundToInt()
                                    drawContext.canvas.nativeCanvas.drawText(
                                        rightVal.toString(),
                                        size.width - 24f,
                                        relativeY + 4.dp.toPx(),
                                        android.graphics.Paint().apply {
                                            color = android.graphics.Color.GRAY
                                            textSize = 9.sp.toPx()
                                            textAlign = android.graphics.Paint.Align.LEFT
                                        }
                                    )
                                }
                            }

                            // 2. Draw Curves
                            // Daily Mood Logic (translucent area + line)
                            if (displayedMoods.isNotEmpty() && (chartType == 0 || chartType == 1)) {
                                val stepX = chartWidth / (displayedMoods.size - 1).coerceAtLeast(1)
                                val path = Path()
                                val fillPath = Path()

                                displayedMoods.forEachIndexed { idx, m ->
                                    val x = paddingLeft + idx * stepX
                                    val y = paddingTop + chartHeight - (m.moodScore.toFloat() / 10f) * chartHeight
                                    
                                    if (idx == 0) {
                                        path.moveTo(x, y)
                                        fillPath.moveTo(x, paddingTop + chartHeight)
                                        fillPath.lineTo(x, y)
                                    } else {
                                        path.lineTo(x, y)
                                        fillPath.lineTo(x, y)
                                    }
                                }
                                val lastX = paddingLeft + chartWidth
                                fillPath.lineTo(lastX, paddingTop + chartHeight)
                                fillPath.close()

                                drawPath(
                                    path = fillPath,
                                    brush = Brush.verticalGradient(
                                        colors = listOf(MoodColor.copy(alpha = 0.25f), Color.Transparent),
                                        startY = paddingTop,
                                        endY = paddingTop + chartHeight
                                    )
                                )

                                drawPath(
                                    path = path,
                                    color = MoodColor,
                                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                                )
                            }

                            // Assessment Scores Logic (translucent area + line)
                            if (displayedScores.isNotEmpty() && (chartType == 0 || chartType == 2)) {
                                val stepX = chartWidth / (displayedScores.size - 1).coerceAtLeast(1)
                                val path = Path()
                                val fillPath = Path()

                                displayedScores.forEachIndexed { idx, s ->
                                    val x = paddingLeft + idx * stepX
                                    val y = paddingTop + chartHeight - (s.score.toFloat() / 27f) * chartHeight
                                    
                                    if (idx == 0) {
                                        path.moveTo(x, y)
                                        fillPath.moveTo(x, paddingTop + chartHeight)
                                        fillPath.lineTo(x, y)
                                    } else {
                                        path.lineTo(x, y)
                                        fillPath.lineTo(x, y)
                                    }
                                }
                                val lastX = paddingLeft + chartWidth
                                fillPath.lineTo(lastX, paddingTop + chartHeight)
                                fillPath.close()

                                drawPath(
                                    path = fillPath,
                                    brush = Brush.verticalGradient(
                                        colors = listOf(AssessmentColor.copy(alpha = 0.20f), Color.Transparent),
                                        startY = paddingTop,
                                        endY = paddingTop + chartHeight
                                    )
                                )

                                drawPath(
                                    path = path,
                                    color = AssessmentColor,
                                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                                )
                            }

                            // 3. Draw X-axis markings (Dates)
                            if (displayedMoods.isNotEmpty() && (chartType == 0 || chartType == 1)) {
                                val stepX = chartWidth / (displayedMoods.size - 1).coerceAtLeast(1)
                                displayedMoods.forEachIndexed { idx, m ->
                                    if (idx % 2 == 0 || idx == displayedMoods.lastIndex) {
                                        val x = paddingLeft + idx * stepX
                                        val str = SimpleDateFormat("dd MMM", Locale.getDefault()).format(Date(m.date))
                                        drawContext.canvas.nativeCanvas.drawText(
                                            str,
                                            x,
                                            paddingTop + chartHeight + 15.dp.toPx(),
                                            android.graphics.Paint().apply {
                                                color = android.graphics.Color.GRAY
                                                textSize = 8.5.sp.toPx()
                                                textAlign = android.graphics.Paint.Align.CENTER
                                            }
                                        )
                                    }
                                }
                            } else if (displayedScores.isNotEmpty() && chartType == 2) {
                                val stepX = chartWidth / (displayedScores.size - 1).coerceAtLeast(1)
                                displayedScores.forEachIndexed { idx, s ->
                                    val x = paddingLeft + idx * stepX
                                    val str = SimpleDateFormat("dd MMM", Locale.getDefault()).format(Date(s.date))
                                    drawContext.canvas.nativeCanvas.drawText(
                                        str,
                                        x,
                                        paddingTop + chartHeight + 15.dp.toPx(),
                                        android.graphics.Paint().apply {
                                            color = android.graphics.Color.GRAY
                                            textSize = 8.5.sp.toPx()
                                            textAlign = android.graphics.Paint.Align.CENTER
                                        }
                                    )
                                }
                            }

                            // 4. Compute and draw Snapping Touch / Cursor interaction
                            val touchX = hoverX - paddingLeft
                            if (hoverX >= paddingLeft && hoverX <= paddingLeft + chartWidth) {
                                if (chartType == 0 || chartType == 1) {
                                    val stepX = chartWidth / (displayedMoods.size - 1).coerceAtLeast(1)
                                    val idx = (touchX / stepX).roundToInt().coerceIn(0, displayedMoods.lastIndex)
                                    val activeM = displayedMoods[idx]
                                    activeHoverPointMood = activeM

                                    val hX = paddingLeft + idx * stepX
                                    val hY = paddingTop + chartHeight - (activeM.moodScore.toFloat() / 10f) * chartHeight

                                    // Draw Recharts vertical dashed cursor line
                                    drawLine(
                                        color = Color.Gray.copy(alpha = 0.5f),
                                        start = strokeRange(hX, paddingTop),
                                        end = strokeRange(hX, paddingTop + chartHeight),
                                        strokeWidth = 1.dp.toPx(),
                                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                                    )

                                    // Mood node hover circle
                                    drawCircle(color = MoodColor.copy(alpha = 0.3f), radius = 10.dp.toPx(), center = strokeRange(hX, hY))
                                    drawCircle(color = MoodColor, radius = 5.dp.toPx(), center = strokeRange(hX, hY))
                                    drawCircle(color = Color.White, radius = 2.dp.toPx(), center = strokeRange(hX, hY))
                                }

                                if (displayedScores.isNotEmpty() && (chartType == 0 || chartType == 2)) {
                                    val stepX = chartWidth / (displayedScores.size - 1).coerceAtLeast(1)
                                    val idx = (touchX / stepX).roundToInt().coerceIn(0, displayedScores.lastIndex)
                                    val activeS = displayedScores[idx]
                                    activeHoverPointScore = activeS

                                    val hX = paddingLeft + idx * stepX
                                    val hY = paddingTop + chartHeight - (activeS.score.toFloat() / 27f) * chartHeight

                                    // Assessment node hover circle
                                    drawCircle(color = AssessmentColor.copy(alpha = 0.3f), radius = 10.dp.toPx(), center = strokeRange(hX, hY))
                                    drawCircle(color = AssessmentColor, radius = 5.dp.toPx(), center = strokeRange(hX, hY))
                                    drawCircle(color = Color.White, radius = 2.dp.toPx(), center = strokeRange(hX, hY))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Recharts Floating Hover Detail Card
                    Card(
                        modifier = Modifier.fillMaxWidth().testTag("chart_hover_detail_card"),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.30f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            if (activeHoverPointMood != null || activeHoverPointScore != null) {
                                val dateStr = when {
                                    activeHoverPointMood != null -> SimpleDateFormat("EEEE, d MMM yyyy", Locale.getDefault()).format(Date(activeHoverPointMood!!.date))
                                    activeHoverPointScore != null -> SimpleDateFormat("EEEE, d MMM yyyy", Locale.getDefault()).format(Date(activeHoverPointScore!!.date))
                                    else -> ""
                                }
                                Text(dateStr, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.height(8.dp))

                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if (activeHoverPointMood != null) {
                                        val m = activeHoverPointMood!!
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(MoodColor))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Somatic Mood Register: ", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
                                            Text("${m.moodScore}/10", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = MoodColor)
                                        }
                                        if (m.moodNote.isNotEmpty() && m.moodNote != "Self-logged checklist entry.") {
                                            Text("Comment: \"${m.moodNote}\"", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(start = 16.dp), fontStyle = FontStyle.Italic)
                                        }
                                        if (m.gratitude.isNotEmpty()) {
                                            Text("Gratitude: \"${m.gratitude}\"", fontSize = 11.sp, color = TealSecondary, modifier = Modifier.padding(start = 16.dp))
                                        }
                                    }

                                    if (activeHoverPointScore != null) {
                                        val s = activeHoverPointScore!!
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AssessmentColor))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Diagnostic ${s.type} Test: ", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
                                            Text("${s.score}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = AssessmentColor)
                                            Text(" (${s.details})", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                }
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.TouchApp, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("👆 Hold & Drag along the curves to inspect daily logs & diagnostic indexes.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Simulated clinical course active.", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        TextButton(
                            onClick = { viewModel.generateHistoricalWellnessData(activePatientId) },
                            modifier = Modifier.testTag("seeder_button_wellness_center")
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Re-Seed Random Sequence", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Chronological Daily Logging Feed under the charts
        if (hasData) {
            Text(
                text = "Chronological Somatic Track Records",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            displayedMoods.reversed().forEach { m ->
                val mDate = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date(m.date))
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("historic_somatic_card"),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f)),
                    border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val badgeColor = when (m.moodScore) {
                                in 1..4 -> SoftRed
                                in 5..7 -> SoftOrange
                                else -> SoftGreen
                            }

                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Badge(containerColor = badgeColor, contentColor = Color.White) {
                                    Text("Mood: ${m.moodScore}/10", fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                }
                                if (m.breathingSeconds > 0) {
                                    Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                                        Text("🧘 ${m.breathingSeconds}s Breathing", modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp), color = MaterialTheme.colorScheme.onPrimaryContainer)
                                    }
                                }
                            }
                            Text(mDate, fontSize = 10.sp, color = Color.Gray)
                        }

                        if (m.moodNote.isNotEmpty() && m.moodNote != "Self-logged checklist entry.") {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = m.moodNote,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        if (m.gratitude.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Default.Favorite, contentDescription = null, tint = SoftRed, modifier = Modifier.size(12.dp))
                                Text(
                                    text = "Gratitude: \"${m.gratitude}\"",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontStyle = FontStyle.Italic
                                )
                            }
                        }
                    }
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
    val loggedInUser by viewModel.loggedInUser.collectAsStateWithLifecycle()
    
    val customGeminiKey by viewModel.customGeminiKey.collectAsStateWithLifecycle()
    val customOpenAiKey by viewModel.customOpenAiKey.collectAsStateWithLifecycle()
    val customLlmUrl by viewModel.customLlmUrl.collectAsStateWithLifecycle()
    val activeProvider by viewModel.activeProvider.collectAsStateWithLifecycle()
    val customIcdClientId by viewModel.customIcdClientId.collectAsStateWithLifecycle()
    val customIcdClientSecret by viewModel.customIcdClientSecret.collectAsStateWithLifecycle()

    val context = LocalContext.current
    var activeSubTab by remember { mutableStateOf(0) } // 0: Audits, 1: Backups, 2: AI Settings

    var geminiKeyEdit by remember(customGeminiKey) { mutableStateOf(customGeminiKey) }
    var openAiKeyEdit by remember(customOpenAiKey) { mutableStateOf(customOpenAiKey) }
    var customUrlEdit by remember(customLlmUrl) { mutableStateOf(customLlmUrl) }
    var providerSelection by remember(activeProvider) { mutableStateOf(activeProvider) }
    var icdClientIdEdit by remember(customIcdClientId) { mutableStateOf(customIcdClientId) }
    var icdClientSecretEdit by remember(customIcdClientSecret) { mutableStateOf(customIcdClientSecret) }

    var importPayloadText by remember { mutableStateOf("") }
    var showRawExportJson by remember { mutableStateOf(false) }
    var exportedBackupString by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("security_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("HIPAA Shield & Security Cryptography", Icons.Default.Security)
        }

        // Vault status banner card
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
                    loggedInUser?.let { user ->
                        Text("• Enrolled Officer: ${user.fullName}", color = Color.White, fontSize = 12.sp)
                        if (user.role == "Professional") {
                            Text("• Specialty Subtype: ${user.specialty.ifBlank { "Professional Staff" }}", color = Color.White, fontSize = 12.sp)
                            Text("• License Credential Key: ${user.licenseOrId.ifBlank { "PENDING VERIFICATION" }}", color = Color.White, fontSize = 12.sp)
                        } else {
                            Text("• E-Chart Patient ID: ${user.licenseOrId}", color = Color.White, fontSize = 12.sp)
                        }
                    }
                    Text("• Local SQLite Core: Fully isolated with zero trace leaks.", color = Color.White, fontSize = 12.sp)
                    Text("• Active AI Integration: ${if (activeProvider == 0) "Google Gemini" else "Custom/OpenAI LLM Gateway"}", color = Color.White, fontSize = 12.sp)
                    Text("• Biometric Hardware key: Active (AES-GCM encryption binds key state).", color = Color.White, fontSize = 12.sp)
                }
            }
        }

        // Subtabs for Security module navigation
        item {
            TabRow(
                selectedTabIndex = activeSubTab,
                containerColor = Color.Transparent,
                contentColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = activeSubTab == 0,
                    onClick = { activeSubTab = 0 },
                    text = { Text("Security Audits", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    icon = { Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp)) }
                )
                Tab(
                    selected = activeSubTab == 1,
                    onClick = { activeSubTab = 1 },
                    text = { Text("Clinical Backup", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    icon = { Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp)) }
                )
                Tab(
                    selected = activeSubTab == 2,
                    onClick = { activeSubTab = 2 },
                    text = { Text("AI Models Integration", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(16.dp)) }
                )
            }
        }

        if (activeSubTab == 0) {
            // Tab 0: Real-Time Audits (The original logging core)
            item {
                Text("Real-Time HIPAA Compliance Database Access Logs:", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            }

            if (auditLogs.isEmpty()) {
                item {
                    Text("No secure access logs recorded in secure vault yet.", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(8.dp))
                }
            } else {
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
        } else if (activeSubTab == 1) {
            // Tab 1: Migration backups (EHR compliant SQLite Json Export / Restore)
            item {
                Text("Clinical Migration & Offline Records Archives", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("MIGRATION ENVIRONMENT PROTOCOL:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = GoldAccent)
                        Text(
                            "This system allows offline synchronization between PsyPyrus HIPAA local nodes. Clinicians can generate a consolidated JSON archive containing secure clinical assessments, logs, medications, and patients, which can be shared or loaded directly onto secondary devices.",
                            fontSize = 11.sp,
                            lineHeight = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            // Export Box
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("1. Secure Clinical Export Gateway", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    val json = viewModel.exportBackupJson()
                                    exportedBackupString = json
                                    
                                    // Copy to clipboard
                                    val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("PsyPyrus Backup", json)
                                    clipboard.setPrimaryClip(clip)
                                    
                                    showRawExportJson = true
                                    Toast.makeText(context, "Encrypted backup clipboard copy active!", Toast.LENGTH_SHORT).show()
                                    viewModel.logAudit("Clinical Data Exported", "Generated secure system JSON archive")
                                },
                                modifier = Modifier.weight(1f).height(44.dp).testTag("clinical_copy_backup_button")
                            ) {
                                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Copy Backup JSON", fontSize = 12.sp)
                            }

                            OutlinedButton(
                                onClick = {
                                    try {
                                        val backupStr = viewModel.exportBackupJson()
                                        val file = java.io.File(context.cacheDir, "PsyPyrus_EHR_Export_${System.currentTimeMillis()}.json")
                                        java.io.FileOutputStream(file).use { out ->
                                            out.write(backupStr.toByteArray(Charsets.UTF_8))
                                        }
                                        
                                        val authority = "${context.packageName}.fileprovider"
                                        val uri = androidx.core.content.FileProvider.getUriForFile(context, authority, file)
                                        
                                        val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                            type = "application/json"
                                            putExtra(android.content.Intent.EXTRA_STREAM, uri)
                                            putExtra(android.content.Intent.EXTRA_SUBJECT, "PsyPyrus Offline EHR Sync")
                                            addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                        }
                                        val chooser = android.content.Intent.createChooser(shareIntent, "Save Backup File")
                                        chooser.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                                        context.startActivity(chooser)
                                        
                                        viewModel.logAudit("Backup File Compiled", "Exported and shared PsyPyrus JSON Backup file")
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Failed back-up build: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier.weight(1.2f).height(44.dp).testTag("clinical_file_backup_button")
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Share Backup File", fontSize = 12.sp)
                            }
                        }

                        if (showRawExportJson) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Active Backup Payload (Paste in safety nodes):", fontWeight = FontWeight.Bold, fontSize = 10.sp, color = MaterialTheme.colorScheme.primary)
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth().height(140.dp)
                            ) {
                                Column(modifier = Modifier.padding(8.dp).verticalScroll(rememberScrollState())) {
                                    Text(
                                        exportedBackupString,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Import Box
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("2. Secure Audit Clinical Restore", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(
                            "Paste an EHR clinical JSON archive payload below to run bulk SQLite sync. Importing merges existing datasets recursively.",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )

                        OutlinedTextField(
                            value = importPayloadText,
                            onValueChange = { importPayloadText = it },
                            placeholder = { Text("{ \"patients\": [...], \"notes\": [...] }", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth().height(100.dp).testTag("clinical_import_payload_input"),
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        )

                        Button(
                            onClick = {
                                if (importPayloadText.isBlank()) {
                                    Toast.makeText(context, "Please paste clinical backup JSON text.", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                viewModel.importBackupJson(
                                    jsonString = importPayloadText,
                                    onSuccess = {
                                        importPayloadText = ""
                                        Toast.makeText(context, "EHR SQLite Database successfully hydrated!", Toast.LENGTH_SHORT).show()
                                    },
                                    onError = { err ->
                                        Toast.makeText(context, "EHR Hydration Denied: $err", Toast.LENGTH_LONG).show()
                                    }
                                )
                            },
                            modifier = Modifier.fillMaxWidth().height(42.dp).testTag("clinical_import_payload_submit"),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                        ) {
                            Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Validate & Restore Database Archive", fontSize = 12.sp)
                        }
                    }
                }
            }
        } else if (activeSubTab == 2) {
            // Tab 2: Custom API credentials for Google, OpenAI, deepseek, ollama
            item {
                Text("Clinical LLM & AI Engine Integration Cockpit", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("INTEGRATION DETAILED INSTRUCTIONS:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                        Text(
                            "• Google AI Studio Gemini: Go to ai.google.dev, log in, generate a free API Key, and paste below to replace the global instance with your personal quotas.",
                            fontSize = 11.sp, lineHeight = 15.sp, color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            "• OpenAI Platform gpt-4o-mini: Register and configure API billing limits at platform.openai.com. Retrieve an API Key starting with 'sk-'.",
                            fontSize = 11.sp, lineHeight = 15.sp, color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            "• Local Host Ollama (Llama3, DeepSeek): Run 'ollama run deepseek-coder' or 'llama3' on your local host daemon. Set endpoint URL below to local reverse proxy IP: 'http://10.0.2.2:11434/v1/chat/completions'. Use 'sk-ollama' (or empty) for API key.",
                            fontSize = 11.sp, lineHeight = 15.sp, color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Text("Active Engine Architecture", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        
                        // Select Provider
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Card(
                                onClick = { providerSelection = 0 },
                                modifier = Modifier.weight(1f).height(50.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (providerSelection == 0) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                ),
                                border = BorderStroke(1.dp, if (providerSelection == 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Text("Google Gemini", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }

                            Card(
                                onClick = { providerSelection = 1 },
                                modifier = Modifier.weight(1f).height(50.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (providerSelection == 1) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                ),
                                border = BorderStroke(1.dp, if (providerSelection == 1) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Text("OpenAI / Custom LLM", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }

                        Divider(color = MaterialTheme.colorScheme.outlineVariant)

                        if (providerSelection == 0) {
                            Text("Google AI Studio Credentials", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                            OutlinedTextField(
                                value = geminiKeyEdit,
                                onValueChange = { geminiKeyEdit = it },
                                label = { Text("Gemini API Key Override") },
                                placeholder = { Text("AIzaSy...") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth().testTag("settings_gemini_key_input")
                            )
                            Text("If left blank, PsyPyrus securely falls back to global AI Studio enterprise configurations or safety responsive mocks.", fontSize = 10.sp, color = Color.Gray)
                        } else {
                            Text("OpenAI / DeepSeek / Ollama Parameters", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                            OutlinedTextField(
                                value = openAiKeyEdit,
                                onValueChange = { openAiKeyEdit = it },
                                label = { Text("API Authorization Key") },
                                placeholder = { Text("sk-...") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth().testTag("settings_openai_key_input")
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            OutlinedTextField(
                                value = customUrlEdit,
                                onValueChange = { customUrlEdit = it },
                                label = { Text("Custom HTTP Endpoint URL") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth().testTag("settings_custom_endpoint_input")
                            )
                            Text("Endpoint MUST follow standard Chat Completions JSON schema specifications.", fontSize = 10.sp, color = Color.Gray)
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Button(
                            onClick = {
                                viewModel.saveApiSettings(
                                    geminiKey = geminiKeyEdit,
                                    openAiKey = openAiKeyEdit,
                                    customUrl = customUrlEdit,
                                    provider = providerSelection
                                )
                                Toast.makeText(context, "API Engine specifications saved successfully!", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.fillMaxWidth().height(46.dp).testTag("save_settings_api_button")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Save & Authenticate Connection Instance")
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Text("WHO ICD-11 Registry Credentials", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(
                            "Enter the Client ID and Client Secret from the WHO Developer Portal to enable official live search queries. If left blank, the system automatically falls back to local database matches.",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                        OutlinedTextField(
                            value = icdClientIdEdit,
                            onValueChange = { icdClientIdEdit = it },
                            label = { Text("ICD-11 Client ID") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("settings_icd_client_id_input")
                        )
                        OutlinedTextField(
                            value = icdClientSecretEdit,
                            onValueChange = { icdClientSecretEdit = it },
                            label = { Text("ICD-11 Client Secret") },
                            singleLine = true,
                            visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth().testTag("settings_icd_client_secret_input")
                        )
                        Button(
                            onClick = {
                                viewModel.saveIcdSettings(
                                    clientId = icdClientIdEdit,
                                    clientSecret = icdClientSecretEdit
                                )
                                Toast.makeText(context, "ICD-11 Registry Credentials saved successfully!", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.fillMaxWidth().height(46.dp).testTag("save_settings_icd_button")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Save ICD-11 Credentials")
                        }
                    }
                }
            }
        }
    }
}

// --- K. HOMEWORK TRACKER MODULE ---
@Composable
fun HomeworkTrackerScreen(viewModel: PsyPyrusViewModel) {
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()
    val homeworkList by viewModel.allHomework.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val selectedPatientId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val context = LocalContext.current

    if (activeRole == "Professional") {
        ProfessionalHomeworkView(
            homeworkList = homeworkList,
            patients = patients,
            selectedPatientId = selectedPatientId,
            onSetSelectedPatient = { viewModel.setSelectedPatient(it) },
            onAssignHomework = { patId, patName, title, desc, due ->
                viewModel.assignHomework(patId, patName, title, desc, due)
                Toast.makeText(context, "Homework assigned successfully!", Toast.LENGTH_SHORT).show()
            },
            onReviewHomework = { hwId, feedback, status ->
                viewModel.reviewHomework(hwId, feedback, status)
                Toast.makeText(context, "Feedback updated!", Toast.LENGTH_SHORT).show()
            },
            onDeleteHomework = { id ->
                viewModel.deleteHomework(id)
                Toast.makeText(context, "Homework task deleted.", Toast.LENGTH_SHORT).show()
            }
        )
    } else {
        // Patient Mode
        val activePatientName = patients.find { it.id == selectedPatientId }?.name ?: "Selected Patient"
        PatientHomeworkView(
            activePatientId = selectedPatientId,
            activePatientName = activePatientName,
            patients = patients,
            homeworkList = homeworkList.filter { it.patientId == selectedPatientId },
            onSetSelectedPatient = { viewModel.setSelectedPatient(it) },
            onUpdateHomework = { hwId, status, notes ->
                viewModel.updateHomeworkStatus(hwId, status, notes)
                Toast.makeText(context, "Progress updated & submitted!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfessionalHomeworkView(
    homeworkList: List<Homework>,
    patients: List<Patient>,
    selectedPatientId: Long,
    onSetSelectedPatient: (Long) -> Unit,
    onAssignHomework: (Long, String, String, String, String) -> Unit,
    onReviewHomework: (Long, String, String) -> Unit,
    onDeleteHomework: (Long) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var dueDate by remember { mutableStateOf("15 Jun, 2026") }
    var selectedPatientIndex by remember { mutableStateOf(0) }

    // Synchronize selection based on selectedPatientId
    val currentPatientIndex = patients.indexOfFirst { it.id == selectedPatientId }.coerceAtLeast(0)
    
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("professional_homework_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Clinical Homework Assigner", Icons.Default.Assignment)
        }

        // Section: Assign Form
        item {
            Card(
                modifier = Modifier.fillMaxWidth().testTag("assign_homework_card"),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Assign New Homework Task",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Patient Selector Dropdown / Row
                    Text("Select Target Patient:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    if (patients.isNotEmpty()) {
                        ScrollableTabRow(
                            selectedTabIndex = currentPatientIndex,
                            edgePadding = 0.dp,
                            containerColor = Color.Transparent
                        ) {
                            patients.forEachIndexed { idx, p ->
                                Tab(
                                    selected = currentPatientIndex == idx,
                                    onClick = { 
                                        selectedPatientIndex = idx
                                        onSetSelectedPatient(p.id)
                                    },
                                    text = { Text(p.name, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                )
                            }
                        }
                    } else {
                        Text("No patients registered inside clinic.", color = Color.Gray, fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Title
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Task Title (e.g. Cognitive Journal)") },
                        modifier = Modifier.fillMaxWidth().testTag("hw_title_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    // Description
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Therapeutic Guidance Instructions") },
                        modifier = Modifier.fillMaxWidth().height(90.dp).testTag("hw_desc_input"),
                        maxLines = 3
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    // Due Date
                    OutlinedTextField(
                        value = dueDate,
                        onValueChange = { dueDate = it },
                        label = { Text("Completion Due Date") },
                        modifier = Modifier.fillMaxWidth().testTag("hw_due_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            if (title.isNotBlank() && description.isNotBlank()) {
                                val target = patients.getOrNull(currentPatientIndex)
                                if (target != null) {
                                    onAssignHomework(target.id, target.name, title, description, dueDate)
                                    title = ""
                                    description = ""
                                }
                            }
                        },
                        enabled = title.isNotBlank() && description.isNotBlank() && patients.isNotEmpty(),
                        modifier = Modifier.fillMaxWidth().testTag("assign_hw_submit_button"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Dispatch Homework Task")
                    }
                }
            }
        }

        // Section header for active assignments
        item {
            Text(
                "Monitor Patient Progress Logs:",
                fontWeight = FontWeight.ExtraBold,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        // If empty
        if (homeworkList.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("No homework tasks assigned yet. Use the form above to add one.", color = Color.Gray, textAlign = TextAlign.Center)
                    }
                }
            }
        }

        // All assignments
        items(homeworkList) { hw ->
            Card(
                modifier = Modifier.fillMaxWidth().testTag("hw_professional_item_${hw.id}"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "To: ${hw.patientName}",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                hw.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        // Status Badge
                        val badgeColor = when (hw.status) {
                            "Completed" -> Color(0xFF10B981) // Green
                            "In Progress" -> Color(0xFFF59E0B) // Amber
                            "Reviewed" -> Color(0xFF3B82F6) // Blue
                            else -> Color(0xFF6B7280) // Gray
                        }
                        
                        Badge(containerColor = badgeColor) {
                            Text(
                                hw.status,
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        hw.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.HourglassEmpty, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            "Due Date: ${hw.dueDate}",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Show Patient's input if they have recorded thoughts
                    if (hw.patientNotes.isNotBlank()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.2f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    "Patient Notes & Response:",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.tertiary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    hw.patientNotes,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    // Existing Dr feedback if any
                    if (hw.professionalFeedback.isNotBlank()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    "Your Clinical Review:",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    hw.professionalFeedback,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    // Form to review homework (Professional leaves feedback)
                    var writeFeedback by remember { mutableStateOf("") }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Evaluate & Provide Guidance:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = writeFeedback,
                            onValueChange = { writeFeedback = it },
                            placeholder = { Text("Clinical encouragement or directions...", fontSize = 12.sp) },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )

                        // Submit Feedback Button
                        IconButton(
                            onClick = {
                                if (writeFeedback.isNotBlank()) {
                                    onReviewHomework(hw.id, writeFeedback, "Reviewed")
                                    writeFeedback = ""
                                }
                            },
                            enabled = writeFeedback.isNotBlank(),
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Submit Feedback",
                                tint = if (writeFeedback.isNotBlank()) MaterialTheme.colorScheme.primary else Color.Gray
                            )
                        }

                        // Delete button
                        IconButton(
                            onClick = { onDeleteHomework(hw.id) },
                            modifier = Modifier.size(48.dp).testTag("delete_hw_btn_${hw.id}")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Delete Homework",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PatientHomeworkView(
    activePatientId: Long,
    activePatientName: String,
    patients: List<Patient>,
    homeworkList: List<Homework>,
    onSetSelectedPatient: (Long) -> Unit,
    onUpdateHomework: (Long, String, String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("patient_homework_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("My Assignments Tracker", Icons.Default.SelfImprovement)
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.2f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        "Clinical Profile View",
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Logged in Patient Profile: $activePatientName",
                        fontWeight = FontWeight.ExtraBold,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "You can switch between patient records under the dropdown selector below to emulate different logs for diagnostic test previews.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // Easy patient swapper for demonstration/testing in streaming screen
                    Text("Simulate Patient Logged-In Account:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    ScrollableTabRow(
                        selectedTabIndex = patients.indexOfFirst { it.id == activePatientId }.coerceAtLeast(0),
                        edgePadding = 0.dp,
                        containerColor = Color.Transparent
                    ) {
                        patients.forEach { p ->
                            Tab(
                                selected = activePatientId == p.id,
                                onClick = { onSetSelectedPatient(p.id) },
                                text = { Text(p.name, fontSize = 11.sp) }
                            )
                        }
                    }
                }
            }
        }

        item {
            Text(
                "Therapeutic Homework Assignments:",
                fontWeight = FontWeight.ExtraBold,
                style = MaterialTheme.typography.titleMedium
            )
        }

        if (homeworkList.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("You do not have any homework assigned. Dr. Katherine Brewster will assign tasks during your next session.", color = Color.Gray, textAlign = TextAlign.Center)
                    }
                }
            }
        }

        items(homeworkList) { hw ->
            var activeStatusInput by remember { mutableStateOf(hw.status) }
            var writtenNotesInput by remember { mutableStateOf(hw.patientNotes) }

            Card(
                modifier = Modifier.fillMaxWidth().testTag("patient_hw_item_${hw.id}"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            hw.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        // Status Badge
                        val badgeColor = when (hw.status) {
                            "Completed" -> Color(0xFF10B981) // Green
                            "In Progress" -> Color(0xFFF59E0B) // Amber
                            "Reviewed" -> Color(0xFF3B82F6) // Blue
                            else -> Color(0xFF6B7280) // Gray
                        }
                        
                        Badge(containerColor = badgeColor) {
                            Text(
                                hw.status,
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        hw.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.HourglassEmpty, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            "Completion Target: ${hw.dueDate}",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // If professional feedback exists, show it with a beautiful speech quote block
                    if (hw.professionalFeedback.isNotBlank()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer)
                        ) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                                Icon(
                                    imageVector = Icons.Default.RateReview,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        "Dr. Brewster's Guidance & Review:",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        hw.professionalFeedback,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Log Your Progress:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(8.dp))

                    // Status chooser buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("Assigned", "In Progress", "Completed").forEach { statusLabel ->
                            val isSelected = activeStatusInput == statusLabel
                            Button(
                                onClick = { activeStatusInput = statusLabel },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                    contentColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                ),
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier.weight(1f).height(38.dp)
                            ) {
                                Text(statusLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Notes input
                    OutlinedTextField(
                        value = writtenNotesInput,
                        onValueChange = { writtenNotesInput = it },
                        placeholder = { Text("Write down what you did or how it went during this task...", fontSize = 12.sp) },
                        modifier = Modifier.fillMaxWidth().height(80.dp),
                        maxLines = 3
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            onUpdateHomework(hw.id, activeStatusInput, writtenNotesInput)
                        },
                        modifier = Modifier.fillMaxWidth().testTag("submit_patient_hw_btn_${hw.id}"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Upload, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Update status & log thoughts", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// --- L. MEDICAL MANAGEMENT & ADHERENCE MODULE ---
@Composable
fun MedicationsScreen(viewModel: PsyPyrusViewModel) {
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()
    val patients by viewModel.patients.collectAsStateWithLifecycle()
    val selectedPatientId by viewModel.selectedPatientId.collectAsStateWithLifecycle()
    val medications by viewModel.allMedications.collectAsStateWithLifecycle()
    val adherenceLogs by viewModel.allAdherenceLogs.collectAsStateWithLifecycle()
    val context = LocalContext.current

    if (activeRole == "Professional") {
        ProfessionalMedicationView(
            patients = patients,
            selectedPatientId = selectedPatientId,
            medications = medications,
            adherenceLogs = adherenceLogs,
            onSetSelectedPatient = { viewModel.setSelectedPatient(it) },
            onPrescribe = { patId, patName, name, dosage, freq, purpose, inst, start, dur ->
                viewModel.prescribeMedication(
                    patientId = patId,
                    patientName = patName,
                    name = name,
                    dosage = dosage,
                    frequency = freq,
                    purpose = purpose,
                    instructions = inst,
                    startDate = start,
                    durationDays = dur
                )
                Toast.makeText(context, "Prescription dispatched successfully!", Toast.LENGTH_SHORT).show()
            },
            onToggleActive = { medId, active ->
                viewModel.updateMedicationActiveStatus(medId, active)
                val statusText = if (active) "Active" else "Discontinued/Inactive"
                Toast.makeText(context, "Prescription marked as $statusText", Toast.LENGTH_SHORT).show()
            },
            onDelete = { medId ->
                viewModel.deleteMedication(medId)
                Toast.makeText(context, "Prescription deleted.", Toast.LENGTH_SHORT).show()
            }
        )
    } else {
        val activePatientName = patients.find { it.id == selectedPatientId }?.name ?: "Selected Patient"
        PatientMedicationView(
            activePatientId = selectedPatientId,
            activePatientName = activePatientName,
            patients = patients,
            medications = medications.filter { it.patientId == selectedPatientId },
            adherenceLogs = adherenceLogs.filter { it.patientId == selectedPatientId },
            onSetSelectedPatient = { viewModel.setSelectedPatient(it) },
            onLogAdherence = { medId, dateString, status ->
                viewModel.logMedicationAdherence(medId, selectedPatientId, dateString, status)
                Toast.makeText(context, "Intake recorded as $status for $dateString!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfessionalMedicationView(
    patients: List<Patient>,
    selectedPatientId: Long,
    medications: List<Medication>,
    adherenceLogs: List<AdherenceLog>,
    onSetSelectedPatient: (Long) -> Unit,
    onPrescribe: (Long, String, String, String, String, String, String, String, Int) -> Unit,
    onToggleActive: (Long, Boolean) -> Unit,
    onDelete: (Long) -> Unit
) {
    var medName by remember { mutableStateOf("") }
    var dosage by remember { mutableStateOf("") }
    var frequency by remember { mutableStateOf("Once daily (Morning)") }
    var purpose by remember { mutableStateOf("Anxiety management") }
    var instructions by remember { mutableStateOf("") }
    var durationDaysText by remember { mutableStateOf("30") }
    var startDate by remember { mutableStateOf("09 Jun, 2026") }

    val currentPatientIndex = patients.indexOfFirst { it.id == selectedPatientId }.coerceAtLeast(0)
    val selectedPatient = patients.getOrNull(currentPatientIndex)

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("professional_medications_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("Prescription & Adherence Console", Icons.Default.Healing)
        }

        // Target Patient Switcher
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        "Reviewing Patient Case:",
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    if (patients.isNotEmpty()) {
                        ScrollableTabRow(
                            selectedTabIndex = currentPatientIndex,
                            edgePadding = 0.dp,
                            containerColor = Color.Transparent
                        ) {
                            patients.forEachIndexed { idx, p ->
                                Tab(
                                    selected = currentPatientIndex == idx,
                                    onClick = { onSetSelectedPatient(p.id) },
                                    text = { Text(p.name, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                                )
                            }
                        }
                    } else {
                        Text("No clinic clients registered.", color = Color.Gray, fontSize = 12.sp)
                    }
                }
            }
        }

        // Section: Add New Prescription Form
        item {
            Card(
                modifier = Modifier.fillMaxWidth().testTag("add_prescription_card"),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Prescribe New Pharmacotherapy",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = medName,
                        onValueChange = { medName = it },
                        label = { Text("Medication Name (e.g. Sertraline, Lexapro)") },
                        modifier = Modifier.fillMaxWidth().testTag("med_name_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = dosage,
                            onValueChange = { dosage = it },
                            label = { Text("Dosage (e.g. 50mg)") },
                            modifier = Modifier.weight(1f).testTag("med_dosage_input"),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = durationDaysText,
                            onValueChange = { durationDaysText = it },
                            label = { Text("Duration (Days)") },
                            modifier = Modifier.weight(1f).testTag("med_duration_input"),
                            singleLine = true
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = frequency,
                        onValueChange = { frequency = it },
                        label = { Text("Frequency / Schedule") },
                        modifier = Modifier.fillMaxWidth().testTag("med_frequency_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = purpose,
                        onValueChange = { purpose = it },
                        label = { Text("Clinical Goal / Purpose") },
                        modifier = Modifier.fillMaxWidth().testTag("med_purpose_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = instructions,
                        onValueChange = { instructions = it },
                        label = { Text("Directions & Food Instructions") },
                        modifier = Modifier.fillMaxWidth().testTag("med_instructions_input"),
                        maxLines = 2
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = startDate,
                        onValueChange = { startDate = it },
                        label = { Text("Rx Issue/Start Date") },
                        modifier = Modifier.fillMaxWidth().testTag("med_start_date_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            if (medName.isNotBlank() && selectedPatient != null) {
                                val dur = durationDaysText.toIntOrNull() ?: 30
                                onPrescribe(
                                    selectedPatient.id,
                                    selectedPatient.name,
                                    medName,
                                    dosage,
                                    frequency,
                                    purpose,
                                    instructions,
                                    startDate,
                                    dur
                                )
                                medName = ""
                                dosage = ""
                                frequency = "Once daily (Morning)"
                                instructions = ""
                                durationDaysText = "30"
                            }
                        },
                        enabled = medName.isNotBlank() && selectedPatient != null,
                        modifier = Modifier.fillMaxWidth().testTag("prescribe_submit_btn"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Issue Compliance-Tracked Rx")
                    }
                }
            }
        }

        // Section header for current patient's prescriptions
        item {
            Text(
                text = "${selectedPatient?.name ?: "Patient"}'s Active Pharmacotherapy:",
                fontWeight = FontWeight.ExtraBold,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        val patientMeds = medications.filter { it.patientId == selectedPatientId }
        if (patientMeds.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("No pharmacotherapy active or discontinued for this client.", color = Color.Gray)
                    }
                }
            }
        }

        items(patientMeds) { med ->
            val logs = adherenceLogs.filter { it.medicationId == med.id }
            val taken = logs.count { it.status == "Taken" }
            val missed = logs.count { it.status == "Missed" }
            val total = logs.size
            val rate = if (total > 0) (taken * 100) / total else 0

            Card(
                modifier = Modifier.fillMaxWidth().testTag("med_professional_item_${med.id}"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = med.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Dosage: ${med.dosage} | ${med.frequency}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        // Compliance Rate circular badge
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (rate >= 80) SoftGreen.copy(alpha = 0.15f) else SoftOrange.copy(alpha = 0.15f)
                            ),
                            border = BorderStroke(1.dp, if (rate >= 80) SoftGreen else SoftOrange)
                        ) {
                            Text(
                                text = if (total > 0) "$rate% Compliant" else "No Data Yet",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (rate >= 80) SoftGreen else SoftOrange
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Target Focus: ${med.purpose}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    if (med.instructions.isNotBlank()) {
                        Text("Directions: ${med.instructions}", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Started on: ${med.startDate}", fontSize = 11.sp, color = Color.Gray)
                            Text("Adherence Logs: $taken Taken / $missed Missed", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
                        }

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Discontinue Switch
                            Text(if (med.isActive) "Active" else "Discontinued", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (med.isActive) SoftGreen else Color.Gray)
                            Switch(
                                checked = med.isActive,
                                onCheckedChange = { onToggleActive(med.id, it) },
                                modifier = Modifier.scale(0.85f)
                            )

                            // Delete action
                            IconButton(onClick = { onDelete(med.id) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete Prescription", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }

                    // Show historic timeline logs for this med
                    if (logs.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Recent Adherence Timeline Logs:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            logs.take(7).forEach { log ->
                                val isTaken = log.status == "Taken"
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = if (isTaken) SoftGreen.copy(alpha = 0.1f) else SoftRed.copy(alpha = 0.1f)),
                                    border = BorderStroke(1.dp, if (isTaken) SoftGreen else SoftRed),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (isTaken) Icons.Default.Check else Icons.Default.Clear,
                                            contentDescription = null,
                                            tint = if (isTaken) SoftGreen else SoftRed,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Text(log.dateString, fontSize = 10.sp, color = if (isTaken) SoftGreen else SoftRed, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PatientMedicationView(
    activePatientId: Long,
    activePatientName: String,
    patients: List<Patient>,
    medications: List<Medication>,
    adherenceLogs: List<AdherenceLog>,
    onSetSelectedPatient: (Long) -> Unit,
    onLogAdherence: (Long, String, String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp).testTag("patient_medications_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionHeader("My Prescription & Wellness Manager", Icons.Default.SelfImprovement)
        }

        // Simulated account swapper for test high-fidelity emulation
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.2f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        "Clinical Simulation Swapper (Testing Role Dashboard View):",
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Currently Emulating Student/Patient: $activePatientName",
                        fontWeight = FontWeight.ExtraBold,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    ScrollableTabRow(
                        selectedTabIndex = patients.indexOfFirst { it.id == activePatientId }.coerceAtLeast(0),
                        edgePadding = 0.dp,
                        containerColor = Color.Transparent
                    ) {
                        patients.forEach { p ->
                            Tab(
                                selected = p.id == activePatientId,
                                onClick = { onSetSelectedPatient(p.id) },
                                text = { Text(p.name, fontSize = 11.sp) }
                            )
                        }
                    }
                }
            }
        }

        item {
            Text(
                "My Prescribed Treatment Regime:",
                fontWeight = FontWeight.ExtraBold,
                style = MaterialTheme.typography.titleMedium
            )
        }

        if (medications.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("You have no active prescriptions assigned. Speak to Dr. Katherine Brewster.", color = Color.Gray, textAlign = TextAlign.Center)
                    }
                }
            }
        }

        items(medications) { med ->
            val logs = adherenceLogs.filter { it.medicationId == med.id }
            val taken = logs.count { it.status == "Taken" }
            val total = logs.size
            val rate = if (total > 0) (taken * 100) / total else 0

            // Determine if today (09 Jun, 2026) has been logged yet
            val todayLog = logs.find { it.dateString == "09 Jun, 2026" }
            var isDiscontinuedMsg = if(!med.isActive) " [DISCONTINUED by Doctor]" else ""

            Card(
                modifier = Modifier.fillMaxWidth().testTag("patient_med_item_${med.id}"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = med.name + isDiscontinuedMsg,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (med.isActive) MaterialTheme.colorScheme.onSurface else Color.Gray
                            )
                            Text(
                                text = "${med.dosage} (${med.frequency})",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (rate >= 85) SoftGreen.copy(alpha = 0.15f) else SoftOrange.copy(alpha = 0.15f)
                            ),
                            border = BorderStroke(1.dp, if (rate >= 85) SoftGreen else SoftOrange)
                        ) {
                            Text(
                                text = "Compliance: $rate%",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (rate >= 85) SoftGreen else SoftOrange
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        "Clinical Purpose: ${med.purpose}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        "Instructions: ${med.instructions}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (med.isActive) {
                        Spacer(modifier = Modifier.height(14.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(12.dp))

                        // Daily Intake Logger for Today (09 Jun, 2026)
                        Text(
                            "Log Dose Intake for Today (09 Jun):",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Taken Button
                            Button(
                                onClick = { onLogAdherence(med.id, "09 Jun, 2026", "Taken") },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (todayLog?.status == "Taken") SoftGreen else MaterialTheme.colorScheme.surfaceVariant,
                                    contentColor = if (todayLog?.status == "Taken") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                ),
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier.weight(1f).height(40.dp).testTag("log_taken_btn_${med.id}"),
                                border = BorderStroke(1.dp, if (todayLog?.status == "Taken") SoftGreen else MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Text("Mark Taken", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            // Missed Button
                            Button(
                                onClick = { onLogAdherence(med.id, "09 Jun, 2026", "Missed") },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (todayLog?.status == "Missed") SoftRed else MaterialTheme.colorScheme.surfaceVariant,
                                    contentColor = if (todayLog?.status == "Missed") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                ),
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier.weight(1f).height(40.dp).testTag("log_missed_btn_${med.id}"),
                                border = BorderStroke(1.dp, if (todayLog?.status == "Missed") SoftRed else MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.Clear, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Text("Mark Missed", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else {
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "This medication was discontinued on orders of Dr. Brewster. Please consult the clinic regarding dosage cessation protocols.",
                            color = SoftOrange,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    // Historic days visualization grid
                    Spacer(modifier = Modifier.height(14.dp))
                    Text("Intake Log History (Previous Days):", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val historyDays = listOf("05 Jun", "06 Jun", "07 Jun", "08 Jun")
                        historyDays.forEach { dayName ->
                            val fullDateStr = "$dayName, 2026"
                            val priorLog = logs.find { it.dateString == fullDateStr }
                            val logColor = when (priorLog?.status) {
                                "Taken" -> SoftGreen
                                "Missed" -> SoftRed
                                else -> Color.LightGray
                            }
                            
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(dayName, fontSize = 9.sp, color = Color.Gray)
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(logColor.copy(alpha = 0.15f))
                                        .border(1.dp, logColor, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = when (priorLog?.status) {
                                            "Taken" -> Icons.Default.Check
                                            "Missed" -> Icons.Default.Clear
                                            else -> Icons.Default.QuestionMark
                                        },
                                        contentDescription = null,
                                        tint = logColor,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                                Text(
                                    text = priorLog?.status ?: "Unlogged",
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = logColor
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun PeerSupportScreen(viewModel: PsyPyrusViewModel) {
    val peerGroups by viewModel.allPeerGroups.collectAsStateWithLifecycle()
    val selectedGroupId by viewModel.selectedGroupId.collectAsStateWithLifecycle()
    val activeMessages by viewModel.activeGroupMessages.collectAsStateWithLifecycle()
    val loggedInUser by viewModel.loggedInUser.collectAsStateWithLifecycle()
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategoryFilter by remember { mutableStateOf("All") }

    // Group Creation States
    var showCreateGroupForm by remember { mutableStateOf(false) }
    var newGroupName by remember { mutableStateOf("") }
    var newGroupDesc by remember { mutableStateOf("") }
    var newGroupCategory by remember { mutableStateOf("General Wellness") }

    // Message Input State
    var newMessageText by remember { mutableStateOf("") }
    var postAnonymously by remember { mutableStateOf(false) }

    val categories = listOf("All", "Anxiety", "Depression", "ADHD Coping", "PTSD", "General Wellness")

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .testTag("peer_support_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // HEADER
        item {
            SectionHeader(
                title = "Peer Support Network",
                icon = Icons.Default.Groups
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Secure, peer-led support rooms matched with standard HIPAA requirements. Connect anonymously with peers on similar recovery journeys, outline coping steps, and access verified facilitator guidelines.",
                fontSize = 13.sp,
                color = Color.LightGray,
                lineHeight = 18.sp
            )
        }

        // CONTROL ROW (Search, Filter, and Create Group Buttons)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = DarkCharcoalSurf),
                border = BorderStroke(1.dp, CardBorderDark)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Search bar
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Search community rooms...", fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color.Gray) },
                        singleLine = true,
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = CardBorderDark,
                            focusedBorderColor = MaterialTheme.colorScheme.primary
                        )
                    )

                    // Categories Filter Chips Row
                    Row(
                        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Filter:", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        categories.forEach { cat ->
                            val isSelected = selectedCategoryFilter == cat
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedCategoryFilter = cat },
                                label = { Text(cat, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    // Create Group Trigger button (Professionals or patient wellness advocates can create)
                    if (activeRole == "Professional" || loggedInUser != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            Button(
                                onClick = { showCreateGroupForm = !showCreateGroupForm },
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                modifier = Modifier.height(36.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (showCreateGroupForm) SoftRed else MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(
                                        imageVector = if (showCreateGroupForm) Icons.Default.Close else Icons.Default.Add,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(if (showCreateGroupForm) "Close Panel" else "Create Peer Group", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // CREATE NEW PEER GROUP FORM (EXPANDABLE)
        if (showCreateGroupForm) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Launch New Community Channel",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color.White
                        )

                        OutlinedTextField(
                            value = newGroupName,
                            onValueChange = { newGroupName = it },
                            label = { Text("Channel Name (e.g. Cognitive Reframing Support)", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp)
                        )

                        OutlinedTextField(
                            value = newGroupDesc,
                            onValueChange = { newGroupDesc = it },
                            label = { Text("Channel Intent / Description", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp)
                        )

                        Text("Select Categorical Focus:", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            val creationCategories = categories.filter { it != "All" }
                            creationCategories.forEach { cat ->
                                val isSelected = newGroupCategory == cat
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { newGroupCategory = cat },
                                    label = { Text(cat, fontSize = 11.sp) }
                                )
                            }
                        }

                        Button(
                            onClick = {
                                if (newGroupName.isNotBlank() && newGroupDesc.isNotBlank()) {
                                    val leader = if (activeRole == "Professional") (loggedInUser?.fullName ?: "Dr. Katherine Brewster") else ""
                                    viewModel.createPeerGroup(
                                        name = newGroupName,
                                        description = newGroupDesc,
                                        category = newGroupCategory,
                                        facilitatorName = leader
                                    )
                                    newGroupName = ""
                                    newGroupDesc = ""
                                    showCreateGroupForm = false
                                }
                            },
                            enabled = newGroupName.isNotBlank() && newGroupDesc.isNotBlank(),
                            modifier = Modifier.align(Alignment.End).height(38.dp)
                        ) {
                            Text("Launch Channel", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // FILTERED COMMUNITY CHANNELS HEADLINE
        item {
            Text(
                text = "Recovery Channels & Guilds",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color.White
            )
        }

        // RENDER PEER GROUPS HORIZONTAL RAIL FOR SPEEDY NAVIGATION
        val filteredGroups = peerGroups.filter { group ->
            (selectedCategoryFilter == "All" || group.category == selectedCategoryFilter) &&
            (searchQuery.isBlank() || group.name.contains(searchQuery, ignoreCase = true) || group.description.contains(searchQuery, ignoreCase = true))
        }

        if (filteredGroups.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.1f))
                ) {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.Forum, contentDescription = null, modifier = Modifier.size(32.dp), tint = Color.Gray)
                            Text("No community channels match your search.", color = Color.Gray, fontSize = 12.sp, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        } else {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    filteredGroups.forEach { group ->
                        val isSelected = selectedGroupId == group.id
                        val badgeColor = when (group.category) {
                            "Anxiety" -> SoftGreen
                            "Depression" -> MaterialTheme.colorScheme.primary
                            "ADHD Coping" -> GoldAccent
                            "PTSD" -> SoftOrange
                            else -> TealSecondary
                        }

                        Card(
                            modifier = Modifier
                                .width(220.dp)
                                .height(140.dp)
                                .clickable { viewModel.selectPeerGroup(group.id) },
                            border = BorderStroke(1.5.dp, if (isSelected) MaterialTheme.colorScheme.primary else CardBorderDark),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) DarkCharcoalBg else DarkCharcoalSurf
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp).fillMaxSize(),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(badgeColor.copy(alpha = 0.15f))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = group.category,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = badgeColor
                                            )
                                        }

                                        if (activeRole == "Professional") {
                                            IconButton(
                                                onClick = { viewModel.deletePeerGroup(group.id) },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(Icons.Default.Delete, contentDescription = "Delete Group", tint = SoftRed.copy(alpha = 0.9f), modifier = Modifier.size(14.dp))
                                            }
                                        }
                                    }

                                    Text(
                                        text = group.name,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 13.sp,
                                        color = Color.White,
                                        maxLines = 1,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                    )

                                    Text(
                                        text = group.description,
                                        fontSize = 11.sp,
                                        color = Color.Gray,
                                        maxLines = 2,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                                        lineHeight = 14.sp
                                    )
                                }

                                if (group.facilitatorName.isNotBlank()) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(Icons.Default.Verified, contentDescription = "Moderated", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(12.dp))
                                        Text("Facilitator: ${group.facilitatorName.substringBefore(" ")}", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    }
                                } else {
                                    Text("Peer Moderated", fontSize = 10.sp, color = Color.Gray, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                                }
                            }
                        }
                    }
                }
            }
        }

        // ACTIVE CONVERSATION FOR CURRENT SELECTION
        val activeGroup = peerGroups.find { it.id == selectedGroupId }
        if (activeGroup != null) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkCharcoalSurf),
                    border = BorderStroke(1.dp, CardBorderDark)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        // Title header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = activeGroup.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Recovery Room: ${activeGroup.description}",
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )
                            }
                            
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(SoftGreen.copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(SoftGreen))
                                    Text("ACTIVE POOL", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = SoftGreen)
                                }
                            }
                        }

                        // PINNED MESSAGES HEADER BLOCK (IF ANY IS PINNED)
                        val pinnedMsgs = activeMessages.filter { it.isPinned }
                        if (pinnedMsgs.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Icon(Icons.Default.PushPin, contentDescription = "Pinned", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
                                        Text("Clinical Notes & Guidelines Pinned:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                                    }
                                    
                                    pinnedMsgs.forEach { pinned ->
                                        HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
                                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                                Text(pinned.senderName, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color.White)
                                                Box(
                                                    modifier = Modifier
                                                        .clip(RoundedCornerShape(4.dp))
                                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(pinned.senderRole, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                                }
                                            }
                                            Text(pinned.messageText, fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f), lineHeight = 16.sp)
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(thickness = 1.dp, color = CardBorderDark)
                        Spacer(modifier = Modifier.height(12.dp))

                        // CHAT MESSAGES SCROLL LIST
                        if (activeMessages.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxWidth().height(140.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("This channel is quiet. Be the first to start a conversation!", fontSize = 12.sp, color = Color.Gray, textAlign = TextAlign.Center)
                            }
                        } else {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                activeMessages.forEach { msg ->
                                    val isMe = msg.senderName == (loggedInUser?.fullName ?: "Liam Carter") && !msg.isAnonymous
                                    val bubbleBg = if (msg.senderRole == "Professional") {
                                        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)
                                    } else if (isMe) {
                                        MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.12f)
                                    } else {
                                        DarkCharcoalBg.copy(alpha = 0.4f)
                                    }

                                    val bubbleBorder = if (msg.senderRole == "Professional") {
                                        BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
                                    } else {
                                        BorderStroke(1.dp, CardBorderDark)
                                    }

                                    Card(
                                        modifier = Modifier.fillMaxWidth().testTag("peer_message_bubble"),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = CardDefaults.cardColors(containerColor = bubbleBg),
                                        border = bubbleBorder
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                // Sender Profile row
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    val avatarBg = if (msg.senderRole == "Professional") MaterialTheme.colorScheme.primary else TealSecondary
                                                    Box(
                                                        modifier = Modifier
                                                            .size(24.dp)
                                                            .clip(CircleShape)
                                                            .background(avatarBg),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = if (msg.isAnonymous) "A" else msg.senderName.take(1),
                                                            fontWeight = FontWeight.Bold,
                                                            fontSize = 11.sp,
                                                            color = Color.White
                                                        )
                                                    }

                                                    Text(
                                                        text = if (msg.isAnonymous) "Anonymous Peer" else msg.senderName,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 12.sp,
                                                        color = Color.White
                                                    )

                                                    if (msg.senderRole == "Professional") {
                                                        Box(
                                                            modifier = Modifier
                                                                .clip(RoundedCornerShape(4.dp))
                                                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
                                                                .padding(horizontal = 4.dp, vertical = 1.dp)
                                                        ) {
                                                            Text("PRO MODERATOR", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                                        }
                                                    } else if (msg.isAnonymous) {
                                                        Box(
                                                            modifier = Modifier
                                                                .clip(RoundedCornerShape(4.dp))
                                                                .background(Color.Gray.copy(alpha = 0.2f))
                                                                .padding(horizontal = 4.dp, vertical = 1.dp)
                                                        ) {
                                                            Text("ANONYMOUS", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                                                        }
                                                    }
                                                }

                                                // Actions Row (Pin, Likes, Delete)
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    // Like capability
                                                    TextButton(
                                                        onClick = { viewModel.likePeerMessage(msg.id) },
                                                        contentPadding = PaddingValues(horizontal = 4.dp),
                                                        modifier = Modifier.height(24.dp)
                                                    ) {
                                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                                            Icon(Icons.Default.Favorite, contentDescription = "Like Message", tint = SoftRed, modifier = Modifier.size(10.dp))
                                                            Text(msg.likesCount.toString(), fontSize = 10.sp, color = Color.LightGray)
                                                        }
                                                    }

                                                    // Admin Pin/Delete
                                                    if (activeRole == "Professional") {
                                                        // Toggle pin
                                                        IconButton(
                                                            onClick = { viewModel.toggleMessagePin(msg.id, msg.isPinned) },
                                                            modifier = Modifier.size(24.dp)
                                                        ) {
                                                            Icon(
                                                                imageVector = Icons.Default.PushPin,
                                                                contentDescription = "Pin Message",
                                                                tint = if (msg.isPinned) MaterialTheme.colorScheme.primary else Color.Gray,
                                                                modifier = Modifier.size(12.dp)
                                                            )
                                                        }

                                                        // Delete msg
                                                        IconButton(
                                                            onClick = { viewModel.deletePeerMessage(msg.id) },
                                                            modifier = Modifier.size(24.dp)
                                                        ) {
                                                            Icon(Icons.Default.Delete, contentDescription = "Delete Message", tint = SoftRed.copy(alpha = 0.8f), modifier = Modifier.size(12.dp))
                                                        }
                                                    }
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = msg.messageText,
                                                fontSize = 13.sp,
                                                color = Color.White.copy(alpha = 0.95f),
                                                lineHeight = 17.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        HorizontalDivider(thickness = 1.dp, color = CardBorderDark)
                        Spacer(modifier = Modifier.height(12.dp))

                        // CHAT ENTRY INPUT FORM
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedTextField(
                                value = newMessageText,
                                onValueChange = { newMessageText = it },
                                placeholder = { Text("Share an insight or ask a peer...", fontSize = 12.sp) },
                                modifier = Modifier.weight(1f),
                                textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    unfocusedBorderColor = CardBorderDark,
                                    focusedBorderColor = MaterialTheme.colorScheme.primary
                                )
                            )

                            Button(
                                onClick = {
                                    if (newMessageText.isNotBlank()) {
                                        viewModel.sendPeerMessage(newMessageText, postAnonymously)
                                        newMessageText = ""
                                    }
                                },
                                enabled = newMessageText.isNotBlank(),
                                modifier = Modifier.height(44.dp)
                            ) {
                                Icon(Icons.Default.Send, contentDescription = "Send Message", modifier = Modifier.size(16.dp))
                            }
                        }

                        // Anonymity Toggle Row For Safe Sharing Option
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { postAnonymously = !postAnonymously },
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Checkbox(
                                checked = postAnonymously,
                                onCheckedChange = { postAnonymously = it },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = MaterialTheme.colorScheme.primary
                                )
                            )
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Post Anonymously, Hide My Profile Identity", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                    Icon(Icons.Default.Security, contentDescription = "HIPAA Shield Secured", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(12.dp))
                                }
                                Text("Matches strictly HIPAA standards. Keeps your true profile hidden from other peers.", fontSize = 9.sp, color = Color.Gray)
                            }
                        }
                    }
                }
            }
        } else {
            // Select a room prompt
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.1f))
                ) {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Groups, contentDescription = null, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                            Text("No Community Room Selected.", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 13.sp)
                            Text("Please select a recovery guild or channel above to read safe clinical suggestions and chat with peers.", color = Color.Gray, fontSize = 11.sp, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun MatchAndBookScreen(viewModel: PsyPyrusViewModel) {
    val loggedInUser by viewModel.loggedInUser.collectAsStateWithLifecycle()
    val activeRole by viewModel.activeRole.collectAsStateWithLifecycle()
    val allAccounts by viewModel.allUserAccounts.collectAsStateWithLifecycle()
    val appointments by viewModel.appointments.collectAsStateWithLifecycle()
    val context = LocalContext.current

    val professionals = remember(allAccounts) {
        allAccounts.filter { it.role == "Professional" }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.SupervisorAccount,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column {
                        Text(
                            text = if (activeRole == "Professional") "Professional Profile Builder" else "Discover & Match",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = if (activeRole == "Professional") "Configure your clinical specialty, bio, fees and discoverable settings." else "Match with licensed clinical professionals and book secure sessions.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                        )
                    }
                }
            }

            if (activeRole == "Professional") {
                // Professional Profile Form
                ProfessionalProfileSection(viewModel, loggedInUser, appointments)
            } else {
                // Patient Discovery & Booking View
                PatientDiscoverySection(viewModel, loggedInUser, professionals, appointments)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun ProfessionalProfileSection(
    viewModel: PsyPyrusViewModel,
    userAccount: UserAccount?,
    appointments: List<Appointment>
) {
    if (userAccount == null) return
    val context = LocalContext.current

    var fullName by remember { mutableStateOf(userAccount.fullName) }
    var specialty by remember { mutableStateOf(userAccount.specialty) }
    var licenseOrId by remember { mutableStateOf(userAccount.licenseOrId) }
    var bio by remember { mutableStateOf(userAccount.bio) }
    var experienceYears by remember { mutableStateOf(userAccount.experienceYears.toString()) }
    var clinicAddress by remember { mutableStateOf(userAccount.clinicAddress) }
    var consultationFee by remember { mutableStateOf(userAccount.consultationFee.toString()) }
    var availableHours by remember { mutableStateOf(userAccount.availableHours) }
    var languagesSpoken by remember { mutableStateOf(userAccount.languagesSpoken) }

    var isSaving by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Edit Client-Facing Metadata",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.primary
            )

            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = { Text("Clinical Display Name") },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                modifier = Modifier.fillMaxWidth().testTag("profile_full_name_input")
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = specialty,
                    onValueChange = { specialty = it },
                    label = { Text("Clinical Specialty Focus") },
                    leadingIcon = { Icon(Icons.Default.Healing, contentDescription = null) },
                    modifier = Modifier.weight(1f).testTag("profile_specialty_input")
                )

                OutlinedTextField(
                    value = licenseOrId,
                    onValueChange = { licenseOrId = it },
                    label = { Text("Licensing Credentials ID") },
                    leadingIcon = { Icon(Icons.Default.Verified, contentDescription = null) },
                    modifier = Modifier.weight(1f).testTag("profile_license_input")
                )
            }

            OutlinedTextField(
                value = bio,
                onValueChange = { bio = it },
                label = { Text("Therapy Strategy & Professional Bio") },
                maxLines = 5,
                modifier = Modifier.fillMaxWidth().testTag("profile_bio_input")
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = experienceYears,
                    onValueChange = { experienceYears = it },
                    label = { Text("Years Active") },
                    leadingIcon = { Icon(Icons.Default.Timer, contentDescription = null) },
                    modifier = Modifier.weight(1f).testTag("profile_experience_input")
                )

                OutlinedTextField(
                    value = consultationFee,
                    onValueChange = { consultationFee = it },
                    label = { Text("Consultation Fee ($)") },
                    leadingIcon = { Icon(Icons.Default.AttachMoney, contentDescription = null) },
                    modifier = Modifier.weight(1f).testTag("profile_fee_input")
                )
            }

            OutlinedTextField(
                value = clinicAddress,
                onValueChange = { clinicAddress = it },
                label = { Text("Clinic Location / Suite Address") },
                leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                modifier = Modifier.fillMaxWidth().testTag("profile_address_input")
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = availableHours,
                    onValueChange = { availableHours = it },
                    label = { Text("Available Weekly Hours") },
                    leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = null) },
                    modifier = Modifier.weight(1f).testTag("profile_hours_input")
                )

                OutlinedTextField(
                    value = languagesSpoken,
                    onValueChange = { languagesSpoken = it },
                    label = { Text("Languages Spoken") },
                    leadingIcon = { Icon(Icons.Default.Language, contentDescription = null) },
                    modifier = Modifier.weight(1f).testTag("profile_languages_input")
                )
            }

            Button(
                onClick = {
                    val exp = experienceYears.toIntOrNull() ?: 5
                    val fee = consultationFee.toDoubleOrNull() ?: 150.0
                    isSaving = true
                    viewModel.updateProfessionalProfile(
                        fullName = fullName,
                        specialty = specialty,
                        licenseOrId = licenseOrId,
                        bio = bio,
                        experienceYears = exp,
                        clinicAddress = clinicAddress,
                        consultationFee = fee,
                        availableHours = availableHours,
                        languagesSpoken = languagesSpoken
                    ) { success, msg ->
                        isSaving = false
                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                    }
                },
                modifier = Modifier.fillMaxWidth().testTag("save_profile_button"),
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("Save & Publish Profile Settings")
                }
            }
        }
    }

    // Display appointments booked specifically with THIS professional
    Spacer(modifier = Modifier.height(16.dp))
    Text(
        text = "Your Appointed Bookings",
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        color = MaterialTheme.colorScheme.onBackground
    )

    val myAppointments = remember(appointments, userAccount) {
        appointments.filter { it.practitionerName.equals(userAccount.fullName, ignoreCase = true) }
    }

    if (myAppointments.isEmpty()) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f))
        ) {
            Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.EventBusy, contentDescription = null, modifier = Modifier.size(32.dp), tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                    Text("No sessions scheduled yet.", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Text("Patients will see your details are discoverable and begin booking.", color = Color.Gray, fontSize = 11.sp)
                }
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            myAppointments.forEach { appt ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(appt.patientName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Badge(containerColor = if (appt.status == "Scheduled") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.secondaryContainer) {
                                    Text(appt.status, fontSize = 10.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                }
                            }
                            Text("Time: ${appt.dateTime}", fontSize = 12.sp, color = Color.Gray)
                            if (appt.notes.isNotBlank()) {
                                Text("Intake Complaint: ${appt.notes}", fontSize = 11.sp, fontStyle = FontStyle.Italic)
                            }
                        }
                        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("$${appt.fee}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Text(if (appt.isVideo) "Video Therapy" else "In-Office", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun PatientDiscoverySection(
    viewModel: PsyPyrusViewModel,
    patientAccount: UserAccount?,
    professionals: List<UserAccount>,
    appointments: List<Appointment>
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All Focuses") }
    var expandedProfId by remember { mutableStateOf<Long?>(null) }
    val context = LocalContext.current

    val categories = listOf("All Focuses", "Depression", "Anxiety", "ADHD", "Trauma & PTSD", "Mindfulness & CBT")

    // Filtered Professionals List
    val filteredProfessionals = remember(professionals, searchQuery, selectedCategory) {
        professionals.filter { prof ->
            val matchesSearch = prof.fullName.contains(searchQuery, ignoreCase = true) || 
                                prof.specialty.contains(searchQuery, ignoreCase = true) ||
                                prof.bio.contains(searchQuery, ignoreCase = true)

            val matchesCategory = if (selectedCategory == "All Focuses") {
                true
            } else {
                when (selectedCategory) {
                    "Depression" -> prof.specialty.contains("Depression", ignoreCase = true) || prof.bio.contains("Depression", ignoreCase = true) || prof.specialty.contains("Psychologist", ignoreCase = true)
                    "Anxiety" -> prof.specialty.contains("Anxiety", ignoreCase = true) || prof.bio.contains("Anxiety", ignoreCase = true)
                    "ADHD" -> prof.specialty.contains("ADHD", ignoreCase = true) || prof.specialty.contains("Neuro", ignoreCase = true)
                    "Trauma & PTSD" -> prof.specialty.contains("PTSD", ignoreCase = true) || prof.specialty.contains("Trauma", ignoreCase = true)
                    "Mindfulness & CBT" -> prof.specialty.contains("CBT", ignoreCase = true) || prof.bio.contains("mindful", ignoreCase = true) || prof.specialty.contains("Counselor", ignoreCase = true)
                    else -> true
                }
            }
            matchesSearch && matchesCategory
        }
    }

    // Search & Category Row
    OutlinedTextField(
        value = searchQuery,
        onValueChange = { searchQuery = it },
        placeholder = { Text("Search practitioner by name or specialty...") },
        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
        modifier = Modifier.fillMaxWidth().testTag("patient_search_practitioners_input")
    )

    Spacer(modifier = Modifier.height(4.dp))

    // Category Selector
    Row(
        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        categories.forEach { cat ->
            FilterChip(
                selected = selectedCategory == cat,
                onClick = { selectedCategory = cat },
                label = { Text(cat, fontSize = 11.sp) },
                modifier = Modifier.testTag("filter_chip_$cat")
            )
        }
    }

    Spacer(modifier = Modifier.height(8.dp))

    if (filteredProfessionals.isEmpty()) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f))
        ) {
            Box(modifier = Modifier.padding(32.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.SearchOff, contentDescription = null, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                    Text("No practitioners found matching selection.", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Try resetting filters or expanding keyword query searches.", color = Color.Gray, fontSize = 11.sp)
                }
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            filteredProfessionals.forEach { prof ->
                val isExpanded = expandedProfId == prof.id
                
                // AI match compatibility percent calculation based on category matched
                val matchScore = remember(prof, selectedCategory) {
                    val base = 85
                    val categoryBonus = if (selectedCategory != "All Focuses") 11 else 5
                    val ratingBonus = ((prof.rating - 4.0) * 10).toInt()
                    (base + categoryBonus + ratingBonus).coerceAtMost(99)
                }

                Card(
                    modifier = Modifier.fillMaxWidth().clickable {
                        expandedProfId = if (isExpanded) null else prof.id
                    },
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isExpanded) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
                    ),
                    border = if (isExpanded) BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else null
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = prof.fullName.split(" ").lastOrNull()?.take(1) ?: "P",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Column {
                                    Text(prof.fullName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text(prof.specialty, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                                }
                            }

                            // Match Score Widget
                            Column(horizontalAlignment = Alignment.End) {
                                Badge(containerColor = MaterialTheme.colorScheme.tertiaryContainer) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(10.dp), tint = MaterialTheme.colorScheme.onTertiaryContainer)
                                        Text("$matchScore% Match", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onTertiaryContainer)
                                    }
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFFFFD700))
                                    Text(prof.rating.toString(), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isExpanded) prof.bio else prof.bio.take(120) + "...",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                        )

                        // Meta details row
                        Spacer(modifier = Modifier.height(8.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Default.Timer, contentDescription = null, modifier = Modifier.size(13.dp), tint = Color.Gray)
                                Text("${prof.experienceYears} Years Exp", fontSize = 11.sp, color = Color.Gray)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Default.AttachMoney, contentDescription = null, modifier = Modifier.size(13.dp), tint = Color.Gray)
                                Text("$${prof.consultationFee.toInt()} / Session", fontSize = 11.sp, color = Color.Gray)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Default.Language, contentDescription = null, modifier = Modifier.size(13.dp), tint = Color.Gray)
                                Text(prof.languagesSpoken, fontSize = 11.sp, color = Color.Gray)
                            }
                        }

                        AnimatedVisibility(visible = isExpanded) {
                            Column(
                                modifier = Modifier.padding(top = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Divider(color = MaterialTheme.colorScheme.outlineVariant)
                                
                                Text("Clinic Location Details:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                                    Text(prof.clinicAddress, fontSize = 12.sp)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                                    Text("Official Consultation Hours: ${prof.availableHours}", fontSize = 12.sp)
                                }

                                // Interactive booking scheduler
                                Divider(color = MaterialTheme.colorScheme.outlineVariant)
                                Text("Select Appointment Slot:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                                
                                var selectedTimeSlot by remember { mutableStateOf("Tomorrow, 10:30 AM") }
                                val proposedSlots = listOf("Tomorrow, 09:00 AM", "Tomorrow, 10:30 AM", "Tomorrow, 01:00 PM", "Tomorrow, 03:30 PM", "15 Jun, 11:00 AM", "16 Jun, 02:00 PM")
                                
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    proposedSlots.forEach { slot ->
                                        ElevatedCard(
                                            onClick = { selectedTimeSlot = slot },
                                            colors = CardDefaults.cardColors(
                                                containerColor = if (selectedTimeSlot == slot) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                                            ),
                                            modifier = Modifier.padding(1.dp)
                                        ) {
                                            Text(
                                                text = slot,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = if (selectedTimeSlot == slot) Color.White else MaterialTheme.colorScheme.onSurface,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                                            )
                                        }
                                    }
                                }

                                var intakeNotes by remember { mutableStateOf("") }
                                var isVideoConsult by remember { mutableStateOf(true) }

                                OutlinedTextField(
                                    value = intakeNotes,
                                    onValueChange = { intakeNotes = it },
                                    label = { Text("Consultation Intake Reason") },
                                    placeholder = { Text("Briefly describe symptoms, anxiety goals, or reasons for booking...") },
                                    modifier = Modifier.fillMaxWidth().testTag("clinical_intake_reason_field"),
                                    maxLines = 3
                                )

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Checkbox(
                                            checked = isVideoConsult,
                                            onCheckedChange = { isVideoConsult = it },
                                            modifier = Modifier.testTag("video_consult_checkbox")
                                        )
                                        Text("Book as Teletherapy Video Session", fontSize = 12.sp)
                                    }
                                }

                                Button(
                                    onClick = {
                                        viewModel.bookAppointment(
                                            practitionerName = prof.fullName,
                                            dateTime = selectedTimeSlot,
                                            notes = intakeNotes,
                                            isVideo = isVideoConsult,
                                            fee = prof.consultationFee
                                        ) { success, msg ->
                                            if (success) {
                                                Toast.makeText(context, "$msg See active Teletherapy channel list.", Toast.LENGTH_LONG).show()
                                                expandedProfId = null
                                            }
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth().height(48.dp).testTag("confirm_booking_button")
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.Check, contentDescription = null)
                                        Text("Confirm Safe Appointment Booking")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Displays historical appointments for Patients booked as well!
    Spacer(modifier = Modifier.height(24.dp))
    Text(
        text = "Your Booked Appointments",
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        color = MaterialTheme.colorScheme.onBackground
    )

    val clientAppointments = remember(appointments, patientAccount) {
        if (patientAccount == null) emptyList() else appointments.filter { it.patientId == patientAccount.id }
    }

    if (clientAppointments.isEmpty()) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.1f))
        ) {
            Box(modifier = Modifier.padding(20.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("No session bookings yet. Expand a practitioner's profile card to schedule.", color = Color.Gray, fontSize = 11.sp, textAlign = TextAlign.Center)
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            clientAppointments.forEach { appt ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(appt.practitionerName, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                            Text("Scheduled: ${appt.dateTime}", fontSize = 11.sp, color = Color.Gray)
                            if (appt.notes.isNotBlank()) {
                                Text("Notes: ${appt.notes}", fontSize = 11.sp, fontStyle = FontStyle.Italic)
                            }
                        }
                        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("$${appt.fee}", fontWeight = FontWeight.Bold)
                            Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Icon(
                                        imageVector = if (appt.isVideo) Icons.Default.Videocam else Icons.Default.LocationOn,
                                        contentDescription = null,
                                        modifier = Modifier.size(10.dp),
                                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Text(if (appt.isVideo) "Video Slot" else "In-Office", fontSize = 9.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

