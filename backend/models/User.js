const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['applicant', 'recruiter'], required: true },
  profileKeywords: {
    type: [String],
    default: [],
    set: (keywords = []) =>
      keywords
        .map(keyword => keyword?.toString().trim())
        .filter(Boolean)
  },
  searchHistory: [{
    term: { type: String, trim: true },
    searchedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);