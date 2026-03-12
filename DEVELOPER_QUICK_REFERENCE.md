# 📋 Developer Quick Reference & Checklist

## 🚀 Getting Started (5 minutes)

### 1. Start Development Environment
```bash
# Terminal 1: Start Dev Server
npm run dev
# Output: VITE ready in ~500ms, Local: http://localhost:8081

# Terminal 2: Keep watching for changes
# Dev server auto-reloads on save
```

### 2. Open Application
```
Browser: http://localhost:8081
Open DevTools: F12 or Right-click → Inspect
Console Tab: For OTP testing and debugging
```

### 3. Test OTP System (Immediate)
```
1. Go to Auth page
2. Enter phone: 9876543210
3. Enter name: Test User
4. Click "Send OTP"
5. Open F12 Console Tab
6. Find colored OTP output with 🔐 emoji
7. Copy 6-digit code
8. Paste into OTP field
9. Click "Verify OTP"
10. Should redirect to Dashboard
```

### 4. Test Language Switching (Immediate)
```
1. On Auth page, click 🌐 (top-right)
2. Select हिंदी
3. All text changes to Hindi
4. Refresh page → Hindi persists
5. Switch back to English
6. Reload → English persists
```

---

## 🗂️ File Structure Reference

### Critical Files (Don't Delete!)

```
src/
├── services/
│   ├── otpService.ts          ← OTP generation & verification
│   ├── api.ts                 ← API client, integrates otpService
│   └── firebaseService.ts     ← Firebase integration
│
├── context/
│   ├── LanguageContext.tsx    ← Language state management
│   ├── AuthContext.tsx        ← Auth state management
│   └── ThemeContext.tsx       ← Theme state management
│
├── components/
│   ├── LanguageSwitcher.tsx   ← Language selector UI
│   ├── Layout.tsx             ← Main app layout
│   ├── Chatbot.tsx            ← Chatbot component
│   └── ui/                    ← Shadcn UI components
│
├── pages/
│   ├── Auth.tsx               ← Login page with OTP
│   ├── Dashboard.tsx          ← Main dashboard
│   ├── SignIn.tsx             ← Sign in page
│   ├── SignUp.tsx             ← Sign up page
│   └── [other pages].tsx
│
├── i18n/
│   ├── index.ts               ← i18n configuration
│   └── locales/
│       ├── en.json            ← English translations (100+ keys)
│       └── hi.json            ← Hindi translations (100+ keys)
│
├── hooks/
│   ├── use-toast.ts           ← Toast notifications
│   ├── use-mobile.tsx         ← Mobile detection
│   └── useTheme.ts            ← Theme management
│
├── lib/
│   ├── firebase.ts            ← Firebase init
│   ├── firebaseService.ts     ← Firebase methods
│   └── utils.ts               ← Utility functions
│
├── App.tsx                    ← Root component (wrapped with providers)
└── main.tsx                   ← Entry point
```

---

## 🔍 How to Find Things

### I need to...

#### Add a new translation key
1. Open `src/i18n/locales/en.json`
2. Find the appropriate section (e.g., "auth", "dashboard")
3. Add: `"newKey": "English text"`
4. Open `src/i18n/locales/hi.json`
5. Add same key with Hindi translation
6. Use in component: `const { t } = useTranslation(); t("auth.newKey")`

#### Change OTP validity time
1. Open `src/services/otpService.ts`
2. Find: `private readonly OTP_VALIDITY_MINUTES = 10;`
3. Change to desired minutes
4. OTP will auto-delete after that time

#### Modify language switcher appearance
1. Open `src/components/LanguageSwitcher.tsx`
2. Modify JSX in return statement
3. Props available: `variant`, `showLabel`, `className`
4. Three variants: `"icon"` | `"button"` | `"compact"`

#### Adjust OTP console logging
1. Open `src/services/otpService.ts`
2. Look for `console.group("%c...OTP Generated")`
3. Modify the log message or styling
4. Production: Remove all console.x() calls

#### Add a new language (e.g., Spanish)
1. Create `src/i18n/locales/es.json` (copy en.json structure)
2. Translate all keys to Spanish
3. Open `src/i18n/index.ts`
4. Add to `resources`: `es: { translation: esJSON }`
5. Add to `supportedLngs`: `["en", "hi", "es"]`
6. Update LanguageSwitcher.tsx with new language option

#### Fix a type error
1. Check error message: `[file.ts:123] error TS2345: ...`
2. Open `[file.ts]` at line 123
3. Look for red squiggly lines
4. Add proper type annotation or cast

#### Debug OTP not working
1. Open F12 Console
2. Look for error messages
3. Check if "OTP Generated" message appears (with 🔐 emoji)
4. Verify phone number is 10 digits
5. Check OTP is 6 digits before submitting
6. Look at network tab for API calls

