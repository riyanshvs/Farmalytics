# Firebase Form Data Flow Diagram

## 📱 User Journey & Data Storage

```
┌─────────────────────────────────────────────────────────────────┐
│                         START: USER SIGNUP                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   /signin        │
                    │   /signup        │
                    └──────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Phone Number    │
                    │  OTP Verification│
                    └─────────┬─────────┘
                              │
              ┌───────────────▼───────────────┐
              │ saveUserProfile(userId, {    │
              │   phone,                      │
              │   name                        │
              │ })                            │
              └───────────────┬───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  FIRESTORE         │
                    │  users/{uid}       │
                    │  ├─ phone          │
                    │  ├─ name           │
                    │  ├─ createdAt      │
                    │  └─ updatedAt      │
                    └────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /hi             │
                    │  (Welcome Page)  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /location       │
                    │  (Location Form) │
                    └──────────────────┘
                              │
          ┌───────────────────▼────────────────────┐
          │ saveLocation(userId, {                │
          │   address,                             │
          │   city,                                │
          │   pincode,                             │
          │   state,                               │
          │   country                              │
          │ })                                     │
          └───────────────────┬────────────────────┘
                              │
                    ┌─────────▼──────────────────┐
                    │  FIRESTORE                 │
                    │  users/{uid}/location/    │
                    │           current          │
                    │  ├─ address                │
                    │  ├─ city                   │
                    │  ├─ pincode                │
                    │  ├─ state                  │
                    │  ├─ country                │
                    │  └─ savedAt                │
                    └────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /farm-size      │
                    │  (Farm Size)     │
                    └──────────────────┘
                              │
                  ┌───────────▼────────────┐
                  │ saveFarmSize(userId, { │
                  │   farmSize             │
                  │ })                     │
                  └───────────┬────────────┘
                              │
                    ┌─────────▼──────────────┐
                    │  FIRESTORE             │
                    │  users/{uid}/farm/    │
                    │       details          │
                    │  ├─ farmSize           │
                    │  └─ savedAt            │
                    └────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /crops-select   │
                    │  (Select Crops)  │
                    └──────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │ saveSelectedCrops(userId, {   │
              │   crops: [                     │
              │     "Potato",                  │
              │     "Onion",                   │
              │     "Tomato"                   │
              │   ]                            │
              │ })                             │
              └───────────────┬────────────────┘
                              │
                    ┌─────────▼───────────────┐
                    │  FIRESTORE              │
                    │  users/{uid}/crops/    │
                    │      selected           │
                    │  ├─ crops: [...]        │
                    │  └─ savedAt             │
                    └─────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /farm-dist      │
                    │  (Distribution)  │
                    └──────────────────┘
                              │
              ┌───────────────▼──────────────────┐
              │ saveFarmDistribution(userId, {  │
              │   distributions: [               │
              │     {name: "Potato", area: 5},   │
              │     {name: "Onion", area: 3},    │
              │     {name: "Tomato", area: 2}    │
              │   ],                             │
              │   totalArea: 10                  │
              │ })                               │
              └───────────────┬──────────────────┘
                              │
                    ┌─────────▼──────────────┐
                    │  FIRESTORE             │
                    │  users/{uid}/farm/    │
                    │   distribution         │
                    │  ├─ distributions[]    │
                    │  ├─ totalArea          │
                    │  └─ savedAt            │
                    └────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /completion     │
                    │  (Success Page)  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  /dashboard      │
                    │  (Farm Profile)  │
                    └──────────────────┘
                              │
                  ┌───────────▼─────────────┐
                  │ getCompleteUserData()   │
                  │ Retrieves all data from │
                  │ Firestore              │
                  └───────────┬─────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Display farmer's:  │
                    │ - Profile          │
                    │ - Location         │
                    │ - Farm Details     │
                    │ - Crops            │
                    │ - Distribution     │
                    └────────────────────┘
```

---

## 🗄️ Firestore Database Structure

