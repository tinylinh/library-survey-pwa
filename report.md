# MINI-PROJECT SHORT TECHNICAL REPORT

**Course:** Cross-Platform Mobile App Development (VKU)
**Mini-Project Title:** Offline-first Library Survey PWA
**Team / Student Name:** Lê Ngọc Khánh Linh
**Submission Date:** 14/09/2026

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS

### Student Information

* **Student Name:** Lê Ngọc Khánh Linh
* **Student ID:** [Your Student ID]
* **Role:** Full-stack PWA Development
* **Contribution:** 100%

### Deliverable Links

* **🔗 Live Demo URL:** https://library-survey-pwa.pages.dev/
* **💻 GitHub Repository:** https://github.com/tinylinh/library-survey-pwa
* **🎥 Video Demo:** [Optional — add video link]

### Project Description

This mini-project implements an **Offline-first Progressive Web App (PWA)** for evaluating the new campus library.

The application allows an interviewer to collect survey information even when the device has **zero network connectivity**. Survey records are stored locally using **IndexedDB** and automatically synchronized with Google Sheets when the network connection is restored. Survey photos are uploaded to Google Drive through Google Apps Script.

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

|  #  | Required Feature           |       Status       | Implementation Details & Acceptance Level                                            |
| :-: | -------------------------- | :----------------: | ------------------------------------------------------------------------------------ |
|  1  | Responsive Mobile View     |     ✅ Complete     | Mobile-first responsive UI using HTML5 and CSS3.                                     |
|  2  | PWA Configuration          |     ✅ Complete     | Uses `manifest.json`, Service Worker and HTTPS deployment.                           |
|  3  | Offline Application        |     ✅ Complete     | Service Worker uses a Cache-first strategy to cache the application shell.           |
|  4  | Local Offline Persistence  |     ✅ Complete     | IndexedDB stores survey records, GPS information, photos and synchronization status. |
|  5  | Online/Offline Detection   |     ✅ Complete     | Uses `navigator.onLine` and `online/offline` browser events.                         |
|  6  | Automatic Synchronization  |     ✅ Complete     | Pending records are synchronized automatically when network connectivity returns.    |
|  7  | GPS Location               |     ✅ Complete     | Browser Geolocation API records latitude, longitude and accuracy.                    |
|  8  | Camera / Photo Capture     |     ✅ Complete     | Mobile camera input allows the interviewer to capture library facility photos.       |
|  9  | Google Apps Script API     |     ✅ Complete     | Google Apps Script Web App receives survey data from the PWA.                        |
|  10 | Google Sheets Storage      |     ✅ Complete     | Structured survey responses are stored in the `SurveyData` sheet.                    |
|  11 | Google Drive Photo Storage |     ✅ Complete     | Captured photos are uploaded to the `Library Survey Photos` Drive folder.            |
|  12 | Interview History          |     ✅ Complete     | Previously collected interviews are displayed with synchronization status.           |
|  13 | Notification               |     ✅ Complete     | Displays synchronization success notifications/toasts when supported.                |
|  14 | Cloud Deployment           | ⏳ Pending/Complete | Deployed using Cloudflare Pages with HTTPS.                                          |

### Offline Acceptance Test

The application was designed to satisfy the following workflow:

```text
OFFLINE
   ↓
Fill in survey
   ↓
Save to IndexedDB
   ↓
Status = Pending
   ↓
Network restored
   ↓
Automatic synchronization
   ↓
Google Apps Script
   ↓
Google Sheets + Google Drive
   ↓
Status = Synced
```

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1 System Architecture

The application follows an **Offline-first architecture** consisting of a frontend PWA, browser storage, Service Worker and cloud synchronization backend.

```text
                    ┌─────────────────────┐
                    │       User          │
                    │  Mobile / Browser   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Library Survey PWA │
                    │ HTML + CSS + JS      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ Cache API   │  │  IndexedDB  │  │ GPS/Camera  │
       │ App Shell   │  │ Survey Data │  │   Input     │
       └─────────────┘  └──────┬──────┘  └──────┬──────┘
                                │                │
                                └───────┬────────┘
                                        │
                                  Network Online
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │ Google Apps Script   │
                             │      Web App         │
                             └──────────┬──────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                ┌─────────────────┐          ┌─────────────────┐
                │  Google Sheets  │          │   Google Drive  │
                │   SurveyData    │          │ Survey Photos   │
                └─────────────────┘          └─────────────────┘
```

### 3.2 Offline Storage Strategy

Two different browser storage mechanisms are used.

**Cache API + Service Worker**

The Service Worker caches static application files:

```text
index.html
style.css
app.js
manifest.json
```

A **Cache-first** strategy is used:

```text
Request
   ↓
Check Cache
   ↓
Found? ── Yes ──→ Return cached resource
   │
   No
   ↓
Fetch from network
   ↓
Store in Cache
   ↓
Return resource
```

**IndexedDB**

IndexedDB stores structured survey information separately from the application cache.

Each interview contains information such as:

```text
Interview ID
Interviewer
Interview time
Respondent information
Survey answers
GPS coordinates
Photo
Created time
Sync status
Sync time
```

