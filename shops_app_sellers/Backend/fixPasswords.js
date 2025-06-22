
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Schema and model definition
const shopSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  logo: { type: String, default: "" },
  cover: { type: String, default: "" },
  categories: [],
  status: { type: String, enum: ["approved", "pending"], default: "pending" },
});

const User = mongoose.model("Shops", shopSchema);

// Main function to fix old passwords
async function fixPasswords() {
  try {
    const users = await User.find();
    let updatedCount = 0;

    for (const user of users) {
      const isHashed = user.password.startsWith("$2b$");

      if (!isHashed) {
        const hashed = await bcrypt.hash(user.password, saltRounds);
        user.password = hashed;
        await user.save();
        console.log(`🔐 Updated password for: ${user.email}`);
        updatedCount++;
      }
    }

    console.log(`✅ Done. ${updatedCount} password(s) updated.`);
  } catch (err) {
    console.error("❌ Error updating passwords:", err);
  } finally {
    mongoose.disconnect();
  }
}

fixPasswords();
