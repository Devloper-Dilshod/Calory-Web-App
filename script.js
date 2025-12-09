// script.js - YAKUNIY VA TO'LIQ ISHLAYDIGAN VERSIYA

// --- API SOZLAMALARI ---
const PROXY_CALCULATE_URL = 'api/calculate.php';
const PROXY_AUTH_URL = 'api/auth.php';
const PROXY_DATA_URL = 'api/data.php'; 

let USER_ID = localStorage.getItem('user_id'); 
let USER_DATA = JSON.parse(localStorage.getItem('user_data')) || {};
let CACHE = {};
let HISTORY_DATA = []; // Tarix ma'lumotlarini saqlash

// --- Yangi sobit qiymat ---
const CALORIE_TARGET = 2000; // Har bir foydalanuvchi uchun kunlik maqsad (misol)

// --- HTML Elementlari ---
const mainApp = document.getElementById('mainApp');
const authContainer = document.getElementById('authContainer');

// --- Auth elementlari (login.html) ---
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginUsernameInput = document.getElementById('loginUsername');
const regUsernameInput = document.getElementById('regUsername');
const authError = document.getElementById('authError');
const authSuccess = document.getElementById('authSuccess');

// --- Main App elementlari (index.html) ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const logoutBtn = document.getElementById('logoutBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const foodInput = document.getElementById('foodInput');
const imageUpload = document.getElementById('imageUpload'); 
const imageUploadLabel = document.getElementById('imageUploadLabel'); 
const imageFileName = document.getElementById('imageFileName'); 
const imageUploadText = document.getElementById('imageUploadText'); 
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const emptyResult = document.getElementById('emptyResult');
const historyList = document.getElementById('historyList');
// Stats uchun yangi div ichida
const statsBarContainer = document.getElementById('statsBarContainer'); 
const avgProtein = document.getElementById('avgProtein');
const avgFat = document.getElementById('avgFat');
const avgCarbs = document.getElementById('avgCarbs');
const statsContent = document.getElementById('statsContent'); // Yangi element
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const loading = document.getElementById('loading');
const loadingMessage = document.getElementById('loadingMessage');
const errorDiv = document.getElementById('errorDiv');
const errorMessage = document.getElementById('errorMessage');

// Profil/Modal elementlari
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const logoutBtnModal = document.getElementById('logoutBtnModal');
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailContent = document.getElementById('detailContent');
const changePasswordForm = document.getElementById('changePasswordForm');
const profileUsername = document.getElementById('profileUsername');
const profileError = document.getElementById('profileError');
const profileSuccess = document.getElementById('profileSuccess');


// --- YORDAMCHI FUNKSIYALAR ---

