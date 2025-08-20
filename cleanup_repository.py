#!/usr/bin/env python3
"""
Repository Cleanup Script
Removes duplicate files, unnecessary documentation, and bloated directories
"""

import os
import shutil
import glob
from pathlib import Path

def cleanup_repository():
    """Clean up repository by removing unnecessary files and directories"""
    
    print("🧹 Starting Repository Cleanup...")
    
    # Directories to remove (causing deployment bloat)
    directories_to_remove = [
        "docs",           # Qlib documentation (not needed for our app)
        "examples",       # Example code (not needed for production)
        "qlib",          # Core qlib library (heavy, use pip install instead)
        "scripts",       # Data collection scripts (not needed)
        "pyqlib.egg-info", # Build artifacts
        "tests/automation", # Heavy test automation
        "api-gateway",   # Duplicate microservice
        "customer-service", # Duplicate microservice  
        "trading-engine", # Duplicate microservice
        "__pycache__",   # Python cache
        "mlruns",        # MLflow runs
    ]
    
    # Files to remove (duplicate documentation)
    files_to_remove = [
        "ARCHITECTURE_CLEAN.md",
        "BUSINESS_READINESS_ASSESSMENT.md", 
        "BUSINESS_VALUE_GUIDE.md",
        "BUTTON_AUDIT.md",
        "CHANGES.rst",
        "CODE_OF_CONDUCT.md",
        "COMPONENT_INTEGRATION_ANALYSIS.md",
        "COMPREHENSIVE_TESTING_STRATEGY.md",
        "COMPREHENSIVE_USER_TESTING_SCENARIOS.md",
        "CURRENT_STATUS.md",
        "DEMO_TESTING_CHECKLIST.md",
        "DEPLOYMENT_GUIDE.md", 
        "DEPLOYMENT_GUIDE_PRODUCTION.md",
        "ENTERPRISE_ARCHITECTURE.md",
        "ENTERPRISE_IMPLEMENTATION_GUIDE.md",
        "ENTERPRISE_KYC_ARCHITECTURE.md",
        "FEATURE_EXPLANATIONS.md",
        "FRONTEND_RESTART_GUIDE.md",
        "HYBRID_DEVELOPMENT_STRATEGY.md",
        "IMPLEMENTATION_SUMMARY.md",
        "INTEGRATION_COMPLETE.md",
        "MANIFEST.in",
        "MASTER_INTEGRATION_PLAN.md",
        "MONITORING_OBSERVABILITY_FRAMEWORK.md",
        "Makefile",
        "NOTIFICATION_SYSTEM_README.md",
        "PRODUCTION_DEPLOYMENT_GUIDE.md",
        "PRODUCTION_DEPLOYMENT_STRATEGY.md",
        "QUICK_START.md",
        "QUICK_TEST.md", 
        "SECURITY.md",
        "STAFF_DASHBOARDS_IMPLEMENTATION.md",
        "STARTUP_GUIDE.md",
        "SYSTEM_INTEGRATION_DEPLOYMENT_SUMMARY.md",
        "TEST_ACCOUNT_ARCHITECTURE.md",
        "TRANSFORMATION_COMPLETE.md",
        "TROUBLESHOOTING.md",
    ]
    
    removed_count = 0
    
    # Remove directories
    for dir_name in directories_to_remove:
        if os.path.exists(dir_name):
            try:
                shutil.rmtree(dir_name)
                print(f"✅ Removed directory: {dir_name}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Failed to remove {dir_name}: {e}")
    
    # Remove files
    for file_name in files_to_remove:
        if os.path.exists(file_name):
            try:
                os.remove(file_name)
                print(f"✅ Removed file: {file_name}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Failed to remove {file_name}: {e}")
    
    # Keep only essential files
    essential_files = [
        "README.md",
        "DEPLOYMENT_READY_SUMMARY.md", 
        "JSX_SAFETY_GUIDE.md",
        "RAILWAY_DEPLOYMENT_STATUS.md",
        "LICENSE"
    ]
    
    print(f"\n📊 Cleanup Summary:")
    print(f"   - Removed {removed_count} files/directories")
    print(f"   - Kept essential files: {', '.join(essential_files)}")
    print(f"   - Core directories preserved: backend/, frontend/, database/, supabase/")
    
    return removed_count

if __name__ == "__main__":
    cleanup_repository()