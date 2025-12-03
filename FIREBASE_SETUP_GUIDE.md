# Firebase Firestore Setup Guide

## Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **farmalytics-4df92**
3. In the left sidebar, click on **Firestore Database** (under Build)
4. Click **Create Database**
5. Choose **Start in production mode** (we'll update rules next)
6. Select region: **asia-south1** (India - recommended for faster access)
7. Click **Enable**

---

## Step 2: Set Up Firestore Security Rules

After Firestore is created:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Allow all sub-collections to be accessed by the owner
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

3. Click **Publish**

---

## Step 3: Verify Environment Variables

Make sure your `.env` file has all Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIzaSyAMKyXapG3LxjX0z1c6sXRruSlFmexxpvA
VITE_FIREBASE_AUTH_DOMAIN=farmalytics-4df92.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=farmalytics-4df92
VITE_FIREBASE_STORAGE_BUCKET=farmalytics-4df92.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=274186538596
VITE_FIREBASE_APP_ID=1:274186538596:web:60caf0f070b251b1539971
```

---

## Step 4: Test the Database Integration

1. Start your development server:
   ```sh
   npm run dev
   ```

2. Go through the signup/form flow:
   - Sign up with phone number
   - Fill in location details
   - Enter farm size
   - Select crops
   - Fill farm distribution

3. Open Firebase Console → **Firestore Database** → **Data** tab

4. You should see a new collection called `users` with documents containing:
   - User phone number and name
   - Sub-collections: `location`, `farm`, `crops`

---

## Step 5: Monitor Data in Firebase Console

### View User Data
1. Go to Firestore Database → Data tab
2. Look for collection: `users`
3. Click on any user document to see:
   - `phone`, `name`, `createdAt`, `updatedAt`

### View Location Data
1. Click on the user document
2. Expand `location` sub-collection
3. Click `current` document to see:
   - `address`, `city`, `pincode`, `state`, `country`, `savedAt`

### View Farm Data
1. Click on the user document
2. Expand `farm` sub-collection
3. Click `details` to see farm size
4. Click `distribution` to see crop distribution

### View Crops Data
1. Click on the user document
2. Expand `crops` sub-collection
3. Click `selected` to see selected crops array

---

## Step 6: Check for Errors

If data is NOT appearing in Firestore:

### Check Browser Console
1. Open browser → Press **F12** → Go to **Console** tab
2. Look for any error messages
3. Common errors:
   - "Firebase Auth is not configured" → Add `VITE_FIREBASE_API_KEY` to `.env`
   - "Permission denied" → Update Firestore security rules
   - "User not authenticated" → User must be signed in

### Check Network Tab
1. Open browser → Press **F12** → Go to **Network** tab
2. Look for requests to `firestore.googleapis.com`
3. Check if requests are successful (Status 200)

### Check Firebase Cloud Logging
1. Go to Firebase Console → **Firestore Database** → **Monitoring**
2. Look at "Reads", "Writes", "Deletes" metrics
3. Check for any errors in real-time

---

## Step 7: Backup & Export Data (Optional)

### Export Data
1. Go to Firestore Database → **Settings** (⚙️ icon)
2. Click **Export Collections**
3. Choose storage location and collections to export

### Import Data
1. Go to Firestore Database → **Settings**
2. Click **Import Collections**
3. Select the backup file to restore

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Quota exceeded" | Check Firestore pricing plan |
| "User not authenticated" | Make sure user is signed in via phone OTP |
| "Permission denied" | Update Firestore security rules |
| "Data not saving" | Check browser console for errors |
| "Slow performance" | Ensure Firestore is in the same region as your app |

---

## Firebase Pricing (Free Tier)

- **Reads**: 50,000 per day
- **Writes**: 20,000 per day
- **Deletes**: 20,000 per day
- **Storage**: 1 GB total

For production, consider upgrading to **Blaze Plan** (pay-as-you-go).

---

## Next Steps

Once Firestore is working:

1. ✅ Test the form submission flow
2. ✅ Verify all data appears in Firestore
3. ✅ Create a dashboard to display user data
4. ✅ Add data validation and error handling
5. ✅ Set up automated backups

---

## Need Help?

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Firebase Console](https://console.firebase.google.com/)