function checkAuthAndRedirect() {
    USER_ID = localStorage.getItem('user_id'); 
    USER_DATA = JSON.parse(localStorage.getItem('user_data'));
    const isAuth = localStorage.getItem('isAuthenticated') === 'true' && USER_ID;
    const isLoginPage = window.location.pathname.includes('login.html');

    if (isAuth && isLoginPage) {
        window.location.href = 'index.html';
    } else if (!isAuth && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (isAuth && mainApp) {
        initMainApp();
    } else if (!isAuth && authContainer) {
        initAuthApp();
    }
}

function showAuthError(message) { 
    if (authError && document.getElementById('authErrorMessage')) { 
        authSuccess?.classList.add('hidden'); 
        document.getElementById('authErrorMessage').innerHTML = message; 
        authError.classList.remove('hidden'); 
        setTimeout(() => authError.classList.add('hidden'), 7000); 
    } 
}
function showAuthSuccess(message) { 
    if (authSuccess && document.getElementById('authSuccessMessage')) { 
        authError?.classList.add('hidden'); 
        document.getElementById('authSuccessMessage').innerHTML = message; 
        authSuccess.classList.remove('hidden'); 
        setTimeout(() => authSuccess.classList.add('hidden'), 7000); 
    } 
}
function showProfileError(message) { 
    if (profileError && document.getElementById('profileErrorMessage')) { 
        profileSuccess?.classList.add('hidden'); 
        document.getElementById('profileErrorMessage').innerHTML = message; 
        profileError.classList.remove('hidden'); 
        setTimeout(() => profileError.classList.add('hidden'), 7000); 
    } 
}
function showProfileSuccess(message) { 
    if (profileSuccess && document.getElementById('profileSuccessMessage')) { 
        profileError?.classList.add('hidden'); 
        document.getElementById('profileSuccessMessage').innerHTML = message; 
        profileSuccess.classList.remove('hidden'); 
        setTimeout(() => profileSuccess.classList.add('hidden'), 7000); 
    } 
}
function showError(message) { 
    if (errorDiv && errorMessage) { 
        errorMessage.textContent = message; 
        errorDiv.classList.remove('hidden'); 
        setTimeout(() => errorDiv.classList.add('hidden'), 7000); 
    } 
}
function showLoading(message) { 
    if (loading && loadingMessage) { 
        loadingMessage.textContent = message; 
        loading.classList.remove('hidden'); 
    } 
}
function hideLoading() { loading?.classList.add('hidden'); }

async function sendRequest(url, action, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, user_id: USER_ID, ...data })
        });
        if (!response.ok) {
            let errorText = await response.text();
            throw new Error(`Serverdan xato: Status ${response.status}. ${errorText.substring(0, 100)}...`);
        }
        const result = await response.json(); 
        if (result.success) {
            return result;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        if (error.message.startsWith('Failed to fetch')) {
            throw new Error("❌ Tarmoq xatosi: Serverga ulanib bo'lmadi. **PHP serveri ishlayotganini** tekshiring.");
        }
        throw error;
    }
}

function loadTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeIcon?.classList.remove('fa-moon');
        themeIcon?.classList.add('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon?.classList.remove('fa-sun');
        themeIcon?.classList.add('fa-moon');
    }
}
function setupThemeToggle(toggleElement) {
    toggleElement?.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        loadTheme();
    });
}

// --- Parolni ko'rsatish/yashirish mantiqi ---
function setupPasswordToggle(inputFieldId, toggleButtonSelector) {
    const inputField = document.getElementById(inputFieldId);
    const toggleButton = document.querySelector(toggleButtonSelector);
    
    if (inputField && toggleButton) {
        toggleButton.addEventListener('click', () => {
            const icon = toggleButton.querySelector('i');
            if (inputField.type === 'password') {
                inputField.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                inputField.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
}


// --- 1. AUTHENTICATION MANTIQI ---
function initAuthApp() {
    if (!authContainer) return; 
    
    document.getElementById('switchRegister')?.addEventListener('click', () => { loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); showAuthError(""); showAuthSuccess(""); });
    document.getElementById('switchLogin')?.addEventListener('click', () => { registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); showAuthError(""); showAuthSuccess(""); });
    
    // Parol maydonlari uchun ko'zcha mantiqini ishga tushirish
    setupPasswordToggle('loginPassword', '[data-password-toggle="loginPassword"]');
    setupPasswordToggle('regPassword', '[data-password-toggle="regPassword"]');
    
    // 1. Ro'yxatdan o'tish (Register)
    document.getElementById('registerBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = regUsernameInput.value.trim();
        const password = document.getElementById('regPassword').value.trim();
        
        showLoading("Ro'yxatdan o'tish...");
        try {
            const result = await sendRequest(PROXY_AUTH_URL, 'register', { username, password });
            
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user_id', result.user.id);
            localStorage.setItem('user_data', JSON.stringify(result.user));
            showAuthSuccess(result.message);
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            
        } catch (error) { showAuthError(error.message); } finally { hideLoading(); }
    });

    // 2. Kirish (Login)
    document.getElementById('loginBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        showLoading("Kirish...");
        try {
            const result = await sendRequest(PROXY_AUTH_URL, 'login', { username, password });
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user_id', result.user.id);
            localStorage.setItem('user_data', JSON.stringify(result.user));
            window.location.href = 'index.html'; 
        } catch (error) { showAuthError(error.message); } finally { hideLoading(); }
    });
    
    loadTheme();
    setupThemeToggle(document.getElementById('themeToggle'));
    setupFloatingBallsAnimation();
}