---

## 📝 Common Tasks & Code Snippets

### Task 1: Display Current Language
```typescript
import { useLanguage } from "@/context/LanguageContext";

export function MyComponent() {
  const { language } = useLanguage();
  return <p>Current language: {language}</p>; // "en" or "hi"
}
```

### Task 2: Use Translations
```typescript
import { useTranslation } from "react-i18next";

export function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("auth.title")}</h1>; // Translates to current language
}
```

### Task 3: Send OTP (Console Shows It)
```typescript
import { api } from "@/services/api";

async function handleSendOTP(phone: string) {
  const result = await api.auth.sendOTP(phone);
  // Check F12 Console for OTP with 🔐 emoji
  if (result.success) {
    console.log("Success! Check F12 Console for OTP");
  }
}
```

### Task 4: Verify OTP
```typescript
import { api } from "@/services/api";

async function handleVerifyOTP(phone: string, otp: string) {
  const result = await api.auth.verifyOTP(phone, otp);
  if (result.success) {
    // OTP verified, user logged in
    // Token in localStorage, user data in AuthContext
  } else {
    console.error(result.message); // "OTP expired", "Invalid OTP", etc.
  }
}
```

### Task 5: Use Auth Context
```typescript
import { useAuth } from "@/context/AuthContext";

export function MyComponent() {
  const { user, token, login, logout } = useAuth();
  
  return (
    <>
      {user ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Not logged in</p>
      )}
    </>
  );
}
```

### Task 6: Add Language Switcher to Page
```typescript
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function MyPage() {
  return (
    <>
      <div className="flex justify-between">
        <h1>My Page</h1>
        <LanguageSwitcher variant="button" />
      </div>
    </>
  );
}
```

### Task 7: Show Toast Notification
```typescript
import { useToast } from "@/hooks/use-toast";

export function MyComponent() {
  const { toast } = useToast();

  return (
    <button
      onClick={() =>
        toast({
          title: "Success!",
          description: "OTP sent successfully",
        })
      }
    >
      Send OTP
    </button>
  );
}
```

---

## 🐛 Debugging Checklist

### Issue: OTP Not Showing in Console
- [ ] F12 is open and Console tab is active
- [ ] Phone number is exactly 10 digits (no spaces, no +91)
- [ ] "Send OTP" button was clicked (not just form submission)
- [ ] Check for red errors in console (scroll up if needed)
- [ ] OTP should appear with 🔐 emoji (cyan color)
- [ ] Timestamp should show creation time
- [ ] Code should be 6 digits
- [ ] Try refreshing and sending again

### Issue: Language Not Switching
- [ ] Language switcher button is visible (check all pages)
- [ ] Click works (no JS errors in console)
- [ ] F12 Console shows any errors
- [ ] localStorage has `preferredLanguage: "en"` or `"hi"`
- [ ] English: 100+ keys in `/src/i18n/locales/en.json`
- [ ] Hindi: 100+ keys in `/src/i18n/locales/hi.json`
- [ ] Both JSON files have same key structure
- [ ] No syntax errors in JSON files (use jsonlint)

### Issue: OTP Verification Failing
- [ ] Copied code is exactly 6 digits from console
- [ ] No spaces or extra characters
- [ ] OTP sent in same browser session
- [ ] OTP hasn't expired (10 minutes from generation)
- [ ] Less than 5 failed attempts
- [ ] Check console for specific error message
- [ ] Try sending new OTP and verify immediately

### Issue: Build Failing
```bash
# Step 1: Check for TypeScript errors
npm run type-check
# Fix any TS errors shown

# Step 2: Check for import errors
# Look for red squiggly lines in VS Code

# Step 3: Clean and rebuild
rm -rf node_modules/.vite
npm run build

# Step 4: Check for large bundle
npm run build -- --report
# Should be < 500KB gzipped
```

### Issue: Dev Server Crashing
```bash
# Step 1: Kill existing processes
# Windows: taskkill /F /IM node.exe
# Mac/Linux: killall node

# Step 2: Clear Vite cache
rm -rf node_modules/.vite

# Step 3: Restart
npm run dev

# Step 4: Check port 8081 is available
# Windows: netstat -an | find "8081"
# May need to use different port: npm run dev -- --port 3000
```

---

## ✅ Pre-Commit Checklist

Before pushing code, verify:

```
Code Quality:
□ No red errors in VS Code
□ No TypeScript errors: npm run type-check
□ No console warnings (F12 Console clean)
□ Code follows project style
□ Comments added for complex logic
□ Variable names are descriptive

Files Modified:
□ Only intended files changed
□ No accidental console.log() left
□ No node_modules/ files modified
□ No .env secrets committed

Testing:
□ OTP system works (test in browser)
□ Language switching works (test both languages)
□ No build errors: npm run build
□ Dev server runs: npm run dev

Documentation:
□ Updated TECHNICAL_ARCHITECTURE.md if needed
□ Added comments to complex functions
□ Tested on mobile (F12 responsive mode)
□ Tested on 2 languages

Git:
□ Commit message is descriptive
□ Commit message mentions issue/feature
□ No unrelated changes in commit
□ Can revert single commit safely
```

---

## 📞 Troubleshooting Commands

### Verify Installation
```bash
node --version          # Should be 18+
npm --version           # Should be 9+
npm list vite           # Should be 7.2.6+
npm list typescript     # Should be 5.6+
```

### Check Project Health
```bash
npm run type-check      # TypeScript compilation check
npm run lint            # Check code style
npm run build           # Test production build
npm run dev             # Run dev server
```

### Clear Cache & Reinstall
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

### Debug Specific File
```bash
# Check for syntax errors
npx tsc --noEmit src/services/otpService.ts

# Run TypeScript on single file
npx tsc --noEmit src/pages/Auth.tsx
```

### Find All Occurrences
```bash
# Find all uses of OTPService
grep -r "otpService" src/

# Find all translation keys
grep -r "t(" src/

# Find all useLanguage calls
grep -r "useLanguage" src/

# Find all console.log statements
grep -r "console\." src/ | grep -v "//"
```

---

## 🎓 Learning Resources

### Understanding OTP Flow
1. Open `src/services/otpService.ts` - Read comments
2. Check `src/pages/Auth.tsx` - See usage
3. Check `src/services/api.ts` - API integration
4. Run in browser and follow along in F12 Console

### Understanding Language System
1. Read `src/i18n/index.ts` - Configuration
2. Check `src/context/LanguageContext.tsx` - State management
3. Look at `src/components/LanguageSwitcher.tsx` - UI
4. Check translation files: `src/i18n/locales/*.json`

### Understanding Component Structure
1. App.tsx → Providers wrapper
2. Layout.tsx → Main layout template
3. Pages/* → Individual pages
4. Components/* → Reusable components

---

## 🚀 Deployment Reminders

Before deploying to production:

```
1. SECURITY
   □ Remove OTP from API response: delete response.otp
   □ Disable console.log statements
   □ Add rate limiting
   □ Enable HTTPS

2. PERFORMANCE
   □ Build bundle size < 500KB: npm run build
   □ Minify all assets
   □ Enable gzip compression
   □ Set up CDN for static files

3. TESTING
   □ Test OTP system fully
   □ Test all 2 languages
   □ Test on mobile devices
   □ Test on slow networks (throttle in F12)

4. MONITORING
   □ Set up error tracking (Sentry)
   □ Set up analytics
   □ Set up logging
   □ Set up alerts

5. DOCUMENTATION
   □ Update API documentation
   □ Update deployment guide
   □ Update troubleshooting guide
   □ Update runbook for team
```

---

## 📱 Responsive Design Testing

### Test Sizes in F12 Devtools

```
Mobile (iPhone 12):
□ Width: 390px
□ Language switcher visible (icon variant)
□ OTP form fits screen
□ All text readable

Tablet (iPad):
□ Width: 768px
□ Language switcher visible (icon variant)
□ Layout adapts well
□ Touch targets > 44px

Desktop (1920x1080):
□ Width: 1200px+
□ Language switcher visible (button variant)
□ Sidebar visible
□ Content properly centered
```

---

## 📊 Performance Benchmarks

### Expected Metrics
```
Initial Load Time:     < 3 seconds
OTP Generation:        < 1 millisecond
Language Switch:       < 100 milliseconds
Build Time:            < 15 seconds
Bundle Size (gzip):    < 200KB (with libraries < 400KB)
Lighthouse Score:      > 85 (Performance)
```

---

## 🎯 Next Steps & Roadmap

### Immediate (This Sprint)
- [ ] Test OTP with multiple phone numbers
- [ ] Test language switching thoroughly
- [ ] Document any bugs found
- [ ] Get product owner approval

### Short Term (Next Sprint)
- [ ] Integrate real SMS gateway (Twilio)
- [ ] Add email OTP support
- [ ] Add more language support
- [ ] Implement proper backend OTP validation

### Medium Term (Next Quarter)
- [ ] Add biometric auth
- [ ] Implement 2FA
- [ ] Add comprehensive logging/monitoring
- [ ] Optimize bundle size further

### Long Term (Roadmap)
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Real-time features (WebSocket)
- [ ] ML-based features

---

**Document Version**: 1.0  
**Last Updated**: March 2026  
**For Questions**: Contact Dev Team Lead  
**Status**: ✅ Ready for Development
