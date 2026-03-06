import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  Timestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";

if (!db) {
  console.warn("Firebase not initialized - using demo mode");
}

/**
 * FIREBASE DATABASE STRUCTURE - USER FORM DATA MAPPING
 * 
 * Collection: "users"
 * Document ID: User's Firebase Auth UID
 * 
 * Fields:
 * - phone (string): User's phone number
 * - name (string): User's full name
 * - language (string): Preferred language
 * - createdAt (timestamp): Account creation time
 * - updatedAt (timestamp): Last update time
 * 
 * Sub-collection: "location" -> Document: "current"
 * - address (string): Street address
 * - city (string): City name
 * - pincode (string): Postal code
 * - state (string): State name
 * - country (string): Country name
 * - savedAt (timestamp): When location was saved
 * 
 * Sub-collection: "farm" -> Document: "details"
 * - farmSize (string/number): Total farm size
 * - savedAt (timestamp): When farm details were saved
 * 
 * Sub-collection: "crops" -> Document: "selected"
 * - crops (array): List of selected crop names
 * - savedAt (timestamp): When crops were selected
 * 
 * Sub-collection: "farm" -> Document: "distribution"
 * - distributions (array): Array of {name, area} objects
 * - totalArea (number): Total cultivated area
 * - savedAt (timestamp): When distribution was saved
 */

interface UserData {
  phone: string;
  name: string;
  language?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface LocationData {
  address: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  savedAt?: Timestamp;
}

interface FarmSizeData {
  farmSize: string | number;
  savedAt?: Timestamp;
}

interface CropData {
  name: string;
  area?: number;
}

interface FarmDistributionData {
  distributions: CropData[];
  totalArea?: number;
  savedAt?: Timestamp;
}

interface SelectedCropsData {
  crops: string[];
  savedAt?: Timestamp;
}

// ============ USER PROFILE FUNCTIONS ============

export const saveUserProfile = async (userId: string, userData: UserData) => {
  if (!db) {
    console.log("Demo mode - skipping save to Firebase");
    return { success: true };
  }
  try {
    const userRef = doc(db, "users", userId);
    const dataToSave = {
      ...userData,
      updatedAt: Timestamp.now(),
      createdAt: userData.createdAt || Timestamp.now(),
    };
    await setDoc(userRef, dataToSave, { merge: true });
    console.log("User profile saved:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  if (!db) {
    return null;
  }
  try {
    const userRef = doc(db, "users", userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// ============ LOCATION FUNCTIONS ============

export const saveLocation = async (userId: string, locationData: LocationData) => {
  if (!db) {
    console.log("Demo mode - skipping save to Firebase");
    return { success: true };
  }
  try {
    const locationRef = doc(db, "users", userId, "location", "current");
    const dataToSave = {
      ...locationData,
      savedAt: Timestamp.now(),
    };
    await setDoc(locationRef, dataToSave, { merge: true });
    console.log("Location saved for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error saving location:", error);
    throw error;
  }
};

export const getLocation = async (userId: string) => {
  if (!db) {
    return null;
  }
  try {
    const locationRef = doc(db, "users", userId, "location", "current");
    const snapshot = await getDoc(locationRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
};

// ============ FARM SIZE FUNCTIONS ============

export const saveFarmSize = async (userId: string, farmSizeData: FarmSizeData) => {
  if (!db) {
    console.log("Demo mode - skipping save to Firebase");
    return { success: true };
  }
  try {
    const farmRef = doc(db, "users", userId, "farm", "details");
    const dataToSave = {
      ...farmSizeData,
      savedAt: Timestamp.now(),
    };
    await setDoc(farmRef, dataToSave, { merge: true });
    console.log("Farm size saved for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error saving farm size:", error);
    throw error;
  }
};

export const getFarmSize = async (userId: string) => {
  if (!db) {
    return null;
  }
  try {
    const farmRef = doc(db, "users", userId, "farm", "details");
    const snapshot = await getDoc(farmRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching farm size:", error);
    throw error;
  }
};

// ============ CROPS SELECTION FUNCTIONS ============

export const saveSelectedCrops = async (userId: string, cropsData: SelectedCropsData) => {
  if (!db) {
    console.log("Demo mode - skipping save to Firebase");
    return { success: true };
  }
  try {
    const cropsRef = doc(db, "users", userId, "crops", "selected");
    const dataToSave = {
      ...cropsData,
      savedAt: Timestamp.now(),
    };
    await setDoc(cropsRef, dataToSave, { merge: true });
    console.log("Selected crops saved for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error saving selected crops:", error);
    throw error;
  }
};

export const getSelectedCrops = async (userId: string) => {
  if (!db) {
    return null;
  }
  try {
    const cropsRef = doc(db, "users", userId, "crops", "selected");
    const snapshot = await getDoc(cropsRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching selected crops:", error);
    throw error;
  }
};

// ============ FARM DISTRIBUTION FUNCTIONS ============

export const saveFarmDistribution = async (userId: string, distributionData: FarmDistributionData) => {
  if (!db) {
    console.log("Demo mode - skipping save to Firebase");
    return { success: true };
  }
  try {
    const distributionRef = doc(db, "users", userId, "farm", "distribution");
    const dataToSave = {
      ...distributionData,
      savedAt: Timestamp.now(),
    };
    await setDoc(distributionRef, dataToSave, { merge: true });
    console.log("Farm distribution saved for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error saving farm distribution:", error);
    throw error;
  }
};

export const getFarmDistribution = async (userId: string) => {
  if (!db) {
    return null;
  }
  try {
    const distributionRef = doc(db, "users", userId, "farm", "distribution");
    const snapshot = await getDoc(distributionRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching farm distribution:", error);
    throw error;
  }
};

// ============ GET COMPLETE USER DATA ============

export const getCompleteUserData = async (userId: string) => {
  if (!db) {
    return null;
  }
  try {
    const profile = await getUserProfile(userId);
    const location = await getLocation(userId);
    const farmSize = await getFarmSize(userId);
    const crops = await getSelectedCrops(userId);
    const distribution = await getFarmDistribution(userId);

    return {
      profile,
      location,
      farmSize,
      crops,
      distribution,
    };
  } catch (error) {
    console.error("Error fetching complete user data:", error);
    throw error;
  }
};

// ============ SEARCH FUNCTIONS ============

export const searchUserByPhone = async (phone: string) => {
  if (!db) {
    return null;
  }
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("phone", "==", phone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error("Error searching user by phone:", error);
    throw error;
  }
};