// --- 2. ASOSIY ILOVA MANTIQI ---
function initMainApp() {
    if (!mainApp) return; 
    
    USER_ID = localStorage.getItem('user_id'); 
    USER_DATA = JSON.parse(localStorage.getItem('user_data'));

    // 2.1. Chiqish
    const logoutHandler = () => { localStorage.clear(); window.location.href = 'login.html'; };
    logoutBtn?.addEventListener('click', logoutHandler);
    logoutBtnModal?.addEventListener('click', logoutHandler);
    
    // 2.2. Tablar (Menyular)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => { switchTab(button.dataset.tab); });
    });
    switchTab('result'); 
    
    // 2.3. AI/DB Mantiqlari
    searchBtn?.addEventListener('click', () => calculateCalories());
    foodInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateCalories();
        }
    });
    
    // Rasm tanlashda avtomatik hisoblash funksiyasi
    imageUpload?.addEventListener('change', handleImageUploadChange);
    
    // 2.4. Profil Modal mantiqi
    profileBtn?.addEventListener('click', showProfileModal);
    closeProfileModal?.addEventListener('click', hideProfileModal);
    
    // 2.5. Detail Modal mantiqi
    closeDetailModal?.addEventListener('click', hideDetailModal);
    
    // 2.6. Parolni almashtirish
    setupPasswordChangeListener();
    
    // 2.7. Tarixni tozalash
    clearHistoryBtn?.addEventListener('click', clearHistory);
    
    loadTheme();
    setupThemeToggle(document.getElementById('themeToggle'));
    setupFloatingBallsAnimation();
    
    showEmptyResult();
    loadHistoryData();
}

// --- 3. AI HISOB-KITOB MANTIQI ---

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
async function sendCalculationRequest(prompt, imageDataURI = null) {
    const data = { prompt };
    if (imageDataURI) { data.image_data = imageDataURI; }
    
    const response = await fetch(PROXY_CALCULATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        let errorData;
        try {
            // Agar PHP serveri JSON formatida xato qaytarsa, uni ko'rsatamiz
            errorData = await response.json();
            throw new Error(errorData.error || `AI serveridan javob kelmadi. HTTP Status: ${response.status}`);
        } catch {
             // Aks holda, umumiy xato
            const errorText = await response.text();
            throw new Error(`AI serveridan javob kelmadi. HTTP Status: ${response.status}. Javob: ${errorText.substring(0, 50)}...`);
        }
    }
    
    const result = await response.json();
    return result.text; // PHP endi faqat toza matnni 'text' kalitida qaytaradi
}