```
┌─────────────────────────────────────────────────┐
│         Firestore Root Collection               │
│         ┌──────────────────────────────┐        │
│         │  users/ (Collection)         │        │
│         └──────────────────────────────┘        │
│                      │                           │
│         ┌────────────▼────────────┐             │
│         │  User Document          │             │
│         │  ID: {Firebase UID}     │             │
│         ├────────────────────────┤             │
│         │ Fields:                 │             │
│         │ • phone: string         │             │
│         │ • name: string          │             │
│         │ • createdAt: timestamp  │             │
│         │ • updatedAt: timestamp  │             │
│         └────────────┬────────────┘             │
│                      │                           │
│      ┌───────────────┼───────────────┐          │
│      │               │               │          │
│      ▼               ▼               ▼          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐      │
│  │ location│  │   farm   │  │  crops   │      │
│  │  (Sub-  │  │ (Sub-    │  │ (Sub-    │      │
│  │collection) │collection)│  │collection)│      │
│  └────┬────┘  └─────┬────┘  └────┬─────┘      │
│       │             │            │             │
│       ▼             ▼            ▼             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ current │  │ details │  │ selected │       │
│  │(Document)│ │(Doc 1)  │  │(Document)│       │
│  ├────────┤  └─────────┘  ├────────┤       │
│  │address │     │         │crops:[]│       │
│  │city    │  ┌─────────┐  │savedAt │       │
│  │pincode │  │distribution         │       │
│  │state   │  │(Doc 2)  │  └─────────┘       │
│  │country │  ├─────────┤                    │
│  │savedAt │  │distributions│               │
│  └─────────┘  │totalArea│                    │
│               │savedAt  │                    │
│               └─────────┘                    │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Between Frontend & Firebase

```
┌──────────────────────────────────────────────────────┐
│                    REACT COMPONENT                    │
│                                                       │
│  const [formData, setFormData] = useState({...})     │
│                                                       │
│  const handleSubmit = async (e) => {                 │
│    e.preventDefault();                               │
│    await saveLocation(userId, formData);             │
│  }                                                    │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              firebaseService.ts                       │
│                                                       │
│  export const saveLocation = async (                 │
│    userId,                                            │
│    locationData                                       │
│  ) => {                                               │
│    const ref = doc(                                   │
│      db,                                              │
│      "users",                                         │
│      userId,                                          │
│      "location",                                      │
│      "current"                                        │
│    );                                                │
│    await setDoc(ref, {                               │
│      ...locationData,                                │
│      savedAt: Timestamp.now()                        │
│    }, { merge: true });                              │
│  }                                                    │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│            Firebase Firestore API                     │
│                                                       │
│  setDoc() → Creates/Updates document                │
│  getDoc() → Retrieves document                       │
│  getDocs() → Retrieves multiple docs                │
│  updateDoc() → Updates specific fields              │
│  deleteDoc() → Deletes document                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│           FIREBASE SERVERS (Cloud)                    │
│                                                       │
│  POST /projects/farmalytics-4df92/databases/...     │
│                                                       │
│  Request:                                             │
│  {                                                    │
│    "fields": {                                        │
│      "address": {"stringValue": "..."},             │
│      "city": {"stringValue": "..."},                │
│      "savedAt": {"timestampValue": "..."}           │
│    }                                                  │
│  }                                                    │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│         FIRESTORE DATABASE (Stored Data)             │
│                                                       │
│  /users/{uid}/location/current                       │
│  {                                                    │
│    address: "123 Farm Lane",                         │
│    city: "Jaipur",                                    │
│    pincode: "302001",                                │
│    state: "Rajasthan",                               │
│    country: "India",                                 │
│    savedAt: 2024-12-04T10:30:00Z                    │
│  }                                                    │
│                                                       │
│  ✅ Data Persisted & Secured!                        │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
┌────────────────────────────────────────────┐
│  User Signs in with Phone OTP             │
│  Firebase Auth issues JWT token           │
│  auth.currentUser.uid = unique identifier │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  Submit Form Data                          │
│  saveLocation(auth.currentUser.uid, data) │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  Firebase Firestore Rules Check:          │
│                                            │
│  if (request.auth.uid == userId) {        │
│    allow read, write;                     │
│  }                                         │
│                                            │
│  request.auth.uid = JWT token's user ID   │
│  userId = document owner's ID              │
└────────────────┬───────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
     ✅ ALLOW          ❌ DENY
   (Same user)    (Different user/
    (Save data)    no auth)
```

---

## 📊 Data Summary by Form

| Form | Saves To | Fields |
|------|----------|--------|
| **Auth** | `users/{uid}` | phone, name, createdAt, updatedAt |
| **Location** | `users/{uid}/location/current` | address, city, pincode, state, country, savedAt |
| **Farm Size** | `users/{uid}/farm/details` | farmSize, savedAt |
| **Crops** | `users/{uid}/crops/selected` | crops[], savedAt |
| **Distribution** | `users/{uid}/farm/distribution` | distributions[], totalArea, savedAt |

---

## 🎯 Query Examples

### Get User Profile
```
db.collection("users").doc(userId).get()
→ { phone, name, createdAt, updatedAt }
```

### Get User Location
```
db.collection("users")
  .doc(userId)
  .collection("location")
  .doc("current")
  .get()
→ { address, city, pincode, state, country, savedAt }
```

### Get All User Data
```
getCompleteUserData(userId)
→ {
  profile: { phone, name, ... },
  location: { address, city, ... },
  farmSize: { farmSize, ... },
  crops: { crops: [...], ... },
  distribution: { distributions: [...], totalArea, ... }
}
```

---

## 🚀 Performance Notes

- ✅ Firestore optimized for real-time data
- ✅ Auto-indexing for common queries
- ✅ Sub-collections for scalable data organization
- ✅ Timestamps for audit trails
- ✅ User-based access control built-in

---

*This diagram shows the complete flow from user signup to data persistence in Firebase Firestore.*
