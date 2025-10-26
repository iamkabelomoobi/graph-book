import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import Contact from "../models/Contact.js";

const NUM_CONTACTS = 50;

const seedContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB");

    await Contact.deleteMany({});
    console.log("🧹 Cleared old contacts");

    const contacts = Array.from({ length: NUM_CONTACTS }).map(() => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    }));

    await Contact.insertMany(contacts);

    console.log(`🎉 Successfully inserted ${NUM_CONTACTS} contacts!`);
  } catch (error) {
    console.error("❌ Error seeding contacts:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedContacts();
