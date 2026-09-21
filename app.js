const DB_NAME = "LibrarySurveyDB";
const DB_VERSION = 1;
const STORE_NAME = "interviews";

let db;
let currentLocation = null;
let currentPhoto = null;
let currentPhotoDataUrl = null;
let cameraStream = null;
let currentUser = null;
let nativeCameraPhoto = false;


/* =========================
   GOOGLE APPS SCRIPT
========================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyrT3i-f2R48mRNGTmB6jUtwNtPperjLu9gSQZFb3Yjo5IQ8R-tHQDXNcQypkFDu3C1Rg/exec";

const GOOGLE_CLIENT_ID =
    window.LIBRARY_SURVEY_CONFIG?.googleClientId || "";


/* =========================
   DATABASE
========================= */

function openDB() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onupgradeneeded = event => {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );
            }
        };

        request.onsuccess = event => {

            db = event.target.result;

            resolve(db);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}


/* =========================
   SAVE INTERVIEW
========================= */

function saveInterview(data) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(STORE_NAME);

        store.put(data);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}


/* =========================
   GET ALL
========================= */

function getAllInterviews() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => {

            resolve(request.result);
        };

        request.onerror = () => {

            reject(request.error);
        };
    });
}


/* =========================
   UPDATE
========================= */

function updateInterview(data) {

    return saveInterview(data);
}


/* =========================
   NETWORK STATUS
========================= */

function updateNetworkStatus() {

    const status =
        document.getElementById("networkStatus");

    if (navigator.onLine) {

        status.textContent = "🟢 Online";
        status.className = "status online";

        syncPendingData();

    } else {

        status.textContent = "🔴 Offline";
        status.className = "status offline";
    }

    updateStats();
}


window.addEventListener(
    "online",
    updateNetworkStatus
);

window.addEventListener(
    "offline",
    updateNetworkStatus
);


/* =========================
   TOAST
========================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}


/* =========================
   NOTIFICATION
========================= */

async function requestNotificationPermission() {

    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "default") {

        try {

            await Notification.requestPermission();

        } catch (error) {

            console.log(error);
        }
    }
}


function sendNotification(title, body) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            title,
            {
                body
            }
        );
    }
}


/* =========================
   LOCATION
========================= */

function getLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Thiết bị không hỗ trợ GPS."
        );

        return;
    }

    const result =
        document.getElementById(
            "locationResult"
        );

    result.textContent =
        "📍 Đang lấy vị trí...";

    navigator.geolocation.getCurrentPosition(

        position => {

            currentLocation = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy,

                timestamp:
                    new Date().toISOString()
            };

            result.innerHTML = `
                <strong>Đã lấy vị trí</strong><br>
                Latitude:
                ${currentLocation.latitude.toFixed(6)}
                <br>
                Longitude:
                ${currentLocation.longitude.toFixed(6)}
                <br>
                Accuracy:
                ${Math.round(currentLocation.accuracy)}m
            `;

            showToast(
                "Đã lấy vị trí thành công."
            );
        },

        error => {

            result.textContent =
                "Không thể lấy vị trí: " +
                error.message;

            showToast(
                "Không lấy được vị trí."
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


/* =========================
   CAMERA
========================= */

document
    .getElementById("photo")
    .addEventListener("change", event => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        currentPhoto = file;
        currentPhotoDataUrl = null;

        const preview =
            document.getElementById(
                "photoPreview"
            );

        preview.src =
            URL.createObjectURL(file);

        preview.hidden = false;
    });


async function openCamera() {

    const capacitorCamera =
        window.CapacitorPlugins?.Camera ||
        window.Capacitor?.Plugins?.Camera;

    if (capacitorCamera) {

        try {

            const image = await capacitorCamera.getPhoto({
                quality: 85,
                allowEditing: false,
                resultType: "base64",
                source: "camera",
                saveToGallery: true
            });

            currentPhotoDataUrl =
                `data:image/${image.format || "jpeg"};base64,${image.base64String}`;

            currentPhoto = null;
            nativeCameraPhoto = true;

            const preview = document.getElementById("photoPreview");
            preview.src = currentPhotoDataUrl;
            preview.hidden = false;
            document.getElementById("downloadPhotoBtn").hidden = false;

            showToast("Đã chụp và lưu ảnh vào thư viện điện thoại.");
            return;

        } catch (error) {

            if (error?.message?.toLowerCase().includes("cancel")) {
                return;
            }

            console.error("Capacitor camera error:", error);
            showToast("Không mở được camera native. Đang thử camera trình duyệt.");
        }
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showToast(
            "Trình duyệt không hỗ trợ mở camera trực tiếp."
        );

        return;
    }


    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },
                    audio: false
                }
            );

        const video =
            document.getElementById(
                "cameraPreview"
            );

        video.srcObject =
            cameraStream;

        video.hidden =
            false;

        document.getElementById(
            "capturePhotoBtn"
        ).hidden = false;

        document.getElementById(
            "closeCameraBtn"
        ).hidden = false;

        showToast(
            "Đã mở camera."
        );

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        showToast(
            "Không mở được camera. Hãy cấp quyền Camera và dùng HTTPS hoặc localhost."
        );
    }
}


function closeCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => {
                track.stop();
            });
    }

    cameraStream =
        null;

    const video =
        document.getElementById(
            "cameraPreview"
        );

    video.pause();
    video.srcObject = null;
    video.hidden = true;

    document.getElementById(
        "capturePhotoBtn"
    ).hidden = true;

    document.getElementById(
        "closeCameraBtn"
    ).hidden = true;
}


function capturePhoto() {

    const video =
        document.getElementById(
            "cameraPreview"
        );

    if (
        !cameraStream ||
        !video.videoWidth ||
        !video.videoHeight
    ) {

        showToast(
            "Camera chưa sẵn sàng để chụp."
        );

        return;
    }


    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;

    canvas
        .getContext("2d")
        .drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

    currentPhotoDataUrl =
        canvas.toDataURL(
            "image/jpeg",
            0.82
        );

    currentPhoto =
        null;

    const preview =
        document.getElementById(
            "photoPreview"
        );

    preview.src =
        currentPhotoDataUrl;

    preview.hidden =
        false;

    document.getElementById(
        "photo"
    ).value = "";

    closeCamera();

    document.getElementById("downloadPhotoBtn").hidden = false;

    showToast(
        "Đã chụp ảnh hiện trường."
    );
}


function downloadCurrentPhoto() {

    if (!currentPhotoDataUrl) {
        showToast("Chưa có ảnh để lưu.");
        return;
    }

    const link = document.createElement("a");
    link.href = currentPhotoDataUrl;
    link.download = `library-survey-${Date.now()}.jpg`;
    link.click();
    showToast("Đã gửi ảnh xuống thư mục tải về của điện thoại.");
}


/* =========================
   SESSION ID
========================= */

function createSessionId() {

    const now = new Date();

    const date =
        now.toISOString()
            .replace(/\D/g, "")
            .slice(0, 14);

    const random =
        Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();

    return `INT-${date}-${random}`;
}


