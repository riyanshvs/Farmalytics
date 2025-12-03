# Firebase Integration Checklist

## ✅ What's Been Done

- [x] Created `firebaseService.ts` with all database functions
- [x] Mapped all form data to Firebase Firestore structure
- [x] Updated `Location.tsx` to save location data
- [x] Updated `FarmSize.tsx` to save farm size data
- [x] Updated `CropsSelect.tsx` to save selected crops
- [x] Updated `FarmDistribution.tsx` to save distribution data
- [x] Updated `Auth.tsx` to save user profile on OTP verification
- [x] Created comprehensive documentation
- [x] Created setup guide

---

## 📋 What You Need to Do

### 1. **Enable Firestore in Firebase Console** ⚠️ REQUIRED

```
https://console.firebase.google.com/
→ Project: farmalytics-4df92
→ Firestore Database (left sidebar)
→ Create Database
→ Production Mode
→ Region: asia-south1
→ Enable
```

**Status:** [ ] Not Started [ ] In Progress [x] Document Ready

---

### 2. **Update Firestore Security Rules** ⚠️ REQUIRED

Copy and paste these rules in Firestore Database → Rules tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

Then click **Publish**

**Status:** [ ] Not Started [ ] In Progress [ ] Complete

---

### 3. **Verify Environment Variables**

Check your `.env` file has these Firebase credentials (already there):

```
✅ VITE_FIREBASE_API_KEY
✅ VITE_FIREBASE_AUTH_DOMAIN
✅ VITE_FIREBASE_PROJECT_ID
✅ VITE_FIREBASE_STORAGE_BUCKET
✅ VITE_FIREBASE_MESSAGING_SENDER_ID
✅ VITE_FIREBASE_APP_ID
```

No action needed - all set!

---

### 4. **Test the Integration**

1. Start dev server:
   ```sh
   npm run dev
   ```

2. Go through the flow:
   - Sign up with phone → Get OTP → Verify
   - Fill location details → Submit
   - Enter farm size → Submit
   - Select crops → Submit
   - Fill distribution → Submit

3. Check Firebase Console (Firestore Data tab) to see the saved data

**Status:** [ ] Not Tested [ ] Testing [ ] Verified

---

## 📊 Database Structure Created

```
Firestore Collection: users
├── {userId}                          ← Firebase Auth UID
│   ├── phone: string
│   ├── name: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   ├── location/ (sub-collection)
│   │   └── current
│   │       ├── address, city, pincode, state, country
│   │       └── savedAt: timestamp
│   │
│   ├── farm/ (sub-collection)
│   │   ├── details
│   │   │   ├── farmSize: string | number
│   │   │   └── savedAt: timestamp
│   │   │
│   │   └── distribution
│   │       ├── distributions: array<{name, area}>
│   │       ├── totalArea: number
│   │       └── savedAt: timestamp
│   │
│   └── crops/ (sub-collection)
│       └── selected
│           ├── crops: array<string>
│           └── savedAt: timestamp
```

---

## 🔧 Code Changes Made

### Files Created:
1. `src/lib/firebaseService.ts` - All database functions
2. `FIREBASE_DATABASE_MAPPING.md` - Complete mapping documentation
3. `FIREBASE_SETUP_GUIDE.md` - Setup instructions

### Files Modified:
1. `src/pages/Auth.tsx` - Saves user profile on OTP verification
2. `src/pages/Location.tsx` - Saves location to Firebase
3. `src/pages/FarmSize.tsx` - Saves farm size to Firebase
4. `src/pages/CropsSelect.tsx` - Saves selected crops to Firebase
5. `src/pages/FarmDistribution.tsx` - Saves distribution to Firebase

---

## 🚀 How to Use the Database Functions

### Import in any component:
```typescript
import { 
  saveUserProfile,
  saveLocation,
  saveFarmSize,
  saveSelectedCrops,
  saveFarmDistribution,
  getCompleteUserData
} from "@/lib/firebaseService";
import { auth } from "@/lib/firebase";

// Get current user ID
const userId = auth.currentUser?.uid;

// Save data
await saveLocation(userId, { address: "...", city: "..." });

// Get data
const userData = await getCompleteUserData(userId);
```

---

## 🐛 Debugging

### If data is NOT saving:

1. **Check browser console** (F12 → Console)
   - Look for error messages
   - Check network tab for failed requests

2. **Verify user is authenticated**
   - User must complete OTP verification
   - Check `auth.currentUser` is not null

3. **Check Firestore Rules**
   - Make sure security rules are updated
   - Rules must allow authenticated users

4. **Check Firebase Project**
   - Make sure Firestore is enabled
   - Check quota hasn't been exceeded

---

## 📚 Documentation Links

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Console](https://console.firebase.google.com/)

Detailed setup guide: `FIREBASE_SETUP_GUIDE.md`  
Database mapping guide: `FIREBASE_DATABASE_MAPPING.md`

---

## ✨ Next Steps (After Testing)

1. Create a Dashboard page to display user data
2. Add edit profile functionality
3. Implement data validation
4. Add error handling and retry logic
5. Set up automated backups
6. Monitor Firestore metrics

---

**Status Summary:**
- Backend code: ✅ Complete
- Documentation: ✅ Complete
- Firebase Console: ⏳ Awaiting your action
- Testing: ⏳ Awaiting your action

**Next Action:** Follow steps in FIREBASE_SETUP_GUIDE.md to enable Firestore
