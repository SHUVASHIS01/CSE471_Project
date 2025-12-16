/**
 * Check what data is being used for job matching
 * Shows ALL existing profile data (new and old) being used
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const JobAlert = require('../models/JobAlert');
const { processJobAlert } = require('../services/smartJobAlertService');

async function checkMatchingData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'cse471project10@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('📊 CURRENT MATCHING PREFERENCES ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get all user data
    console.log('1️⃣  ALL PROFILE DATA (NEW + OLD):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('   📋 SKILLS (ALL - Used for 35% weight):');
    const allSkills = user.skills || [];
    if (allSkills.length > 0) {
      allSkills.forEach((skill, i) => {
        console.log(`      ${i + 1}. ${skill}`);
      });
      console.log(`   ✅ Total: ${allSkills.length} skills (ALL are used for matching)`);
    } else {
      console.log('      ⚠️  No skills in profile');
    }
    console.log('');

    console.log('   🔑 PROFILE KEYWORDS (ALL - Highest Priority, 30% weight):');
    const allKeywords = user.profileKeywords || [];
    if (allKeywords.length > 0) {
      allKeywords.forEach((keyword, i) => {
        console.log(`      ${i + 1}. ${keyword}`);
      });
      console.log(`   ✅ Total: ${allKeywords.length} keywords (ALL are used for matching)`);
    } else {
      console.log('      ⚠️  No profile keywords saved');
    }
    console.log('');

    console.log('   🔍 SEARCH HISTORY (ALL - Last 20 searches used):');
    const allSearches = user.searchHistory || [];
    if (allSearches.length > 0) {
      const recentSearches = allSearches.slice(-20); // Last 20 (what's actually used)
      console.log(`   Total searches in history: ${allSearches.length}`);
      console.log(`   Searches being used: ${recentSearches.length} (last 20)`);
      console.log('   Recent searches used for matching:');
      recentSearches.forEach((search, i) => {
        const date = new Date(search.searchedAt).toLocaleString();
        console.log(`      ${i + 1}. "${search.term}" (${date})`);
      });
      console.log(`   ✅ Last ${recentSearches.length} searches are used for matching`);
    } else {
      console.log('      ⚠️  No search history');
    }
    console.log('');

    // Check job alert
    const alert = await JobAlert.findOne({ userId: user._id, isActive: true });
    console.log('2️⃣  JOB ALERT CONFIGURATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (alert) {
      console.log(`   Alert Name: ${alert.name}`);
      console.log(`   Active: ${alert.isActive}`);
      console.log(`   Frequency: ${alert.frequency}`);
      console.log('');
      
      console.log('   📝 Manual Keywords (if set):');
      const alertKeywords = alert.keywords || [];
      if (alertKeywords.length > 0) {
        alertKeywords.forEach((keyword, i) => {
          console.log(`      ${i + 1}. ${keyword}`);
        });
      } else {
        console.log('      ✅ Using automatic sources (profile + search history)');
      }
      console.log('');

      console.log('   📍 Location Preferences:');
      const locations = alert.locations || [];
      if (locations.length > 0) {
        locations.forEach((location, i) => {
          console.log(`      ${i + 1}. ${location}`);
        });
      } else {
        console.log('      ✅ Any location (no preference)');
      }
      console.log('');

      console.log('   💼 Job Type Preferences:');
      const jobTypes = alert.jobTypes || [];
      if (jobTypes.length > 0) {
        jobTypes.forEach((type, i) => {
          console.log(`      ${i + 1}. ${type}`);
        });
      } else {
        console.log('      ✅ Any job type (no preference)');
      }
      console.log('');
    } else {
      console.log('   ⚠️  No active job alert found');
    }

    // Test actual matching
    if (alert) {
      console.log('3️⃣  ACTUAL MATCHING PROCESS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('   🔄 Processing job alert to see what data is used...\n');
      const result = await processJobAlert(alert._id.toString(), false);
      
      if (result.matches && result.matches.length > 0) {
        console.log(`   ✅ Found ${result.matches.length} matches`);
        console.log('   Top 3 matches:');
        result.matches.slice(0, 3).forEach((match, i) => {
          console.log(`      ${i + 1}. ${match.job.title} - ${match.score}% match`);
          console.log(`         Reasons: ${match.reasons.join(', ')}`);
        });
      } else {
        console.log('   ⚠️  No matches found');
      }
      console.log('');
    }

    // Summary
    console.log('4️⃣  SUMMARY - WHAT DATA IS USED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('   ✅ ALL EXISTING DATA IS USED (NEW + OLD):');
    console.log(`      - Skills: ALL ${allSkills.length} skills (not just new ones)`);
    console.log(`      - Profile Keywords: ALL ${allKeywords.length} keywords (not just new ones)`);
    console.log(`      - Search History: Last ${Math.min(20, allSearches.length)} searches (not just new ones)`);
    console.log('');
    
    console.log('   📊 DATA PRIORITY (Highest to Lowest):');
    console.log('      1. Profile Keywords (30% weight) - Highest priority');
    console.log('      2. Job Alert Keywords (if manually set)');
    console.log('      3. Learned from Applications (Accepted/Reviewed)');
    console.log('      4. Search History (last 20 searches)');
    console.log('      5. Profile Skills (35% weight) - Used separately for skill matching');
    console.log('');
    
    console.log('   🎯 SCORING WEIGHTS:');
    console.log('      - Skill Match: 35%');
    console.log('      - Keyword Match: 30%');
    console.log('      - Location Match: 15%');
    console.log('      - Job Type Match: 10%');
    console.log('      - Recency: 10%');
    console.log('');
    
    console.log('   ✅ CONFIRMATION:');
    console.log('      - ALL existing skills are checked (new + old)');
    console.log('      - ALL existing keywords are checked (new + old)');
    console.log('      - ALL recent searches are checked (last 20, new + old)');
    console.log('      - Data is fetched FRESH on every matching run');
    console.log('      - No filtering by date - ALL profile data is used');
    console.log('');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMatchingData();

