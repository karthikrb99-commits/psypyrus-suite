import os
import uuid

# Helper to generate Xcode-compatible 24-character hexadecimal UUIDs
def get_xcode_uuid(name):
    # Generates a stable UUID based on a seed name to avoid regenerations changing IDs
    ns = uuid.UUID('75fa3d6b-dc79-4ff8-a3f2-ef67756f7db1')
    u = uuid.uuid5(ns, name)
    return u.hex[:24].upper()

project_name = "PsyPyrus"
bundle_identifier = "com.example.PsyPyrus"

# Define the file hierarchy matching our actual folder structure
files_and_groups = {
    "PsyPyrusApp.swift": "App",
    "Models/Entities.swift": "Models",
    "Services/DsmDatabase.swift": "Services",
    "Services/DiagnosticEngine.swift": "Services",
    "Services/GeminiService.swift": "Services",
    "Services/ClinicalTrialsService.swift": "Services",
    "Services/SecurityLogger.swift": "Services",
    "Services/IcdService.swift": "Services",
    "ViewModels/PsyPyrusViewModel.swift": "ViewModels",
    "Views/CommonComponents.swift": "Views",
    "Views/BiometricLockView.swift": "Views",
    "Views/MainLayoutView.swift": "Views",
    "Views/ContentView.swift": "Views",
    "Views/Professional/ClinicianDashboardView.swift": "Views/Professional",
    "Views/Professional/SoapNoteView.swift": "Views/Professional",
    "Views/Professional/MentalStatusExamView.swift": "Views/Professional",
    "Views/Professional/DiagnosticsSuiteView.swift": "Views/Professional",
    "Views/Professional/TreatmentPlannerView.swift": "Views/Professional",
    "Views/Professional/HitopMatrixExplorerView.swift": "Views/Professional",
    "Views/Professional/RdocMatrixExplorerView.swift": "Views/Professional",
    "Views/Shared/InteractiveAssessmentsView.swift": "Views/Shared",
    "Views/Shared/TeletherapyView.swift": "Views/Shared",
    "Views/Shared/HipaSecurityShieldView.swift": "Views/Shared",
    "Views/Shared/MarketplaceView.swift": "Views/Shared",
    "Views/Patient/PatientDashboardView.swift": "Views/Patient",
    "Views/Patient/WellnessLoungeView.swift": "Views/Patient",
    "Views/Patient/MindShopView.swift": "Views/Patient"
}

# Generate UUIDs for all elements
project_uuid = get_xcode_uuid("project")
target_uuid = get_xcode_uuid("target")
target_product_uuid = get_xcode_uuid("target_product")
sources_build_phase_uuid = get_xcode_uuid("sources_build_phase")
frameworks_build_phase_uuid = get_xcode_uuid("frameworks_build_phase")
resources_build_phase_uuid = get_xcode_uuid("resources_build_phase")
main_group_uuid = get_xcode_uuid("main_group")
products_group_uuid = get_xcode_uuid("products_group")
product_ref_uuid = get_xcode_uuid("product_ref")
build_config_list_proj_uuid = get_xcode_uuid("build_config_list_proj")
build_config_list_targ_uuid = get_xcode_uuid("build_config_list_targ")
config_debug_proj_uuid = get_xcode_uuid("config_debug_proj")
config_release_proj_uuid = get_xcode_uuid("config_release_proj")
config_debug_targ_uuid = get_xcode_uuid("config_debug_targ")
config_release_targ_uuid = get_xcode_uuid("config_release_targ")

# Unique UUID mapping for files
file_uuids = {}
build_uuids = {}
for filepath in files_and_groups:
    file_uuids[filepath] = get_xcode_uuid(f"file_ref_{filepath}")
    build_uuids[filepath] = get_xcode_uuid(f"build_file_{filepath}")

# Determine all unique sub-groups
groups = set()
for g in files_and_groups.values():
    parts = g.split('/')
    for i in range(1, len(parts) + 1):
        groups.add('/'.join(parts[:i]))
groups = sorted(list(groups))

group_uuids = {g: get_xcode_uuid(f"group_{g}") for g in groups}

# Begin assembling project.pbxproj content
pbxproj = f"""// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
"""

for filepath in files_and_groups:
    pbxproj += f"\t\t{build_uuids[filepath]} /* {os.path.basename(filepath)} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_uuids[filepath]} /* {os.path.basename(filepath)} */; }};\n"

pbxproj += """/* End PBXBuildFile section */

/* Begin PBXFileReference section */
"""

pbxproj += f"\t\t{product_ref_uuid} /* {project_name}.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = {project_name}.app; sourceTree = BUILT_PRODUCTS_DIR; }};\n"

for filepath in files_and_groups:
    # Set Swift source file properties
    pbxproj += f"\t\t{file_uuids[filepath]} /* {os.path.basename(filepath)} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = {os.path.basename(filepath)}; path = {project_name}/{filepath}; sourceTree = SOURCE_ROOT; }};\n"

pbxproj += """/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
"""

pbxproj += f"""\t\t{frameworks_build_phase_uuid} /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
"""

# Products group
pbxproj += f"""\t\t{products_group_uuid} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{product_ref_uuid} /* {project_name}.app */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
"""

