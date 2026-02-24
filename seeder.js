const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// Load env vars
dotenv.config();

// Load models
const Call = require('./models/Call');
const Callback = require('./models/Callback');
const Lead = require('./models/Lead');
const LoanPlan = require('./models/LoanPlan');

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Read JSON files
const calls = JSON.parse(fs.readFileSync(`${__dirname}/loan-ai-crm.calls.json`, 'utf-8'));
const callbacks = JSON.parse(fs.readFileSync(`${__dirname}/loan-ai-crm.callbacks.json`, 'utf-8'));
const leads = JSON.parse(fs.readFileSync(`${__dirname}/loan-ai-crm.leads.json`, 'utf-8'));
const loanPlans = JSON.parse(fs.readFileSync(`${__dirname}/loan-ai-crm.loanplans.json`, 'utf-8'));

const formatData = (data) => {
  return data.map(item => {
    const formattedItem = { ...item };
    
    // Function to recursively find and format MongoDB export objects
    const formatValue = (obj) => {
      if (!obj) return obj;
      if (typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(formatValue);
      }
      
      // Handle ObjectId
      if (obj.$oid) {
        return obj.$oid;
      }
      
      // Handle Date
      if (obj.$date) {
        return new Date(obj.$date);
      }
      
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = formatValue(value);
      }
      return newObj;
    };
    
    return formatValue(formattedItem);
  });
};

const importData = async () => {
  try {
    console.log('Clearing existing data...');
    // Clear existing data (optional, but good for a fresh seed)
    await Call.deleteMany();
    await Callback.deleteMany();
    await Lead.deleteMany();
    await LoanPlan.deleteMany();

    console.log('Importing data...');
    await Call.insertMany(formatData(calls));
    await Callback.insertMany(formatData(callbacks));
    await Lead.insertMany(formatData(leads));
    await LoanPlan.insertMany(formatData(loanPlans));
    
    console.log('Data Imported successfully!');
    process.exit();
  } catch (err) {
    console.error(`Error importing data: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  // If we want to add a destroy flag later
} else {
  importData();
}
