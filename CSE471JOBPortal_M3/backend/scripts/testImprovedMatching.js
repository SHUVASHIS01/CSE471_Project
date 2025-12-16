/**
 * Test the improved matching for the user account
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { processJobAlert } = require('../services/smartJobAlertService');
const JobAlert = require('../models/JobAlert');

async function testImprovedMatching() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const alert = await JobAlert.findOne({ name: 'My Job Matches - Auto Created' });
    
    if (!alert) {
      console.log('❌ Job alert not found');
      process.exit(1);
    }

    console.log('🧪 Testing Improved Matching for Your Account...\n');
    console.log(`Alert: ${alert.name}`);
    console.log(`Keywords: ${(alert.keywords || []).join(', ') || 'Auto (from profile)'}\n`);

    const result = await processJobAlert(alert._id.toString(), false);

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      process.exit(1);
    }

    console.log('📊 Results:');
    console.log(`   Matches Found: ${result.matches.length}\n`);

    if (result.matches.length > 0) {
      console.log('   Top 5 Matches:');
      result.matches.slice(0, 5).forEach((m, i) => {
        console.log(`\n   ${i + 1}. ${m.job.title}`);
        console.log(`      Company: ${m.job.company}`);
        console.log(`      Location: ${m.job.location}`);
        console.log(`      Match Score: ${m.score}%`);
        console.log(`      Skills: ${(m.job.skills || []).join(', ') || 'N/A'}`);
        console.log(`      Reasons: ${m.reasons.join(', ')}`);
      });
    } else {
      console.log('   ⚠️  No matches found');
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testImprovedMatching();