/* =========================
   PHOTO TO BASE64
========================= */

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        if (!file) {

            resolve(null);

            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {

            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}


/* =========================
   GET RADIO
========================= */

function getRadioValue(name) {

    const selected =
        document.querySelector(
            `input[name="${name}"]:checked`
        );

    return selected
        ? selected.value
        : "";
}


/* =========================
   CHECKBOX
========================= */

function getPurposes() {

    return [
        ...document.querySelectorAll(
            'input[name="purpose"]:checked'
        )
    ].map(
        checkbox => checkbox.value
    );
}


/* =========================
   SUBMIT
========================= */

document
    .getElementById("surveyForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const sessionId =
                document.getElementById(
                    "sessionId"
                ).dataset.id;

            const photo =
                currentPhotoDataUrl ||
                await fileToBase64(
                    currentPhoto
                );

            const data = {

                id: sessionId,

                user: currentUser
                    ? {
                        id: currentUser.sub,
                        email: currentUser.email,
                        name: currentUser.name,
                        picture: currentUser.picture
                    }
                    : null,

                interviewer:
                    document.getElementById(
                        "interviewer"
                    ).value.trim(),

                interviewTime:
                    document.getElementById(
                        "interviewTime"
                    ).value,

                location:
                    currentLocation,

                respondent: {

                    major:
                        document.getElementById(
                            "major"
                        ).value,

                    year:
                        document.getElementById(
                            "year"
                        ).value,

                    gender:
                        document.getElementById(
                            "gender"
                        ).value,

                    age:
                        document.getElementById(
                            "age"
                        ).value
                },

                answers: {

                    awareness:
                        getRadioValue(
                            "awareness"
                        ),

                    space:
                        Number(
                            document.getElementById(
                                "space"
                            ).value
                        ),

                    lighting:
                        Number(
                            document.getElementById(
                                "lighting"
                            ).value
                        ),

                    furniture:
                        Number(
                            document.getElementById(
                                "furniture"
                            ).value
                        ),

                    wifi:
                        Number(
                            document.getElementById(
                                "wifi"
                            ).value
                        ),

                    cleanliness:
                        Number(
                            document.getElementById(
                                "cleanliness"
                            ).value
                        ),

                    usage:
                        document.getElementById(
                            "usage"
                        ).value,

                    purpose:
                        getPurposes(),

                    overall:
                        Number(
                            document.getElementById(
                                "overall"
                            ).value
                        ),

                    comment:
                        document.getElementById(
                            "comment"
                        ).value.trim()
                },

                photo: photo,

                syncStatus:
                    "pending",

                createdAt:
                    new Date().toISOString()
            };


            try {

                await saveInterview(data);

                let synced = false;

                if (navigator.onLine) {

                    try {

                        synced =
                            await syncInterview(
                                data
                            );

                    } catch (syncError) {

                        console.error(
                            "Sync error:",
                            syncError
                        );
                    }
                }


                if (!synced) {

                showToast(
                    "💾 Đã lưu phiên phỏng vấn trên thiết bị."
                );

                sendNotification(
                    "Đã lưu khảo sát",
                    "Dữ liệu đang chờ đồng bộ."
                );

                } else {

                    showToast(
                        "✅ Đã lưu và đồng bộ lên Google Sheet."
                    );

                    sendNotification(
                        "Đã đồng bộ khảo sát",
                        "Dữ liệu đã được lưu vào Google Sheet."
                    );
                }

                resetForm();

                showPage("homePage");

                updateStats();

            } catch (error) {

                console.error(error);

                showToast(
                    "Không thể lưu dữ liệu."
                );
            }
        }
    );


/* =========================
   RESET FORM
========================= */

function resetForm() {

    document
        .getElementById("surveyForm")
        .reset();

    currentLocation = null;
    currentPhoto = null;
    currentPhotoDataUrl = null;
    nativeCameraPhoto = false;

    closeCamera();

    document
        .getElementById(
            "photoPreview"
        )
        .hidden = true;

    document
        .getElementById(
            "photoPreview"
        )
        .removeAttribute(
            "src"
        );

    document.getElementById("downloadPhotoBtn").hidden = true;

    document
        .getElementById(
            "locationResult"
        )
        .textContent =
        "Chưa lấy vị trí";
}


/* =========================
   SYNC
========================= */

async function syncPendingData() {

    if (!navigator.onLine) {
        return;
    }

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "YOUR_GOOGLE"
        )
    ) {

        console.log(
            "Google Apps Script URL chưa được cấu hình."
        );

        return;
    }


    const all =
        await getAllInterviews();

    const pending =
        all.filter(
            item =>
                item.syncStatus === "pending"
        );


    if (pending.length === 0) {
        updateStats();
        return;
    }


    showToast(
        `🔄 Đang đồng bộ ${pending.length} phiên...`
    );


    for (const item of pending) {

        try {

            await syncInterview(
                item
            );

        } catch (error) {

            console.error(
                "Sync error:",
                error
            );
        }
    }


    updateStats();

    const remaining =
        (await getAllInterviews())
            .filter(
                item =>
                    item.syncStatus ===
                    "pending"
            );


    if (remaining.length === 0) {

        showToast(
            "✅ Đồng bộ dữ liệu thành công!"
        );

        sendNotification(
            "Đồng bộ thành công",
            "Tất cả phiên phỏng vấn đã được lưu."
        );

    } else {

        showToast(
            `⚠️ Còn ${remaining.length} phiên chưa đồng bộ.`
        );
    }


    loadHistory();
}