The synchronization state is represented by:

```text
pending → waiting for synchronization

synced → successfully synchronized
```

### 3.3 Automatic Sync Flow

When a survey is submitted while offline:

```text
Survey Form
    ↓
IndexedDB
    ↓
syncStatus = "pending"
```

When the browser detects that the network has returned:

```javascript
window.addEventListener("online", () => {
    syncPendingData();
});
```

The application retrieves all pending records and sends them to the Google Apps Script Web App.

After a successful response:

```text
syncStatus:
pending → synced
```

The interview history is then updated.

### 3.4 GPS and Camera

The application uses the browser Geolocation API:

```javascript
navigator.geolocation.getCurrentPosition(...)
```

The following information is recorded:

* Latitude
* Longitude
* Accuracy
* Location timestamp

For photos, the application uses:

```html
<input
    type="file"
    accept="image/*"
    capture="environment"
>
```

On supported mobile browsers, this opens the rear camera.

### 3.5 Exception Handling

The application handles common failures including:

* No network connection.
* GPS permission denied.
* Camera permission denied.
* Google Apps Script synchronization failure.
* Missing Google Apps Script URL.
* Duplicate survey records.
* Failed photo upload.

If synchronization fails, the record remains:

```text
🟡 Pending
```

instead of being deleted. This allows the application to retry synchronization later.

---

## 3.6 Project Structure

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

### Main Files

| File            | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `index.html`    | Application structure and survey form                    |
| `style.css`     | Mobile-first responsive interface                        |
| `app.js`        | Survey logic, IndexedDB, GPS, camera and synchronization |
| `sw.js`         | Service Worker and Cache-first offline strategy          |
| `manifest.json` | PWA configuration                                        |
| `Code.gs`       | Google Apps Script backend                               |
| `icons/`        | PWA application icons                                    |
| `README.md`     | Project documentation                                    |

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

The following screenshots should be included as evidence of implementation and testing.

### Screenshot 1 — Main Mobile Interface

**Description:**
Shows the mobile-first Library Survey home screen and the current online/offline status.

**Expected evidence:**

* Library Survey title.
* New interview button.
* Network status.
* Survey statistics.

> **[Insert Screenshot 1 here]**

---

### Screenshot 2 — Survey Form with GPS and Camera

**Description:**
Shows the interview form containing respondent information, library evaluation questions, GPS location and photo capture.

**Expected evidence:**

* Interviewer name.
* Respondent information.
* Evaluation questions.
* GPS location.
* Camera/photo field.

> **[Insert Screenshot 2 here]**

---

### Screenshot 3 — Offline Mode

**Description:**
The browser DevTools Network panel is set to **Offline**. A survey is completed and saved locally.

**Expected evidence:**

```text
🔴 Offline
```

and the survey status:

```text
🟡 Chờ đồng bộ
```

This demonstrates that the application can save data without an Internet connection.

> **[Insert Screenshot 3 here]**

---

### Screenshot 4 — Successful Synchronization

**Description:**
After changing the network from Offline to Online, the application automatically synchronizes the pending record.

**Expected evidence:**

```text
🟢 Đã đồng bộ
```

The corresponding survey record should appear in Google Sheets and the captured photo should appear in Google Drive.

> **[Insert Screenshot 4 here]**

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Challenge 1 — Supporting Offline Survey Submission

A major challenge was allowing the interviewer to submit a survey without network connectivity.

If the application directly sent the survey to Google Apps Script, the request would fail when the device was offline.

**Resolution:**

IndexedDB was introduced as a local offline queue.

```text
Offline
   ↓
Save survey to IndexedDB
   ↓
pending
   ↓
Wait for network
   ↓
Sync automatically
```

This ensures that survey data is not lost when the network is unavailable.

---

### Challenge 2 — Synchronizing Local Data with Google Services

Another challenge was synchronizing locally stored records with Google Sheets and uploading photos to Google Drive.

**Resolution:**

Google Apps Script was implemented as a lightweight backend Web App.

The PWA sends the pending survey record to the Apps Script endpoint. The script then:

1. Parses the survey data.
2. Checks for duplicate interview IDs.
3. Adds structured information to Google Sheets.
4. Converts the Base64 photo into an image Blob.
5. Uploads the photo to Google Drive.
6. Returns a success response to the PWA.
7. The PWA changes the local status from `pending` to `synced`.

This approach provides a simple cloud synchronization mechanism without requiring a dedicated server.

---

## 6. CONCLUSION

The **Offline-first Library Survey PWA** successfully demonstrates the main concepts required for an offline-capable cross-platform web application.

The application combines:

* Mobile-first responsive design.
* Progressive Web App technology.
* Service Worker and Cache-first caching.
* IndexedDB offline persistence.
* GPS location capture.
* Camera/photo capture.
* Online/offline detection.
* Automatic synchronization.
* Google Apps Script.
* Google Sheets.
* Google Drive.
* Interview history and synchronization status.

The project demonstrates that survey data can be collected reliably even without network connectivity and synchronized automatically when connectivity is restored.

Future improvements could include image compression, more advanced background synchronization, data encryption, authentication, and analytics dashboards for survey results.