async function calculateCalories() {
    const foodName = foodInput.value.trim();
    const imageFile = imageUpload.files[0];

    if (!foodName && !imageFile) {
        showError("Iltimos, taom nomini kiriting yoki rasm yuklang.");
        return;
    }

    if (!imageFile && foodName && CACHE[foodName]) {
        showResult(CACHE[foodName]);
        return;
    }

    showLoading(imageFile ? "Rasmni tahlil qilmoqda va hisoblanmoqda..." : "Taomni aniqlamoqda va hisoblanmoqda...");

    let imageDataURI = null;
    if (imageFile) {
        try {
            imageDataURI = await convertFileToBase64(imageFile);
        } catch (error) {
            hideLoading();
            showError("Rasm konvertatsiyasida xato: " + error.message);
            return;
        }
    }

    const prompt = `Siz ovqat mahsulotlari bo'yicha ekspert-diyetologsiz . Foydalanuvchining so'roviga binoan, faqat JSON formatida javob qaytaring, boshqa matn, izoh yoki kirish so'zini qo'shmang. Sizdan so'ralgan taom: "${foodName || 'Rasmdagi mahsulot'}" ${imageFile ? 'Quyida rasm bor, uni tahlil qiling va kaloriya qiymatini aniqlang.' : ''} Natijani quyidagi JSON formatida qaytaring (qiymatlar o'nlik kasrli bo'lishi mumkin): {"name": "Aniqlangan taom nomi", "category": "Taom kategoriyasi", "calories": 250, "protein": 12.3, "fat": 4.5, "carbs": 20.1, "fiber": 3.2} Faqat JSON, boshqa hech narsa yozma!`;

    try {
        const text = await sendCalculationRequest(prompt, imageDataURI);
        
        // !!! ISHONCHLI STRING TEKSHIRUVI !!!
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            throw new Error("AI serveridan noto'g'ri turdagi javob keldi (bo'sh yoki string emas). Server javobini tekshiring.");
        }

        // AI javobidan JSON obyektini ajratib olish (AI ba'zan JSON dan oldin yoki keyin ortiqcha matn qo'shadi)
        const jsonTextMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonTextMatch) {
            throw new Error("JSON formatida javob olinmadi. AI noto'g'ri formatda javob berdi. To'liq javob: " + text.substring(0, 200) + '...');
        }
        const json = JSON.parse(jsonTextMatch[0]);

        await saveEntry(json);
        CACHE[json.name] = json;
        showResult(json);
        
        foodInput.value = '';
        imageUpload.value = '';
        handleImageUploadChange(true); // UI ni tozalash uchun
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function saveEntry(data) {
    try {
        await sendRequest(PROXY_DATA_URL, 'save_entry', {
            food_name: data.name,
            calories: data.calories,
            protein: data.protein,
            fat: data.fat,
            carbs: data.carbs,
            fiber: data.fiber || 0 
        });
        await loadHistoryData();
    } catch (error) {
        showError("Tarixga saqlashda xato yuz berdi: " + error.message);
    }
}
function showResult(json) {
    emptyResult?.classList.add('hidden');
    resultDiv.innerHTML = `
        <h2 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">${json.name}</h2>
        <p class="text-xl text-gray-700 dark:text-gray-300 mb-6">Kategoriya: <span class="font-semibold text-blue-500">${json.category || 'Nomaʼlum'}</span></p>
        
        <div class="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl shadow-lg border border-green-200 dark:border-green-800 mb-6">
            <p class="text-sm font-semibold text-green-700 dark:text-green-300">UMUMIY KALORIYA</p>
            <p class="text-5xl font-extrabold text-green-600 dark:text-green-400 mt-1">${json.calories.toFixed(1)} <span class="text-xl">kcal</span></p>
        </div>

        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">100g yoki Umumiy Miqdor uchun:</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${createMacroCard('Protein', json.protein, 'blue')}
            ${createMacroCard('Yogʻ', json.fat, 'yellow')}
            ${createMacroCard('Uglevod', json.carbs, 'red')}
            ${createMacroCard('Kletchatka', json.fiber || 0, 'purple')}
        </div>
        
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-6 italic">
            Eslatma: Bu qiymatlar AI tahlili asosida hisoblangan.
        </p>
    `;
}
function createMacroCard(name, value, color) {
    return `
        <div class="p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-200 dark:border-${color}-800 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-300">${name}</p>
            <p class="text-2xl font-bold text-${color}-600 dark:text-${color}-400">${value.toFixed(1)}g</p>
        </div>
    `;
}
function showEmptyResult() {
    resultDiv.innerHTML = '';
    emptyResult?.classList.remove('hidden');
}

// Rasm yuklanganda avtomatik hisoblash mantiqi
function handleImageUploadChange(isReset = false) {
    if (imageUpload.files.length > 0) {
        const fileName = imageUpload.files[0].name;
        imageFileName.textContent = fileName;
        imageFileName.classList.remove('hidden');
        imageUploadText.classList.add('hidden');
        imageUploadLabel.classList.add('border-green-500', 'border-solid');
        imageUploadLabel.classList.remove('border-dashed');
        
        // Faqat foydalanuvchi yangi rasm tanlaganda hisoblash
        if (!isReset) { 
            calculateCalories(); 
        }

    } else {
        imageFileName.textContent = '';
        imageFileName.classList.add('hidden');
        imageUploadText.classList.remove('hidden');
        imageUploadLabel.classList.remove('border-green-500', 'border-solid');
        imageUploadLabel.classList.add('border-dashed');
    }
}