# Sub groups
for g in groups:
    # Find children of this group
    children_strings = []
    
    # Add immediate subgroups
    for subg in groups:
        if '/' in subg and subg.rsplit('/', 1)[0] == g:
            children_strings.append(f"\t\t\t\t{group_uuids[subg]} /* {subg.split('/')[-1]} */,")
        elif '/' not in subg and g == "" and subg != "":
            # Root level groups
            pass
            
    # Add files directly inside this group
    for filepath, fileg in files_and_groups.items():
        if fileg == g:
            children_strings.append(f"\t\t\t\t{file_uuids[filepath]} /* {os.path.basename(filepath)} */,")
            
    children_content = "\n".join(children_strings)
    
    name = g.split('/')[-1]
    pbxproj += f"""\t\t{group_uuids[g]} /* {name} */ = {{
			isa = PBXGroup;
			children = (
{children_content}
			);
			name = {name};
			sourceTree = "<group>";
		}};
"""

# Main group children
main_children = []
for subg in groups:
    if '/' not in subg:
        main_children.append(f"\t\t\t\t{group_uuids[subg]} /* {subg} */,")
for filepath, fileg in files_and_groups.items():
    if fileg == "":
        main_children.append(f"\t\t\t\t{file_uuids[filepath]} /* {os.path.basename(filepath)} */,")
main_children.append(f"\t\t\t\t{products_group_uuid} /* Products */,")
main_children_content = "\n".join(main_children)

pbxproj += f"""\t\t{main_group_uuid} = {{
			isa = PBXGroup;
			children = (
{main_children_content}
			);
			sourceTree = "<group>";
		}};
/* End PBXGroup section */

/* Begin PBXProject section */
\t\t{project_uuid} /* Project object */ = {{
			isa = PBXProject;
			attributes = {{
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
				TargetAttributes = {{
					{target_uuid} = {{
						CreatedOnToolsVersion = 15.0;
					}};
				}};
			}};
			buildConfigurationList = {build_config_list_proj_uuid} /* Build configuration list for PBXProject "{project_name}" */;
			compatibilityVersion = "Xcode 15.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = {main_group_uuid};
			productRefGroup = {products_group_uuid} /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{target_uuid} /* {project_name} */,
			);
		}};
/* End PBXProject section */

/* Begin PBXSourcesBuildPhase section */
		{sources_build_phase_uuid} /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
"""

for filepath in files_and_groups:
    pbxproj += f"\t\t\t\t{build_uuids[filepath]} /* {os.path.basename(filepath)} in Sources */,\n"

pbxproj += f"""\t\t\t);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXSourcesBuildPhase section */

/* Begin PBXNativeTarget section */
		{target_uuid} /* {project_name} */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {build_config_list_targ_uuid} /* Build configuration list for PBXNativeTarget "{project_name}" */;
			buildPhases = (
				{sources_build_phase_uuid} /* Sources */,
				{frameworks_build_phase_uuid} /* Frameworks */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = {project_name};
			productName = {project_name};
			productReference = {product_ref_uuid} /* {project_name}.app */;
			productType = "com.apple.product-type.application";
		}};
/* End PBXNativeTarget section */

/* Begin XCBuildConfiguration section */
		{config_debug_proj_uuid} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_REPLAY = YES;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUICKTIME_CONVERSION = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				MTL_FAST_MATH = YES;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			}};
			name = Debug;
		}};
		{config_release_proj_uuid} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_REPLAY = YES;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUICKTIME_CONVERSION = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				COPY_PHASE_STRIP = YES;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				MTL_FAST_MATH = YES;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				VALIDATE_PRODUCT = YES;
			}};
			name = Release;
		}};
		{config_debug_targ_uuid} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_ASSET_PATHS = "";
				ENABLE_PREVIEWS = YES;
				INFOPLIST_KEY_CFBundleDisplayName = "PsyPyrus";
				INFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.healthcare-fitness";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = {bundle_identifier};
				PRODUCT_NAME = "$(TARGET_NAME)";
				SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";
				SUPPORTS_MACCATALYST = NO;
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Debug;
		}};
		{config_release_targ_uuid} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_ASSET_PATHS = "";
				ENABLE_PREVIEWS = YES;
				INFOPLIST_KEY_CFBundleDisplayName = "PsyPyrus";
				INFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.healthcare-fitness";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = {bundle_identifier};
				PRODUCT_NAME = "$(TARGET_NAME)";
				SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";
				SUPPORTS_MACCATALYST = NO;
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{build_config_list_proj_uuid} /* Build configuration list for PBXProject "{project_name}" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{config_debug_proj_uuid} /* Debug */,
				{config_release_proj_uuid} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{build_config_list_targ_uuid} /* Build configuration list for PBXNativeTarget "{project_name}" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{config_debug_targ_uuid} /* Debug */,
				{config_release_targ_uuid} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = {project_uuid} /* Project object */;
}}
"""

os.makedirs(f"{project_name}.xcodeproj", exist_ok=True)
with open(f"{project_name}.xcodeproj/project.pbxproj", "w", encoding="utf-8") as f:
    f.write(pbxproj)

print("Xcode project generated successfully in PsyPyrus.xcodeproj/project.pbxproj")
