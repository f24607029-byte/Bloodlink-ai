import { MongoClient, Db } from "mongodb";
import { CONFIG } from "../config/config";
import {
  preseededUsers,
  preseededDonors,
  preseededHospitals,
  preseededCamps,
  preseededEmergencies,
  preseededHistory,
  preseededNotifications
} from "../data/seedData";

// Native in-memory variables representing local fallback
let memoryUsers = [...preseededUsers];
let memoryDonors = [...preseededDonors];
let memoryHospitals = [...preseededHospitals];
let memoryCamps = [...preseededCamps];
let memoryEmergencies: any[] = [...preseededEmergencies];
let memoryHistory = [...preseededHistory];
let memoryNotifications = [...preseededNotifications];
let memoryChats: any[] = [];

// Mongo helpers
let mongoClient: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// Attempt database connection lazy-loaded on request or on startup
export async function getDb(): Promise<{ mode: "mongodb" | "fallback"; db: Db | null }> {
  if (!CONFIG.MONGO_URI) {
    return { mode: "fallback", db: null };
  }

  if (isConnected && db) {
    return { mode: "mongodb", db };
  }

  try {
    mongoClient = new MongoClient(CONFIG.MONGO_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    db = mongoClient.db("bloodlink_ai");
    isConnected = true;
    console.log("Successfully connected to MongoDB Atlas database.");

    // Seed empty collections
    await seedMongoDbIfEmpty(db);

    return { mode: "mongodb", db };
  } catch (err) {
    console.error("MongoDB connection failed, falling back to local memory store:", err);
    isConnected = false;
    db = null;
    return { mode: "fallback", db: null };
  }
}

async function seedMongoDbIfEmpty(database: Db) {
  try {
    const list = await database.listCollections().toArray();
    const names = list.map(c => c.name);

    if (!names.includes("users") || (await database.collection("users").countDocuments()) === 0) {
      await database.collection("users").insertMany(preseededUsers);
      console.log("Seeded users collection in MongoDB");
    }

    if (!names.includes("donors") || (await database.collection("donors").countDocuments()) === 0) {
      await database.collection("donors").insertMany(preseededDonors);
      console.log("Seeded donors collection in MongoDB");
    }

    if (!names.includes("hospitals") || (await database.collection("hospitals").countDocuments()) === 0) {
      await database.collection("hospitals").insertMany(preseededHospitals);
      console.log("Seeded hospitals collection in MongoDB");
    }

    if (!names.includes("camps") || (await database.collection("camps").countDocuments()) === 0) {
      await database.collection("camps").insertMany(preseededCamps);
      console.log("Seeded camps collection in MongoDB");
    }

    if (!names.includes("emergencies") || (await database.collection("emergencies").countDocuments()) === 0) {
      if (preseededEmergencies.length > 0) {
        await database.collection("emergencies").insertMany(preseededEmergencies);
        console.log("Seeded emergencies collection in MongoDB");
      }
    }

    if (!names.includes("history") || (await database.collection("history").countDocuments()) === 0) {
      await database.collection("history").insertMany(preseededHistory);
      console.log("Seeded history collection in MongoDB");
    }

    if (!names.includes("notifications") || (await database.collection("notifications").countDocuments()) === 0) {
      await database.collection("notifications").insertMany(preseededNotifications);
      console.log("Seeded notifications collection in MongoDB");
    }
  } catch (error) {
    console.error("Failed to seed MongoDB:", error);
  }
}

// Global accessor CRUD APIs spanning both Mongo and Local Fallback store

export async function getUsers(): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    return await db.collection("users").find({}).toArray();
  }
  return memoryUsers;
}

export async function addUser(user: any): Promise<void> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    await db.collection("users").insertOne(user);
    return;
  }
  memoryUsers.push(user);
}

export async function getDonors(): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    return await db.collection("donors").find({}).toArray();
  }
  return memoryDonors;
}

export async function addDonor(donor: any): Promise<void> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    await db.collection("donors").insertOne(donor);
    return;
  }
  memoryDonors.push(donor);
}