// --- 4. TARIX VA STATISTIKA MANTIQI ---

function switchTab(tabName) {
    tabButtons.forEach(button => {
        if (button.dataset.tab === tabName) {
            button.classList.add('active');
            button.classList.remove('text-gray-500', 'dark:text-gray-400');
            button.classList.add('text-green-500');
        } else {
            button.classList.remove('active');
            button.classList.add('text-gray-500', 'dark:text-gray-400');
            button.classList.remove('text-green-500');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const contentElement = document.getElementById(`tabContent-${tabName}`);
    if (contentElement) contentElement.classList.remove('hidden');

    if (tabName === 'history') {
        loadHistoryData();
    } else if (tabName === 'stats') {
        loadStatsData();
    }
}
async function loadHistoryData() {
    if (!historyList) return; 
    
    showLoading("Tarix yuklanmoqda...");
    try {
        const result = await sendRequest(PROXY_DATA_URL, 'get_history', {});
        HISTORY_DATA = result.history;
        renderHistory(HISTORY_DATA);
        
        if (document.getElementById('tabStats')?.classList.contains('active')) {
            loadStatsData(); 
        }
    } catch (error) {
        showError("Tarixni yuklashda xato: " + error.message);
        HISTORY_DATA = [];
        renderHistory(HISTORY_DATA);
    } finally {
        hideLoading();
    }
}

// Tarixni chizish (Eng yangi kunlar yuqorida bo'lishi uchun tartiblandi)
function renderHistory(history) {
    if (!historyList) return;

    historyList.innerHTML = '';
    const emptyHistory = document.getElementById('emptyHistory');

    if (history.length === 0) {
        emptyHistory?.classList.remove('hidden');
        clearHistoryBtn?.classList.add('hidden');
        return;
    }
    
    emptyHistory?.classList.add('hidden');
    clearHistoryBtn?.classList.remove('hidden');

    // Sanalar bo'yicha guruhlash
    const groupedHistory = history.reduce((acc, item) => {
        const date = item.log_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});
    
    // Sanalarni yangisidan eskisi bo'yicha tartiblash
    const sortedDates = Object.keys(groupedHistory).sort().reverse(); 

    sortedDates.forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'mt-4 border-t pt-3 dark:border-gray-700';
        dateDiv.innerHTML = `<h4 class="font-semibold text-blue-500 mb-2">${date}</h4>`;
        
        // Har bir kundagi taomlarni chiqarish
        groupedHistory[date].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-center bg-gray-50 dark:bg-[#1f1f1f] p-3 rounded-lg border dark:border-gray-700 mb-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors';
            itemDiv.innerHTML = `
                <span class="text-gray-700 dark:text-gray-200">${item.food_name}</span>
                <span class="font-bold text-green-600">${item.calories.toFixed(1)} kcal <i class="fas fa-eye ml-2 text-sm text-gray-500"></i></span>
            `;
            
            itemDiv.addEventListener('click', () => showDetailModal(item));
            dateDiv.appendChild(itemDiv);
        });
        historyList.appendChild(dateDiv);
    });
}
async function clearHistory() {
    if (!confirm("Haqiqatan ham barcha tarixi ma'lumotlarini o'chirmoqchimisiz?")) return;

    showLoading("Tarix tozalanmoqda...");
    try {
        await sendRequest(PROXY_DATA_URL, 'clear_history', {});
        HISTORY_DATA = [];
        renderHistory(HISTORY_DATA);
        loadStatsData();
    } catch (error) {
        showError("Tarixni tozalashda xato: " + error.message);
    } finally {
        hideLoading();
    }
}


