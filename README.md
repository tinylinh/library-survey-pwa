# library-survey-pwa
# 📚 Offline-first Library Survey PWA

A mobile-first Progressive Web App (PWA) for conducting surveys and inspections to evaluate the **new campus library**.

The application is designed with an **Offline-first architecture**, allowing interviewers to collect survey data even when there is **zero network connectivity**. Data is stored locally using **IndexedDB** and automatically synchronized with **Google Sheets** and photos are uploaded to **Google Drive** when the network connection is restored.

---

## 🎯 Project Goal

The goal of this project is to build an **Offline-first inspection/survey form for campus facilities**.

The application focuses on:

> **Đánh giá thư viện mới – New Library Evaluation**

The system allows an interviewer to:

* Collect respondent information.
* Record the interviewer's name.
* Automatically record interview time.
* Capture GPS location.
* Take or select a photo of the library facility.
* Answer library evaluation questions.
* Save survey data while offline.
* Automatically synchronize pending data when the network returns.
* Store structured data in Google Sheets.
* Store survey photos in Google Drive.
* View interview history and synchronization status.
* Install the website as a PWA on mobile devices.

---

# ✨ Main Features

## 1. 📱 Mobile-first UI

The application is designed primarily for mobile devices.

Features include:

* Responsive layout.
* Touch-friendly buttons.
* Mobile-friendly survey forms.
* Card-based interface.
* Simple navigation.
* Responsive design for desktop and mobile.

---

## 2. 🌐 Offline-first

The application continues working even when there is no Internet connection.

When offline:

```text
User fills survey
       ↓
Survey data
       ↓
IndexedDB
       ↓
syncStatus = "pending"
       ↓
Data remains on device
```

The interviewer can continue collecting multiple survey records without a network connection.

---

## 3. 💾 IndexedDB

**IndexedDB** is used to store structured survey records locally in the browser.

Each interview record can contain:

* Interview ID
* Interviewer name
* Interview time
* Respondent information
* Survey answers
* GPS coordinates
* Photo
* Created timestamp
* Synchronization status
* Synchronization timestamp

Example:

```text
syncStatus:
    pending → waiting for synchronization
    synced  → successfully synchronized
```

IndexedDB is different from the browser cache:

| Technology     | Purpose                         |
| -------------- | ------------------------------- |
| Cache API      | Stores application files        |
| Service Worker | Controls offline requests       |
| IndexedDB      | Stores survey records           |
| Google Sheets  | Stores synchronized survey data |
| Google Drive   | Stores survey photos            |

---

# 4. ⚙️ Service Worker

A Service Worker is used to provide offline access to the application.

The application uses a **Cache-first strategy** for the application shell.

```text
Request application file
        ↓
Check Cache
   ↙          ↘
Found         Not Found
 ↓                ↓
Return        Network request
cached file       ↓
              Save to Cache
                   ↓
                Return
```

The following files are cached:

```text
index.html
style.css
app.js
manifest.json
```

Therefore, the application interface can continue loading when the device is offline.

---

# 5. 🔴 Online / Offline Detection

The application detects the current network status using:

```javascript
navigator.onLine
```

The interface displays the current status:

```text
🟢 Online
```

or:

```text
🔴 Offline
```

When the network connection is restored, the application attempts to synchronize pending survey records.

```javascript
window.addEventListener("online", () => {
    syncPendingData();
});
```

---

# 6. 📍 GPS Location

The application uses the browser Geolocation API to obtain the current location.

The stored information includes:

```text
Latitude
Longitude
Accuracy
Timestamp
```

Example:

```json
{
    "latitude": 16.0471,
    "longitude": 108.2068,
    "accuracy": 10
}
```

GPS coordinates can be obtained by the device even when the application is offline, provided that the device/browser can determine its location.

> Note: Converting coordinates into a street address normally requires an online geocoding service.

---

# 7. 📷 Camera / Photo Capture

The survey provides a camera/photo field for capturing a photo of the library facility.

Example HTML:

```html
<input
    type="file"
    id="photo"
    accept="image/*"
    capture="environment"
/>
```

On supported mobile devices, this allows the user to open the rear camera.

The captured image is stored temporarily with the survey record and uploaded to Google Drive during synchronization.

---

# 8. 📝 New Library Evaluation Survey

The survey collects basic respondent information:

* Major
* Academic year
* Gender
* Age

The questionnaire evaluates the respondent's awareness and experience with the new library.

Example evaluation criteria:

| Category             | Rating |
| -------------------- | ------ |
| Library space        | 1–5    |
| Lighting             | 1–5    |
| Furniture            | 1–5    |
| Wi-Fi                | 1–5    |
| Cleanliness          | 1–5    |
| Overall satisfaction | 1–5    |

Additional questions include:

* Awareness of the new library.
* Frequency of library usage.
* Main purpose of using the library.
* Overall evaluation.
* Additional comments.

---

# 9. 🔄 Automatic Synchronization

The application uses an **offline queue**.

When offline:

```text
Survey
  ↓
IndexedDB
  ↓
pending
```

When the Internet becomes available:

```text
Internet restored
       ↓
Find pending records
       ↓
Send data to Google Apps Script
       ↓
Save data to Google Sheets
       ↓
Upload photo to Google Drive
       ↓
Return success response
       ↓
Update IndexedDB
       ↓
synced
```

The synchronization status is displayed in the interview history.

### Status

🟡 **Chờ đồng bộ / Pending**

The survey is stored locally but has not been uploaded yet.

🟢 **Đã đồng bộ / Synced**

The survey has been successfully uploaded to the backend.

---

# 10. ☁️ Google Apps Script

Google Apps Script is used as the backend API.

The frontend sends survey data to the deployed Web App endpoint:

```text
https://script.google.com/macros/s/XXXXXXXX/exec
```

The endpoint receives the survey data and processes it.

---

# 11. 📊 Google Sheets

Google Sheets is used as the central storage for structured survey information.

The application creates a sheet:

```text
SurveyData
```

Example columns:

```text
id
interviewTime
interviewer
major
year
gender
age
latitude
longitude
accuracy
awareness
space
lighting
furniture
wifi
cleanliness
usage
purpose
overall
comment
photoUrl
createdAt
syncedAt
```

This allows the survey results to be easily analyzed later.

---

# 12. 🖼️ Google Drive

Survey photos are stored in a Google Drive folder:

```text
Library Survey Photos
```

The Google Apps Script backend:

1. Receives the photo.
2. Converts the Base64 image into a Blob.
3. Creates a file in Google Drive.
4. Returns the file URL.
5. Saves the URL in Google Sheets.

---

# 13. 🔔 Synchronization Notification

After successful synchronization, the application displays a notification/toast such as:

```text
✅ Đồng bộ thành công!
```

The application can also use the browser Notification API when permission is available.

> Notification behavior may vary between browsers and mobile operating systems. Installed PWAs generally provide better support than ordinary browser tabs.

---

# 14. 📜 Interview History

The application provides an interview history page.

Each record displays information such as:

```text
Interview ID
Interviewer
Interview time
Respondent
Location
Synchronization status
```

Example:

```text
INT-1726312345-123

Người phỏng vấn: Linh
Thời gian: 14/09/2026 18:20

🟢 Đã đồng bộ
```

or:

```text
🟡 Chờ đồng bộ
```

---

# 15. 📲 Progressive Web App

The application is configured as a PWA using:

```text
manifest.json
Service Worker
HTTPS
```

PWA features include:

* Installable on mobile devices.
* Standalone display mode.
* Offline application shell.
* Custom application icon.
* Mobile-first interface.

The application uses:

```text
icon-192.png
icon-512.png
```

---

# 🏗️ System Architecture

```text
                  ┌─────────────────────┐
                  │       User          │
                  │   Mobile Browser    │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    Library Survey   │
                  │        PWA          │
                  └──────────┬──────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
       ┌───────────┐   ┌────────────┐   ┌───────────┐
       │  Cache    │   │ IndexedDB  │   │ GPS/Camera│
       │   API     │   │            │   │           │
       └───────────┘   └─────┬──────┘   └─────┬─────┘
                             │                │
                             └───────┬────────┘
                                     │
                              Internet Online
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │  Google Apps Script │
                         │       Web App       │
                         └──────────┬──────────┘
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
              ┌─────────────────┐       ┌─────────────────┐
              │  Google Sheets  │       │   Google Drive  │
              │ SurveyData      │       │ Survey Photos   │
              └─────────────────┘       └─────────────────┘
```

---

# 📂 Project Structure

```text
library-survey-pwa/
│
├── index.html
├── style.css
├── app.js
├── sw.js
├── manifest.json
│
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
│
├── Code.gs
│
└── README.md
```

---

# 🛠️ Technologies

| Technology           | Purpose                   |
| -------------------- | ------------------------- |
| HTML5                | Application structure     |
| CSS3                 | Mobile-first UI           |
| JavaScript           | Application logic         |
| IndexedDB            | Offline survey storage    |
| Service Worker       | Offline application shell |
| Cache API            | Cache-first strategy      |
| Web Geolocation API  | GPS location              |
| Camera/File API      | Photo capture             |
| Web Notification API | Notifications             |
| Google Apps Script   | Backend API               |
| Google Sheets        | Survey database           |
| Google Drive         | Photo storage             |
| PWA Manifest         | Installable application   |
| Cloudflare Pages     | HTTPS deployment          |

---

# 🚀 Local Development

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/library-survey-pwa.git
```

Enter the project:

```bash
cd library-survey-pwa
```

---

## 2. Run with Live Server

Open the project in VS Code.

Install the **Live Server** extension if necessary.

Right-click:

```text
index.html
```

Select:

```text
Open with Live Server
```

Example:

```text
http://127.0.0.1:5500/
```

> Do not test Service Worker/PWA functionality by opening `index.html` directly with `file://`.

---

# ☁️ Google Apps Script Setup

## 1. Create Google Sheet

Create a new Google Sheet.

Example name:

```text
Library Survey Data
```

---

## 2. Open Apps Script

In Google Sheets:

```text
Extensions
    ↓
Apps Script
```

Delete the default code and paste:

```text
Code.gs
```

from this repository.

---

## 3. Deploy Web App

Select:

```text
Deploy
    ↓
New deployment
```

Choose:

```text
Web app
```

Configuration:

```text
Execute as: Me
Who has access: Anyone
```

Click:

```text
Deploy
```

Copy the URL ending with:

```text
/exec
```

---

# 🔗 Configure Google Apps Script URL

Open:

```text
app.js
```

Find:

```javascript
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

Replace it with your Web App URL:

```javascript
const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

Save the file.

---

# 🧪 Testing Offline Mode

The application should be tested in both online and offline conditions.

## Test 1 — Online

1. Open the application.
2. Make sure the status shows:

```text
🟢 Online
```

3. Fill in a survey.
4. Submit the survey.
5. The application should attempt synchronization.
6. Check Google Sheets.
7. Check Google Drive.

Expected:

```text
🟢 Đã đồng bộ
```

---

# 📴 Test 2 — Offline

Open:

```text
F12
→ Network
→ Offline
```

The application should display:

```text
🔴 Offline
```

Fill in a new survey.

Click:

```text
Lưu khảo sát
```

The record should remain in IndexedDB.

Expected status:

```text
🟡 Chờ đồng bộ
```

The survey should remain available in the interview history.

---

# 🔄 Test 3 — Restore Network

Change:

```text
Network
→ No throttling
```

The browser becomes online again.

The application detects:

```javascript
navigator.onLine === true
```

and calls the synchronization function.

Expected flow:

```text
🟡 Chờ đồng bộ
        ↓
Internet restored
        ↓
Automatic synchronization
        ↓
Google Apps Script
        ↓
Google Sheets + Google Drive
        ↓
🟢 Đã đồng bộ
```

---

# 📍 GPS Test

When starting an interview:

1. Click **Get Location**.
2. Allow location permission.
3. The application obtains:

```text
Latitude
Longitude
Accuracy
```

The coordinates are saved with the survey record.

---

# 📷 Camera Test

On a mobile device:

1. Open the survey.
2. Select the photo field.
3. Allow camera permission.
4. Take a photo.
5. Preview the image.
6. Submit the survey.

When synchronized, the photo should be uploaded to:

```text
Google Drive
→ Library Survey Photos
```

---

# 🔐 Privacy

The application collects survey-related information such as:

* Respondent demographic information.
* Survey answers.
* Interview time.
* GPS location.
* Facility photographs.

Users should be informed about the purpose of data collection.

The project should not collect unnecessary personal information.

Google Sheets and Google Drive permissions should be configured appropriately.

---

# ⚠️ Limitations

### 1. Internet is required for synchronization

Offline data cannot be uploaded to Google Apps Script until the network connection is restored.

---

### 2. GPS accuracy varies

Location accuracy depends on:

* Device hardware.
* GPS signal.
* Browser permissions.
* Indoor/outdoor environment.

---

### 3. Photo size

Photos encoded as Base64 can become large.

For a production application, images should be:

* Resized.
* Compressed.
* Converted to an appropriate format.

This reduces IndexedDB storage usage and Google Apps Script request size.

---

### 4. Browser notification support

Notification support depends on the browser and operating system.

---

# 📊 Expected Result

The completed system should demonstrate:

```text
                ONLINE
                   │
                   ▼
          Fill out survey
                   │
                   ▼
              IndexedDB
                   │
                   ▼
          Automatic Sync
                   │
          ┌────────┴────────┐
          ▼                 ▼
    Google Sheets      Google Drive
          │                 │
          └────────┬────────┘
                   ▼
            🟢 Synced
```

and:

```text
               OFFLINE
                  │
                  ▼
           Fill out survey
                  │
                  ▼
              IndexedDB
                  │
                  ▼
          🟡 Pending Sync
                  │
                  │
            Network returns
                  │
                  ▼
          Automatic Sync
                  │
                  ▼
             🟢 Synced
```

---

# 📦 Deliverables

This project satisfies the following assignment deliverables:

### 1. Live HTTPS Application

Deployment target:

```text
Cloudflare Pages
```

Example:

```text
https://library-survey.pages.dev
```

---

### 2. Public GitHub Repository

The repository should contain:

```text
index.html
style.css
app.js
sw.js
manifest.json
icons/
Code.gs
README.md
```

---

### 3. Technical Report

A short technical report of approximately **2–4 pages** should describe:

1. Project objective.
2. Offline-first architecture.
3. IndexedDB implementation.
4. Service Worker and Cache-first strategy.
5. GPS and camera functionality.
6. Google Apps Script integration.
7. Google Sheets and Google Drive storage.
8. Automatic synchronization.
9. Testing results.
10. Limitations and future improvements.

---

# 👩‍💻 Author

**Lê Ngọc Khánh Linh**

VKU – Vietnam-Korea University of Information and Communication Technology

Course:

**Cross-platform Mobile Application Development**

Project:

**Offline-first Library Survey PWA**

---

# 📄 License

This project is created for educational purposes.
