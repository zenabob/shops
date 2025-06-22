require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Admin Schema
const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model("Admin", adminSchema, "Admins"); // استخدم اسم الكولكشن: Admins

// ✅ Main function
async function fixAdminPasswords() {
  try {
    const admins = await Admin.find();
    console.log("👤 Total admins:", admins.length);

    let updatedCount = 0;

    for (const admin of admins) {
      const password = admin.password;

      if (!password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(password, saltRounds);
        admin.password = hashed;
        await admin.save();
        console.log(`🔐 Hashed password for: ${admin.email}`);
        updatedCount++;
      }
    }

    console.log(`✅ Done. ${updatedCount} admin password(s) updated.`);
  } catch (err) {
    console.error("❌ Error updating admin passwords:", err);
  } finally {
    mongoose.disconnect();
  }
}

fixAdminPasswords();