// --- 5. STATISTIKA MANTIQI (Bar Chart tartibi to'g'ri) ---
async function loadStatsData() {
    if (!statsBarContainer || !statsContent) return;
    
    if (HISTORY_DATA.length === 0) {
        // ... (Agar ma'lumot bo'lmasa, ogohlantirish ko'rsatish)
        return; 
    }
    
    // --- Kunlik kaloriyalarni hisoblash (Oxirgi 7 kun) ---
    const dailyCalories = {};
    const today = new Date();
    const dates = [];

    // Oxirgi 7 kun sanalarini tayyorlash (0-eng yangi, 6-eng eski)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; 
        dailyCalories[dateStr] = 0;
        dates.push({ 
            dateStr: dateStr, 
            day: d.toLocaleDateString('uz-UZ', { weekday: 'short' }) 
        }); 
    }

    // Tarixdagi ma'lumotlarni kunlar bo'yicha jamlash
    HISTORY_DATA.forEach(item => {
        if (dailyCalories.hasOwnProperty(item.log_date)) {
            dailyCalories[item.log_date] += item.calories;
        }
    });

    // --- Makroslarni hisoblash (O'rtacha 30 kun) ---
    const totalEntries = HISTORY_DATA.length;
    const totalProtein = HISTORY_DATA.reduce((sum, item) => sum + item.protein, 0);
    const totalFat = HISTORY_DATA.reduce((sum, item) => sum + item.fat, 0);
    const totalCarbs = HISTORY_DATA.reduce((sum, item) => sum + item.carbs, 0);

    if (totalEntries > 0) {
        avgProtein.textContent = `${(totalProtein / totalEntries).toFixed(1)}g`;
        avgFat.textContent = `${(totalFat / totalEntries).toFixed(1)}g`;
        avgCarbs.textContent = `${(totalCarbs / totalEntries).toFixed(1)}g`;
    } else {
        avgProtein.textContent = '0g';
        avgFat.textContent = '0g';
        avgCarbs.textContent = '0g';
    }


    // --- Bar Chartni chizish (Chapdan o'ngga: Eski kun -> Yangi kun) ---
    const maxCalorie = Math.max(...Object.values(dailyCalories), CALORIE_TARGET) * 1.1;

    statsBarContainer.innerHTML = '';
    
    // Maqsad chizig'i (Target Line)
    const targetHeightPercent = (CALORIE_TARGET / maxCalorie) * 100;
    const targetLine = document.createElement('div');
    targetLine.style.cssText = `
        position: absolute; 
        bottom: ${targetHeightPercent}%; 
        left: 0; 
        right: 0; 
        height: 1px; 
        background-color: #EF4444; 
        border-top: 1px dashed #EF4444; 
        z-index: 5;
    `;
    targetLine.innerHTML = `
        <span class="absolute right-0 top-[-20px] text-xs font-semibold text-red-500 bg-white dark:bg-[#121212] px-2 py-0.5 rounded-sm">
            ${CALORIE_TARGET} kcal (Maqsad)
        </span>
    `;
    statsBarContainer.appendChild(targetLine);
    
    // Bar ustunlarini yaratish (dates massivi eski kundan boshlanadi, shuning uchun tartib to'g'ri)
    dates.forEach(({ dateStr, day }) => {
        const calories = dailyCalories[dateStr];
        const heightPercent = (calories / maxCalorie) * 100;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center mx-1 h-full justify-end';
        wrapper.style.width = 'calc(100% / 7 - 5px)';

        const barItem = document.createElement('div');
        barItem.className = 'bar-item flex flex-col items-center justify-end w-full';
        barItem.style.height = `${heightPercent}%`;
        barItem.style.backgroundColor = calories > CALORIE_TARGET ? '#F59E0B' : '#10B981';
        barItem.style.borderRadius = '4px 4px 0 0';

        // Tooltip
        barItem.innerHTML = `
            <div class="bar-tooltip dark:bg-gray-800 dark:text-gray-100 p-2 rounded-lg text-center shadow-lg">
                <p class="font-bold">${calories.toFixed(0)} kcal</p>
                <p class="text-xs">${day} (${dateStr.substring(5)})</p>
            </div>
        `;
        
        const dayLabel = document.createElement('div');
        dayLabel.className = 'text-xs text-center mt-1 text-gray-600 dark:text-gray-400';
        dayLabel.textContent = day;

        wrapper.appendChild(barItem);
        wrapper.appendChild(dayLabel);
        
        statsBarContainer.appendChild(wrapper);
    });
}


