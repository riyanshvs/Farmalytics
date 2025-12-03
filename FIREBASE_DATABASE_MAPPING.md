# Firebase Database Structure - Form Data Mapping

## Overview
All user form data is stored in Firebase Firestore under the user's unique ID (Firebase Auth UID).

---

## Database Hierarchy

```
Firestore Root
├── users/ (Collection)
│   └── {userId}/ (Document - User's Firebase Auth UID)
│       ├── phone: string
│       ├── name: string
│       ├── language: string
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       │
│       ├── location/ (Sub-collection)
│       │   └── current/ (Document)
│       │       ├── address: string
│       │       ├── city: string
│       │       ├── pincode: string
│       │       ├── state: string
│       │       ├── country: string
│       │       └── savedAt: timestamp
│       │
│       ├── farm/ (Sub-collection)
│       │   ├── details/ (Document)
│       │   │   ├── farmSize: string | number
│       │   │   └── savedAt: timestamp
│       │   │
│       │   └── distribution/ (Document)
│       │       ├── distributions: array<{ name: string, area: number }>
│       │       ├── totalArea: number
│       │       └── savedAt: timestamp
│       │
│       └── crops/ (Sub-collection)
│           └── selected/ (Document)
│               ├── crops: array<string>
│               └── savedAt: timestamp
```

---

## Form Data Mapping

### 1. **Authentication Form** (Auth.tsx)
- **Route:** `/signin`, `/signup`
- **Form Fields:**
  - Phone Number
  - Name (signup only)
  - OTP Verification

**Storage Location:**
- Document: `users/{userId}`
- Fields:
  - `phone`: User's phone number
  - `name`: User's full name
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp

**Function to Use:**
```typescript
import { saveUserProfile } from "@/lib/firebaseService";

await saveUserProfile(userId, {
  phone: phoneNumber,
  name: userName,
  createdAt: timestamp
});
```

---

### 2. **Sign Up Form** (SignUp.tsx)
- **Route:** `/signup`
- **Form Fields:**
  - Name
  - Phone Number
  - Language
  - Password
  - Confirm Password

**Storage Location:**
- Document: `users/{userId}`
- Fields:
  - `name`: User's full name
  - `phone`: User's phone number
  - `language`: Preferred language
  - `updatedAt`: Timestamp

**Function to Use:**
```typescript
import { saveUserProfile } from "@/lib/firebaseService";

await saveUserProfile(userId, {
  phone: formData.phone,
  name: formData.name,
  language: formData.language
});
```

---

### 3. **Location Form** (Location.tsx)
- **Route:** `/location`
- **Form Fields:**
  - Address
  - City
  - Pincode
  - State
  - Country

**Storage Location:**
- Sub-collection: `users/{userId}/location/current`
- Fields:
  - `address`: Street address
  - `city`: City name
  - `pincode`: Postal code
  - `state`: State name
  - `country`: Country name
  - `savedAt`: Timestamp

**Function to Use:**
```typescript
import { saveLocation } from "@/lib/firebaseService";

await saveLocation(userId, {
  address: formData.address,
  city: formData.city,
  pincode: formData.pincode,
  state: formData.state,
  country: formData.country
});
```

---

### 4. **Farm Size Form** (FarmSize.tsx)
- **Route:** `/farm-size`
- **Form Fields:**
  - Farm Size (text/number)

**Storage Location:**
- Sub-collection: `users/{userId}/farm/details`
- Fields:
  - `farmSize`: Total farm size (string or number)
  - `savedAt`: Timestamp

**Function to Use:**
```typescript
import { saveFarmSize } from "@/lib/firebaseService";

await saveFarmSize(userId, {
  farmSize: farmSizeInput
});
```

---

### 5. **Crops Selection Form** (CropsSelect.tsx)
- **Route:** `/crops-select`
- **Form Fields:**
  - Selected Crops (array of crop names)

**Storage Location:**
- Sub-collection: `users/{userId}/crops/selected`
- Fields:
  - `crops`: Array of selected crop names
  - `savedAt`: Timestamp

**Function to Use:**
```typescript
import { saveSelectedCrops } from "@/lib/firebaseService";

await saveSelectedCrops(userId, {
  crops: selectedCropsArray
});
```

---

### 6. **Farm Distribution Form** (FarmDistribution.tsx)
- **Route:** `/farm-distribution`
- **Form Fields:**
  - Per-crop area distribution

**Storage Location:**
- Sub-collection: `users/{userId}/farm/distribution`
- Fields:
  - `distributions`: Array of objects `[{ name: "Potato", area: 50 }, ...]`
  - `totalArea`: Sum of all areas
  - `savedAt`: Timestamp

**Function to Use:**
```typescript
import { saveFarmDistribution } from "@/lib/firebaseService";

const distributions = crops.map((crop, index) => ({
  name: crop.name,
  area: Number(distributionValues[index])
}));

const totalArea = distributions.reduce((sum, d) => sum + d.area, 0);

await saveFarmDistribution(userId, {
  distributions,
  totalArea
});
```

---

## Usage Examples

### Save All User Data After Completion
```typescript
import { 
  saveUserProfile, 
  saveLocation, 
  saveFarmSize, 
  saveSelectedCrops, 
  saveFarmDistribution 
} from "@/lib/firebaseService";

const userId = auth.currentUser?.uid;

// Step 1: Save user profile
await saveUserProfile(userId, {
  phone: "9876543210",
  name: "Farmer Name",
  language: "Hindi"
});

// Step 2: Save location
await saveLocation(userId, {
  address: "Village Name",
  city: "City",
  pincode: "123456",
  state: "State",
  country: "India"
});

// Step 3: Save farm size
await saveFarmSize(userId, {
  farmSize: "10 acres"
});

// Step 4: Save selected crops
await saveSelectedCrops(userId, {
  crops: ["Potato", "Onion", "Tomato"]
});

// Step 5: Save farm distribution
await saveFarmDistribution(userId, {
  distributions: [
    { name: "Potato", area: 5 },
    { name: "Onion", area: 3 },
    { name: "Tomato", area: 2 }
  ],
  totalArea: 10
});
```

### Retrieve User Data
```typescript
import { getCompleteUserData } from "@/lib/firebaseService";

const userId = auth.currentUser?.uid;
const userData = await getCompleteUserData(userId);

console.log(userData.profile);      // User profile data
console.log(userData.location);     // Location data
console.log(userData.farmSize);     // Farm size
console.log(userData.crops);        // Selected crops
console.log(userData.distribution); // Farm distribution
```

### Update Specific Data
```typescript
import { updateDoc } from "firebase/firestore";

const userId = auth.currentUser?.uid;
const locationRef = doc(db, "users", userId, "location", "current");

await updateDoc(locationRef, {
  city: "New City",
  updatedAt: Timestamp.now()
});
```

---

## Firebase Firestore Rules (Security)

Recommended Firestore security rules for development:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

---

## Checklist for Integration

- [ ] Firebase Firestore is enabled in Firebase Console
- [ ] Security rules are configured
- [ ] `firebaseService.ts` is imported in form pages
- [ ] Each form page calls appropriate save function on submission
- [ ] User ID (`auth.currentUser?.uid`) is available before saving
- [ ] Timestamps are automatically added by `firebaseService.ts`
- [ ] Test data retrieval with `getCompleteUserData()`
- [ ] Monitor Firestore in Firebase Console under "Data" tab

---

## Testing in Firebase Console

1. Go to Firebase Console → Project → Firestore Database
2. Look for collection: `users`
3. Click on a user document to see their stored data
4. Expand sub-collections (location, farm, crops) to see nested data

---
