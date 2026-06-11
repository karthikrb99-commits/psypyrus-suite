package com.example.ui

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LoginSignupScreen(
    viewModel: PsyPyrusViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isRegMode by remember { mutableStateOf(false) } // false for Login, true for Signup
    
    // Inputs
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("Professional") } // "Professional" or "Patient"
    var licenseOrId by remember { mutableStateOf("") }
    var selectedSpecialty by remember { mutableStateOf("Clinical Psychologist (Ph.D. / Psy.D.)") }
    
    val professionalSubtypes = remember {
        listOf(
            "Psychiatrist (M.D. / D.O.)",
            "Clinical Psychologist (Ph.D. / Psy.D.)",
            "Counselling Psychologist",
            "Consultant Psychologist",
            "Clinical Social Worker (LCSW)",
            "Mental Health Counselor (LMHC)"
        )
    }
    
    var isPasswordVisible by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        DarkCharcoalBg,
                        Color(0xFF0F172A).copy(alpha = 0.95f),
                        Color(0xFF020617)
                    )
                )
            )
            .testTag("login_signup_screen"),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .verticalScroll(rememberScrollState())
                .padding(vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header Logo & Branding
            Card(
                modifier = Modifier
                    .size(68.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
            ) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Healing,
                        contentDescription = "PsyPyrus Clinical Logo",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(14.dp))
            
            Text(
                text = "Papyrus AI OS",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Next-Generation HIPAA Compliant Clinical Platform",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.85f),
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Tab Row Toggle (Login vs signup)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(26.dp),
                colors = CardDefaults.cardColors(containerColor = DarkCharcoalSurf),
                border = BorderStroke(1.dp, CardBorderDark)
            ) {
                Row(modifier = Modifier.fillMaxSize()) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .padding(4.dp)
                            .clip(RoundedCornerShape(22.dp))
                            .background(if (!isRegMode) MaterialTheme.colorScheme.primary else Color.Transparent)
                            .clickable { 
                                isRegMode = false 
                                errorMessage = null
                            }
                            .testTag("tab_login"),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "LOGIN",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (!isRegMode) Color.White else Color.Gray
                        )
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .padding(4.dp)
                            .clip(RoundedCornerShape(22.dp))
                            .background(if (isRegMode) MaterialTheme.colorScheme.primary else Color.Transparent)
                            .clickable { 
                                isRegMode = true 
                                errorMessage = null
                                if (licenseOrId.isEmpty()) {
                                    licenseOrId = if (selectedRole == "Professional") "PSY-9922-OS" else "CHART-3810"
                                }
                            }
                            .testTag("tab_signup"),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "SIGN UP",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isRegMode) Color.White else Color.Gray
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // Inside Login/Signup Form Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.05f)),
                border = BorderStroke(1.dp, CardBorderDark.copy(alpha = 0.5f))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = if (isRegMode) "Create Secured Credentials" else "Provide Secure Keys",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isRegMode) "Join other therapists using encrypted journals." else "Access patient records, analytics suite and SOAP logs.",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                    
                    Spacer(modifier = Modifier.height(18.dp))
                    
                    // Error view
                    AnimatedVisibility(
                        visible = errorMessage != null,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            colors = CardDefaults.cardColors(containerColor = SoftRed.copy(alpha = 0.12f)),
                            border = BorderStroke(1.dp, SoftRed.copy(alpha = 0.35f))
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = "Error", tint = SoftRed, modifier = Modifier.size(16.dp))
                                Text(
                                    text = errorMessage ?: "",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = SoftRed,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                    
                    // Full Name (Only in Registration Mode)
                    AnimatedVisibility(
                        visible = isRegMode,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Column {
                            OutlinedTextField(
                                value = fullName,
                                onValueChange = { fullName = it },
                                label = { Text("Full Name", fontSize = 12.sp) },
                                placeholder = { Text("Dr. Katherine Brewster") },
                                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(18.dp)) },
                                modifier = Modifier.fillMaxWidth().testTag("input_fullname"),
                                textStyle = MaterialTheme.typography.bodyMedium,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                    }
                    
                    // Username input
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Username", fontSize = 12.sp) },
                        placeholder = { Text("e.g. doctor") },
                        leadingIcon = { Icon(Icons.Default.AccountCircle, contentDescription = null, modifier = Modifier.size(18.dp)) },
                        modifier = Modifier.fillMaxWidth().testTag("input_username"),
                        textStyle = MaterialTheme.typography.bodyMedium,
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Email Input (Only in Registration Mode)
                    AnimatedVisibility(
                        visible = isRegMode,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Column {
                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = { Text("Email Address", fontSize = 12.sp) },
                                placeholder = { Text("doctor@psy.com") },
                                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, modifier = Modifier.size(18.dp)) },
                                modifier = Modifier.fillMaxWidth().testTag("input_email"),
                                textStyle = MaterialTheme.typography.bodyMedium,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                    }
                    
                    // Password input
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Secured Passphrase", fontSize = 12.sp) },
                        placeholder = { Text("e.g. doctor123") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp)) },
                        trailingIcon = {
                            IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                Icon(
                                    imageVector = if (isPasswordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = "Toggle password visibility",
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        },
                        visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        modifier = Modifier.fillMaxWidth().testTag("input_password"),
                        textStyle = MaterialTheme.typography.bodyMedium,
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    // Role & Specialty Licensing / Patient Chart ID (Only in Registration Mode)
                    AnimatedVisibility(
                        visible = isRegMode,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Column {
                            Spacer(modifier = Modifier.height(14.dp))
                            Text("Account Role Type:", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp)
                                        .clickable { 
                                            selectedRole = "Professional"
                                            licenseOrId = "PSY-9922-OS"
                                        },
                                    border = BorderStroke(1.dp, if (selectedRole == "Professional") MaterialTheme.colorScheme.primary else CardBorderDark),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (selectedRole == "Professional") MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else Color.Transparent
                                    )
                                ) {
                                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                        Text("Professional STAFF", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (selectedRole == "Professional") Color.White else Color.Gray)
                                    }
                                }
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp)
                                        .clickable { 
                                            selectedRole = "Patient"
                                            licenseOrId = "CHART-3810"
                                        },
                                    border = BorderStroke(1.dp, if (selectedRole == "Patient") MaterialTheme.colorScheme.primary else CardBorderDark),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (selectedRole == "Patient") MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else Color.Transparent
                                    )
                                ) {
                                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                        Text("Patient CLIENT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (selectedRole == "Patient") Color.White else Color.Gray)
                                    }
                                }
                            }
                            
                            if (selectedRole == "Professional") {
                                Spacer(modifier = Modifier.height(14.dp))
                                Text("Professional Specialty / Subtype:", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(6.dp))
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, CardBorderDark),
                                    colors = CardDefaults.cardColors(containerColor = DarkCharcoalSurf.copy(alpha = 0.5f))
                                ) {
                                    Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        professionalSubtypes.forEach { subtype ->
                                            val isSubSelected = selectedSpecialty == subtype
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(if (isSubSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) else Color.Transparent)
                                                    .clickable { selectedSpecialty = subtype }
                                                    .padding(horizontal = 10.dp, vertical = 7.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                RadioButton(
                                                    selected = isSubSelected,
                                                    onClick = { selectedSpecialty = subtype },
                                                    colors = RadioButtonDefaults.colors(selectedColor = MaterialTheme.colorScheme.primary)
                                                )
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Icon(
                                                    imageVector = when {
                                                        subtype.contains("Psychiatrist") -> Icons.Default.LocalHospital
                                                        subtype.contains("Clinical Psychologist") -> Icons.Default.Face
                                                        subtype.contains("Counselling") -> Icons.Default.AccountBox
                                                        subtype.contains("Consultant") -> Icons.Default.SupervisorAccount
                                                        subtype.contains("Social Worker") -> Icons.Default.Groups
                                                        else -> Icons.Default.Favorite
                                                    },
                                                    contentDescription = null,
                                                    tint = if (isSubSelected) MaterialTheme.colorScheme.primary else Color.Gray,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Text(
                                                    text = subtype,
                                                    fontSize = 11.sp,
                                                    fontWeight = if (isSubSelected) FontWeight.Bold else FontWeight.Normal,
                                                    color = if (isSubSelected) Color.White else Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            
                            OutlinedTextField(
                                value = licenseOrId,
                                onValueChange = { licenseOrId = it },
                                label = { Text(if (selectedRole == "Professional") "Medical Licensing Identification No." else "EHR Client Chart ID reference", fontSize = 12.sp) },
                                modifier = Modifier.fillMaxWidth().testTag("input_extra_id"),
                                leadingIcon = { Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.size(18.dp)) },
                                textStyle = MaterialTheme.typography.bodyMedium,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    // Submit Button
                    Button(
                        onClick = {
                            if (isRegMode) {
                                isLoading = true
                                errorMessage = null
                                viewModel.signup(
                                    username = username,
                                    email = email,
                                    passwordPlain = password,
                                    role = selectedRole,
                                    fullName = fullName,
                                    licenseOrId = licenseOrId,
                                    specialty = if (selectedRole == "Professional") selectedSpecialty else "",
                                    onResult = { success, msg ->
                                        isLoading = false
                                        if (success) {
                                            Toast.makeText(context, "Account Secured successfully. System Enrolled.", Toast.LENGTH_SHORT).show()
                                        } else {
                                            errorMessage = msg
                                        }
                                    }
                                )
                            } else {
                                isLoading = true
                                errorMessage = null
                                viewModel.login(
                                    usernameOrEmail = username,
                                    passwordPlain = password,
                                    onResult = { success, msg ->
                                        isLoading = false
                                        if (success) {
                                            Toast.makeText(context, "Welcome back, verified user.", Toast.LENGTH_SHORT).show()
                                        } else {
                                            errorMessage = msg
                                        }
                                    }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("auth_submit_btn"),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        } else {
                            Icon(
                                imageVector = if (isRegMode) Icons.Default.CheckCircle else Icons.Default.LockOpen,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isRegMode) "ENROL SECURITY SCHEME" else "MUTUAL HANDSHAKE & VERIFY",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(18.dp))
            
            // QUICK DEVELOPER TRIAL BUTTONS FOR EASY NAVIGATION
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, GoldAccent.copy(alpha = 0.3f)),
                colors = CardDefaults.cardColors(containerColor = GoldAccent.copy(alpha = 0.02f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.Info, contentDescription = "", tint = GoldAccent, modifier = Modifier.size(14.dp))
                        Text(
                            text = "PRE-SECURED COMPLIANCE BYPASS ACCOUNTS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = GoldAccent
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "The review platform pre-registers credentials for quick evaluation:",
                        fontSize = 10.sp,
                        color = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    // Box columns for quick logins
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                username = "doctor"
                                password = "doctor123"
                                isRegMode = false
                                isLoading = true
                                errorMessage = null
                                viewModel.login("doctor", "doctor123") { s, m ->
                                    isLoading = false
                                    if (s) Toast.makeText(context, "Staff clinical key loaded.", Toast.LENGTH_SHORT).show()
                                    else errorMessage = m
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.12f)),
                            modifier = Modifier.fillMaxWidth().height(36.dp).testTag("quick_doctor_bypass"),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text(
                                text = "🔑 Clinician: doctor / doctor123",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        
                        Button(
                            onClick = {
                                username = "patient"
                                password = "patient123"
                                isRegMode = false
                                isLoading = true
                                errorMessage = null
                                viewModel.login("patient", "patient123") { s, m ->
                                    isLoading = false
                                    if (s) Toast.makeText(context, "Patient key loaded.", Toast.LENGTH_SHORT).show()
                                    else errorMessage = m
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = TealSecondary.copy(alpha = 0.12f)),
                            modifier = Modifier.fillMaxWidth().height(36.dp).testTag("quick_patient_bypass"),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text(
                                text = "🔑 Patient: patient / patient123",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = TealSecondary
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Compliance banner
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(Icons.Default.Security, contentDescription = null, tint = SoftGreen, modifier = Modifier.size(12.dp))
                Text(
                    text = "AESGCM-256 E2EE DATA STORAGE COMPLIANT",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = SoftGreen
                )
            }
        }
    }
}
