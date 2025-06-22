require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Buyer Schema
const buyerSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  location: String,
  PhoneNumber: Number,
  age: Number,
  Gender: String,
  cart: Array,
  favorites: Array,
  viewedProducts: Array,
});

const Buyer = mongoose.model("Client", buyerSchema);

// ✅ Main function
async function fixPasswords() {
  try {
    const users = await Buyer.find();
    console.log("👥 Total buyers:", users.length);
    let updatedCount = 0;

    for (const user of users) {
      const password = user.password;

      if (!password || !password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(password || "Default123!", saltRounds);
        user.password = hashed;
        await user.save();
        console.log(`🔐 Updated: ${user.email}`);
        updatedCount++;
      }
    }

    console.log(`✅ Done. ${updatedCount} buyer password(s) updated.`);
  } catch (err) {
    console.error("❌ Error updating passwords:", err);
  } finally {
    mongoose.disconnect();
  }
}

fixPasswords();