export async function updateDonorAvailability(phone: string, isAvailable: boolean): Promise<any> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    const result = await db.collection("donors").findOneAndUpdate(
      { phone },
      { $set: { isAvailable } },
      { returnDocument: "after" }
    );
    // Handle older driver compatibility where result could be wrapped or containing .value
    return result && (result as any).value ? (result as any).value : result;
  }
  const idx = memoryDonors.findIndex(d => d.phone === phone);
  if (idx !== -1) {
    memoryDonors[idx].isAvailable = isAvailable;
    return memoryDonors[idx];
  }
  return null;
}

export async function addDonorReview(donorId: string, review: any): Promise<any> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    const result = await db.collection("donors").findOneAndUpdate(
      { id: donorId },
      { $push: { reviews: { $each: [review], $position: 0 } } as any },
      { returnDocument: "after" }
    );
    return result && (result as any).value ? (result as any).value : result;
  }
  const idx = memoryDonors.findIndex(d => d.id === donorId);
  if (idx !== -1) {
    if (!memoryDonors[idx].reviews) memoryDonors[idx].reviews = [];
    memoryDonors[idx].reviews.unshift(review);
    return memoryDonors[idx];
  }
  return null;
}

export async function getHospitals(): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    return await db.collection("hospitals").find({}).toArray();
  }
  return memoryHospitals;
}

export async function getCamps(): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    return await db.collection("camps").find({}).toArray();
  }
  return memoryCamps;
}

export async function incrementCampRegistration(campId: string): Promise<any> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    const result = await db.collection("camps").findOneAndUpdate(
      { id: campId },
      { $inc: { registeredCount: 1 } },
      { returnDocument: "after" }
    );
    return result && (result as any).value ? (result as any).value : result;
  }
  const idx = memoryCamps.findIndex(c => c.id === campId);
  if (idx !== -1) {
    memoryCamps[idx].registeredCount += 1;
    return memoryCamps[idx];
  }
  return null;
}

export async function getEmergencies(): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    return await db.collection("emergencies").find({}).sort({ createdAt: -1 }).toArray();
  }
  return memoryEmergencies;
}

export async function addEmergency(sos: any): Promise<void> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    await db.collection("emergencies").insertOne(sos);
    return;
  }
  memoryEmergencies.unshift(sos);
}

export async function updateEmergencyStatus(sosId: string, status: "Pending" | "Fulfilled" | "Cancelled"): Promise<any> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    const result = await db.collection("emergencies").findOneAndUpdate(
      { id: sosId },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result && (result as any).value ? (result as any).value : result;
  }
  const idx = memoryEmergencies.findIndex(e => e.id === sosId);
  if (idx !== -1) {
    memoryEmergencies[idx].status = status;
    return memoryEmergencies[idx];
  }
  return null;
}

export async function getNotifications(): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    return await db.collection("notifications").find({}).sort({ timestamp: -1 }).toArray();
  }
  return memoryNotifications;
}

export async function addNotification(notification: any): Promise<void> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    await db.collection("notifications").insertOne(notification);
    return;
  }
  memoryNotifications.unshift(notification);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    await db.collection("notifications").updateMany({}, { $set: { read: true } });
    return;
  }
  memoryNotifications = memoryNotifications.map(n => ({ ...n, read: true }));
}

export async function getChatSessionHistory(sid: string): Promise<any[]> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    const records = await db.collection("chats").find({ sessionId: sid }).toArray();
    return records.map(r => r.message);
  }
  return memoryChats.filter(c => c.sessionId === sid).map(r => r.message);
}

export async function addChatMessage(sid: string, message: any): Promise<void> {
  const { mode, db } = await getDb();
  if (mode === "mongodb" && db) {
    await db.collection("chats").insertOne({ sessionId: sid, message, timestamp: new Date() });
    return;
  }
  memoryChats.push({ sessionId: sid, message, timestamp: new Date() });
}