// --- 6. MODAL FUNKSIYALARI ---

function showProfileModal() {
    profileModal.classList.remove('hidden');
    profileUsername.textContent = USER_DATA.username || 'Yuklanmoqda...';
    showProfileError(""); 
    showProfileSuccess("");
}
function hideProfileModal() {
    profileModal.classList.add('hidden');
}
function showDetailModal(item) {
    if (!detailModal || !document.getElementById('detailFoodName')) return;
    document.getElementById('detailFoodName').textContent = item.food_name;
    
    detailContent.innerHTML = `
        <div class="space-y-3">
            <p class="text-gray-500 dark:text-gray-400 text-sm">Sana: ${item.log_date}</p>
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <p class="text-sm font-semibold">Kaloriya:</p>
                    <p class="text-lg font-bold text-green-600">${item.calories.toFixed(1)} kcal</p>
                </div>
                <div class="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <p class="text-sm font-semibold">Protein:</p>
                    <p class="text-lg font-bold text-blue-600">${item.protein.toFixed(1)} g</p>
                </div>
                <div class="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                    <p class="text-sm font-semibold">Yog':</p>
                    <p class="text-lg font-bold text-yellow-600">${item.fat.toFixed(1)} g</p>
                </div>
                <div class="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <p class="text-sm font-semibold">Uglevod:</p>
                    <p class="text-lg font-bold text-green-600">${item.carbs.toFixed(1)} g</p>
                </div>
            </div>
            ${item.fiber ? 
            `<div class="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <p class="text-sm font-semibold">Kletchatka:</p>
                <p class="text-lg font-bold text-purple-600">${item.fiber.toFixed(1)} g</p>
            </div>` : ''}
        </div>
    `;
    detailModal.classList.remove('hidden');
}
function hideDetailModal() {
    detailModal.classList.add('hidden');
}

function setupPasswordChangeListener() {
    changePasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        
        if (!currentPassword || !newPassword) {
            showProfileError("Barcha maydonlarni to'ldiring.");
            return;
        }
        if (newPassword.length < 6) {
            showProfileError("Yangi parol kamida 6 belgidan iborat boʻlishi kerak.");
            return;
        }

        showLoading("Parol almashtirilmoqda...");
        try {
            const result = await sendRequest(PROXY_AUTH_URL, 'change_password', { 
                current_password: currentPassword, 
                new_password: newPassword 
            });
            showProfileSuccess(result.message);
            changePasswordForm.reset();
        } catch (error) { 
            showProfileError(error.message); 
        } finally { 
            hideLoading(); 
        }
    });
}


// --- 7. BOSHQA FUNKSIYALAR (CANVAS) ---

function setupFloatingBallsAnimation() {
    const canvas = document.getElementById('floatingBallsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const MAX_PARTICLES = 100;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 2 + 1;
            this.color = '#34D399';
            this.velocity = {
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5
            };
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            if (this.x + this.radius > width || this.x - this.radius < 0) {
                this.velocity.x = -this.velocity.x;
            }
            if (this.y + this.radius > height || this.y - this.radius < 0) {
                this.velocity.y = -this.velocity.y;
            }

            this.x += this.velocity.x;
            this.y += this.velocity.y;

            this.draw();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? 'rgba(0, 0, 0, 0.1)' : 'rgba(249, 250, 251, 0.1)';
        ctx.fillRect(0, 0, width, height); 

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    const lineAlpha = 1 - (distance / 100);
                    ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha * 0.3})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

    resizeCanvas();
    initParticles();
    animate();
}


// --- ILovani ishga tushirish ---
document.addEventListener('DOMContentLoaded', checkAuthAndRedirect);