async function syncInterview(item) {

    if (!navigator.onLine) {
        return false;
    }

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "YOUR_GOOGLE"
        )
    ) {

        console.log(
            "Google Apps Script URL chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh."
        );

        return false;
    }


    const response =
        await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(item)
            }
        );


    if (response.type === "opaque") {

        item.syncStatus =
            "synced";

        item.syncedAt =
            new Date()
                .toISOString();

        await updateInterview(
            item
        );

        return true;
    }


    if (!response.ok) {
        throw new Error(
            `Sync failed: ${response.status}`
        );
    }


    const result =
        await response.json();


    if (!result.success) {
        throw new Error(
            result.error ||
            "Google Apps Script returned success=false"
        );
    }


    item.syncStatus =
        "synced";

    item.syncedAt =
        new Date()
            .toISOString();

    item.photoUrl =
        result.photoUrl ||
        item.photoUrl ||
        null;

    await updateInterview(
        item
    );

    return true;
}


/* =========================
   HISTORY
========================= */

async function loadHistory() {

    const list =
        document.getElementById(
            "historyList"
        );

    const interviews =
        await getAllInterviews();


    interviews.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    if (interviews.length === 0) {

        list.innerHTML = `
            <div class="card">
                Chưa có phiên phỏng vấn.
            </div>
        `;

        return;
    }


    list.innerHTML =
        interviews.map(item => {

            const synced =
                item.syncStatus ===
                "synced";

            return `
                <div class="history-card">

                    <div class="history-top">

                        <div>
                            <div class="history-id">
                                ${item.id}
                            </div>

                            <div class="history-time">
                                ${item.interviewTime}
                            </div>

                            <div class="history-time">
                                ${item.respondent.major}
                                ·
                                ${item.respondent.year}
                            </div>
                        </div>

                        <span
                            class="sync-badge ${
                                synced
                                    ? "synced"
                                    : "pending"
                            }">

                            ${
                                synced
                                    ? "🟢 Đã đồng bộ"
                                    : "🟡 Chờ đồng bộ"
                            }

                        </span>

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================
   STATS
========================= */

async function updateStats() {

    if (!db) return;

    const data =
        await getAllInterviews();

    const pending =
        data.filter(
            item =>
                item.syncStatus ===
                "pending"
        );

    const synced =
        data.filter(
            item =>
                item.syncStatus ===
                "synced"
        );


    document.getElementById(
        "totalCount"
    ).textContent =
        data.length;

    document.getElementById(
        "pendingCount"
    ).textContent =
        pending.length;

    document.getElementById(
        "syncedCount"
    ).textContent =
        synced.length;
}


/* =========================
   PAGE NAVIGATION
========================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active"
            );
        });


    document
        .getElementById(pageId)
        .classList.add("active");


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );


    if (pageId === "historyPage") {

        loadHistory();
    }
}


/* =========================
   GOOGLE AUTHENTICATION
========================= */

function decodeGoogleCredential(credential) {

    const payload = credential.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    return JSON.parse(
        decodeURIComponent(
            atob(payload)
                .split("")
                .map(character => `%${("00" + character.charCodeAt(0).toString(16)).slice(-2)}`)
                .join("")
        )
    );
}


function handleGoogleCredential(response) {

    currentUser = decodeGoogleCredential(response.credential);
    localStorage.setItem("librarySurveyUser", JSON.stringify(currentUser));
    renderAuthState();
    showToast(`Đã đăng nhập: ${currentUser.email}`);
}


function renderAuthState() {

    const title = document.getElementById("authTitle");
    const email = document.getElementById("authEmail");
    const signOutButton = document.getElementById("signOutBtn");
    const googleButton = document.getElementById("googleSignInButton");

    if (currentUser) {
        title.textContent = currentUser.name || "Đã đăng nhập";
        email.textContent = currentUser.email;
        signOutButton.hidden = false;
        googleButton.hidden = true;
        return;
    }

    title.textContent = "Đăng nhập để bắt đầu";
    email.textContent = "Dữ liệu sẽ được gắn với tài khoản Google của bạn.";
    signOutButton.hidden = true;
    googleButton.hidden = false;
}


function initializeGoogleAuth() {

    const googleButton = document.getElementById("googleSignInButton");
    const storedUser = localStorage.getItem("librarySurveyUser");

    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (error) {
            localStorage.removeItem("librarySurveyUser");
        }
    }

    renderAuthState();

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE")) {
        googleButton.innerHTML = "<span class=\"auth-hint\">Cấu hình Google Client ID trong config.js</span>";
        return;
    }

    const renderGoogleButton = () => {
        if (!window.google?.accounts?.id) {
            setTimeout(renderGoogleButton, 250);
            return;
        }

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false
        });

        window.google.accounts.id.renderButton(googleButton, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 220
        });
    };

    renderGoogleButton();
}


function signOut() {

    currentUser = null;
    localStorage.removeItem("librarySurveyUser");

    if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
    }

    renderAuthState();
    showToast("Đã đăng xuất tài khoản Google.");
}


/* =========================
   START INTERVIEW
========================= */

document
    .getElementById("startBtn")
    .addEventListener(
        "click",
        () => {

            if (!currentUser) {
                showToast("Vui lòng đăng nhập Google trước khi bắt đầu.");
                return;
            }

            const id =
                createSessionId();

            document
                .getElementById(
                    "sessionId"
                )
                .textContent = id;

            document
                .getElementById(
                    "sessionId"
                )
                .dataset.id = id;


            document
                .getElementById(
                    "interviewTime"
                )
                .value =
                new Date()
                    .toLocaleString(
                        "vi-VN"
                    );


            showPage("surveyPage");
        }
    );


/* =========================
   HISTORY BUTTON
========================= */

document
    .getElementById("historyBtn")
    .addEventListener(
        "click",
        () => {

            showPage(
                "historyPage"
            );
        }
    );


/* =========================
   BACK BUTTONS
========================= */

document
    .querySelectorAll(".backBtn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showPage(
                    "homePage"
                );
            }
        );
    });


/* =========================
   LOCATION BUTTON
========================= */

document
    .getElementById("locationBtn")
    .addEventListener(
        "click",
        getLocation
    );


document
    .getElementById("openCameraBtn")
    .addEventListener(
        "click",
        openCamera
    );


document
    .getElementById("capturePhotoBtn")
    .addEventListener(
        "click",
        capturePhoto
    );


document
    .getElementById("closeCameraBtn")
    .addEventListener(
        "click",
        closeCamera
    );


document
    .getElementById("downloadPhotoBtn")
    .addEventListener(
        "click",
        downloadCurrentPhoto
    );


document
    .getElementById("signOutBtn")
    .addEventListener(
        "click",
        signOut
    );


/* =========================
   RATING
========================= */

document
    .getElementById("overall")
    .addEventListener(
        "input",
        event => {

            const value =
                Number(
                    event.target.value
                );

            document
                .getElementById(
                    "overallValue"
                )
                .textContent =
                "⭐".repeat(value);
        }
    );


/* =========================
   SERVICE WORKER
========================= */

async function registerServiceWorker() {

    if ("serviceWorker" in navigator) {

        try {

            await navigator.serviceWorker.register(
                "./sw.js"
            );

            console.log(
                "Service Worker registered."
            );

        } catch (error) {

            console.error(
                "SW registration failed:",
                error
            );
        }
    }
}


/* =========================
   INITIALIZE
========================= */

async function init() {

    initializeGoogleAuth();

    await openDB();

    await requestNotificationPermission();

    await registerServiceWorker();

    updateNetworkStatus();

    await updateStats();

    await loadHistory();

    document
        .getElementById(
            "overallValue"
        )
        .textContent =
        "⭐⭐⭐";
}


init();
