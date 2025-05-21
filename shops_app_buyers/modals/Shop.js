const mongoose = require("mongoose");

// سجل موديل وهمي فقط ليربط مع الموجود
const dummySchema = new mongoose.Schema({}, { strict: false });

module.exports =
  mongoose.models.Shops || mongoose.model("Shops", dummySchema);
