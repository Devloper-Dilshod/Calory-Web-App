// ==========================================================
// CALORY WEB APP - ASOSIY JAVASCRIPT LOGIKASI (YAKUNIY VERSIYA)
// ==========================================================

const API_URL = 'api/';

// --- DOM elementlarini aniqlash ---
const authContainer = document.getElementById('authContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchRegisterBtn = document.getElementById('switchRegister');
const switchLoginBtn = document.getElementById('switchLogin');
const authError = document.getElementById('authError');
const authErrorMessage = document.getElementById('authErrorMessage');
const authSuccess = document.getElementById('authSuccess');
const authSuccessMessage = document.getElementById('authSuccessMessage');

const mainApp = document.getElementById('mainApp');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const profileBtn = document.getElementById('profileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnModal = document.getElementById('logoutBtnModal');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const changePasswordForm = document.getElementById('changePasswordForm');
const profileUsernameEl = document.getElementById('profileUsername');
const profileError = document.getElementById('profileError');
const profileErrorMessage = document.getElementById('profileErrorMessage');
const profileSuccess = document.getElementById('profileSuccess');
const profileSuccessMessage = document.getElementById('profileSuccessMessage');

const foodInput = document.getElementById('foodInput');
const imageUpload = document.getElementById('imageUpload');
const imageUploadText = document.getElementById('imageUploadText');
const imageFileName = document.getElementById('imageFileName');
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const emptyResult = document.getElementById('emptyResult');
const loadingDiv = document.getElementById('loading');
const loadingMessage = document.getElementById('loadingMessage');
const errorDiv = document.getElementById('errorDiv');
const errorMessageEl = document.getElementById('errorMessage');

const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const statsBarContainer = document.getElementById('statsBarContainer');
const avgProteinEl = document.getElementById('avgProtein');
const avgFatEl = document.getElementById('avgFat');
const avgCarbsEl = document.getElementById('avgCarbs');
const detailModal = document.getElementById('detailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const detailFoodName = document.getElementById('detailFoodName');
const detailContent = document.getElementById('detailContent');

let globalUserId = null;
let globalUsername = null;
let historyData = []; 

// --- Yordamchi Funksiyalar ---

function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

// 💥 LOADING FUNKSIYASI TUZATILDI
function showLoading(message = 'Hisoblanmoqda...') {
    if (loadingDiv && loadingMessage) {
        loadingMessage.textContent = message;
        loadingDiv.classList.remove('hidden');
    }
    if (searchBtn) {
        searchBtn.disabled = true;
    }
    // Ekranda natijani tozalash
    if (resultDiv) resultDiv.innerHTML = ''; 
    if (emptyResult) emptyResult.classList.remove('hidden'); 
}

function hideLoading() {
    if (loadingDiv) {
        loadingDiv.classList.add('hidden');
    }
    if (searchBtn) {
        searchBtn.disabled = false;
    }
}

function showError(message) {
    if (errorDiv && errorMessageEl) {
        errorMessageEl.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    } else {
        console.error("Xato: ", message);
    }
}

function showAuthMessage(type, message, isSuccess) {
    let el, msgEl;
    if (type === 'profile') {
        el = isSuccess ? profileSuccess : profileError;
        msgEl = isSuccess ? profileSuccessMessage : profileErrorMessage;
    } else { // login/register
        el = isSuccess ? authSuccess : authError;
        msgEl = isSuccess ? authSuccessMessage : authErrorMessage;
    }

    if (!el || !msgEl) return; 

    el.classList.add('hidden');
    setTimeout(() => {
        msgEl.textContent = message;
        el.classList.remove('hidden');
        
        if (type === 'profile') {
            setTimeout(() => {
                el.classList.add('hidden');
            }, 3000);
        }
    }, 50);
}

function resetAuthMessages() {
    if (authError) authError.classList.add('hidden');
    if (authSuccess) authSuccess.classList.add('hidden');
    if (profileError) profileError.classList.add('hidden');
    if (profileSuccess) profileSuccess.classList.add('hidden');
}

// ✅ safeFetch funksiyasi (body stream already read xatosi tuzatilgan)
async function safeFetch(endpoint, data) {
    const url = API_URL + endpoint;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // MUHIM: Javobni avval matn sifatida o'qish (faqat bir marta streamni iste'mol qiladi)
        const responseText = await response.text(); 
        let responseData;
        
        try {
            // Matnni JSON sifatida tahlil qilish
            responseData = JSON.parse(responseText); 
        } catch (e) {
            // Agar JSON tahlil qilmasa (ko'pincha server PHP xatosi bo'lganda)
            throw new Error(`Serverdan noto'g'ri javob keldi. Status: ${response.status}. PHP/DB xatosi: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok || responseData.success === false || responseData.error) {
            const errorMessage = responseData.message || responseData.error || `Xatolik status: ${response.status}`;
            throw new Error(errorMessage);
        }

        return responseData;

    } catch (error) {
        throw error;
    }
}


// --- Avtorizatsiya va Navigatsiya Mantiqi ---
function checkAuth() {
    const user = getStorage('user');
    
    if (mainApp && user && user.id && user.username) {
        globalUserId = user.id;
        globalUsername = user.username;
        initializeApp(user);
    } 
    else if (authContainer) {
        showAuthScreen();
    }
    else if (mainApp && (!user || !user.id)) {
        window.location.href = 'login.html';
    }
}

function showAuthScreen() {
    if (mainApp) mainApp.classList.add('hidden');
    if (authContainer) authContainer.classList.remove('hidden');
    resetAuthMessages();
    if (loginForm) loginForm.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
}

function showMainApp() {
    if (authContainer) authContainer.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    if (profileUsernameEl) profileUsernameEl.textContent = globalUsername;
    loadHistoryAndStats(); 
}

function logout() {
    localStorage.removeItem('user');
    globalUserId = null;
    globalUsername = null;
    window.location.href = 'login.html'; 
}


if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetAuthMessages();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        showLoading('Tizimga kirish...');
        try {
            const data = await safeFetch('auth.php', { action: 'login', username, password });
            
            showAuthMessage('login', data.message, true);
            const user = data.user;
            setStorage('user', user);
            globalUserId = user.id;
            globalUsername = user.username;
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            showAuthMessage('login', error.message, false);
        } finally {
            hideLoading();
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetAuthMessages();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;

        showLoading('Roʻyxatdan oʻtish...');
        try {
            if (password.length < 6) { 
                showAuthMessage('register', 'Parol kamida 6 belgidan iborat boʻlishi kerak.', false);
                return;
            }
            if (!username.trim()) {
                showAuthMessage('register', 'Foydalanuvchi nomi majburiy.', false);
                return;
            }

            const data = await safeFetch('auth.php', { action: 'register', username, password });
            
            showAuthMessage('register', data.message, true);
            const user = data.user;
            setStorage('user', user);
            globalUserId = user.id;
            globalUsername = user.username;
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            showAuthMessage('register', error.message, false);
        } finally {
            hideLoading();
        }
    });
}

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetAuthMessages();

        const current_password = document.getElementById('currentPassword').value;
        const new_password = document.getElementById('newPassword').value;

        if (new_password.length < 6) {
            showAuthMessage('profile', 'Yangi parol kamida 6 belgidan iborat boʻlishi kerak.', false);
            return;
        }

        showLoading('Parol yangilanmoqda...');
        try {
            const data = await safeFetch('auth.php', { 
                action: 'change_password', 
                user_id: globalUserId, 
                current_password, 
                new_password 
            });
            
            showAuthMessage('profile', data.message, true);
            changePasswordForm.reset();
            
        } catch (error) {
            showAuthMessage('profile', error.message, false);
        } finally {
            hideLoading();
        }
    });
}


// --- Asosiy Ilova Mantiqi (index.html) ---

if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
        const prompt = foodInput.value.trim();
        const imageFile = imageUpload.files[0];
        let imageData = null;

        if (prompt === '' && !imageFile) {
            showError("Iltimos, taom nomini kiriting yoki rasm yuklang.");
            return;
        }

        if (imageFile) {
            showLoading('Rasm yuklanmoqda...');
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = async () => {
                imageData = reader.result;
                await runCalculation(prompt, imageData);
            };
            reader.onerror = () => {
                showError('Rasm yuklashda xato.');
                hideLoading();
            };
        } else {
            await runCalculation(prompt, imageData);
        }
    });
}

async function runCalculation(prompt, imageData) {
    // 💥 Loader o'zgardi
    loadingMessage.textContent = imageData ? 'AI rasmni tahlil qilmoqda...' : 'AI maʼlumotlarni hisoblamoqda...';
    showLoading(loadingMessage.textContent);
    
    const fullPrompt = `Taom: "${prompt}". Agar rasm mavjud bo'lsa, uni hisobga ol. Faqat JSON formatida javob ber va boshqa hech qanday izoh qo'shma. JSON quyidagi tuzilishda bo'lishi kerak: 
    {
      "food_name": "Tahlil qilingan taom nomi (Masalan: 200g Plov)",
      "description": "Taom haqida qisqa tahlil (uzbek tilida, 30 so'zgacha).",
      "calories": 999,
      "protein": 50.0,
      "fat": 30.0,
      "carbs": 100.0,
      "fiber": 10.0
    }`;

    try {
        const data = await safeFetch('calculate.php', { prompt: fullPrompt, image_data: imageData });
        
        const jsonText = data.text;
        let aiResult;
        try {
            aiResult = JSON.parse(jsonText); 
        } catch (e) {
            showError(`AI dan kelgan javob JSON formatida emas. Server javobi: ${jsonText.substring(0, 100)}...`);
            return;
        }

        displayResult(aiResult);
        
        // 💥 Avtomatik saqlash
        await saveEntry(aiResult);
        
        if (foodInput) foodInput.value = '';
        if (imageUpload) imageUpload.value = ''; 
        if (imageFileName) imageFileName.classList.add('hidden');
        if (imageUploadText) imageUploadText.textContent = 'Rasm yuklang';

    } catch (error) {
        showError(error.message || 'Hisoblashda kutilmagan xato roʻy berdi.');
    } finally {
        hideLoading();
    }
}

// 💥 displayResult funksiyasi (Saqlash tugmasi olib tashlandi)
function displayResult(result) {
    if (emptyResult) emptyResult.classList.add('hidden');
    
    if (resultDiv) {
        resultDiv.innerHTML = `
            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">${result.food_name}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">${result.description}</p>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                    <p class="text-3xl font-extrabold text-green-700 dark:text-green-300">${Math.round(result.calories)}</p>
                    <p class="text-sm text-green-600 dark:text-green-400 font-semibold">Kaloriyalar (Kkal)</p>
                </div>
                <div class="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-center">
                    <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">${(result.protein || 0).toFixed(1)}g</p>
                    <p class="text-sm text-blue-600 dark:text-blue-400">Protein</p>
                </div>
                <div class="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-center">
                    <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">${(result.fat || 0).toFixed(1)}g</p>
                    <p class="text-sm text-yellow-600 dark:text-yellow-400">Yogʻ</p>
                </div>
                <div class="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-center">
                    <p class="text-2xl font-bold text-purple-700 dark:text-purple-300">${(result.carbs || 0).toFixed(1)}g</p>
                    <p class="text-sm text-purple-600 dark:text-purple-400">Uglevod</p>
                </div>
            </div>
            `;
    }
}

async function saveEntry(result) {
    if (!globalUserId) {
        showError("Ma'lumotni saqlash uchun tizimga kiring.");
        return;
    }
    
    try {
        const data = await safeFetch('data.php', {
            action: 'save_entry',
            user_id: globalUserId,
            food_name: result.food_name,
            calories: result.calories,
            protein: result.protein,
            fat: result.fat,
            carbs: result.carbs,
            fiber: result.fiber || 0 
        });
        
        // Saqlangandan keyin tarixni yangilash
        await loadHistoryAndStats(); 
        
    } catch (error) {
        showError(error.message || 'Saqlashda kutilmagan xato roʻy berdi.');
    }
}

async function loadHistoryAndStats() {
    if (!globalUserId) return;
    
    // Tarxni yangilayotganda loader chiqarmaymiz, chunki u natija uchun loader bilan konflikt qilishi mumkin
    try {
        const data = await safeFetch('data.php', {
            action: 'get_history',
            user_id: globalUserId
        });
        
        historyData = data.history || [];
        displayHistory(historyData);
        generateStats(historyData);
        
    } catch (error) {
        showError(error.message || 'Tarixni yuklashda xato roʻy berdi.');
    }
}

function displayHistory(history) {
    if (!historyList) return;
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        if (emptyHistory) emptyHistory.classList.remove('hidden');
        if (clearHistoryBtn) clearHistoryBtn.classList.add('hidden');
        return;
    }
    
    if (emptyHistory) emptyHistory.classList.add('hidden');
    if (clearHistoryBtn) clearHistoryBtn.classList.remove('hidden');
    
    const groupedHistory = history.reduce((acc, item) => {
        const date = item.log_date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {});
    
    for (const date in groupedHistory) {
        const dateHeader = document.createElement('h4');
        dateHeader.className = 'text-lg font-bold text-gray-700 dark:text-gray-200 mt-4 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1';
        dateHeader.textContent = formatDate(date);
        historyList.appendChild(dateHeader);

        groupedHistory[date].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors';
            itemDiv.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800 dark:text-gray-100">${item.food_name}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${item.calories.toFixed(0)} Kkal</p>
                </div>
                <button class="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium view-details" data-id="${item.id}">
                    Batafsil <i class="fas fa-chevron-right text-xs ml-1"></i>
                </button>
            `;
            historyList.appendChild(itemDiv);
        });
    }
    
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = history.find(i => i.id === itemId);
            if (item) {
                showDetailModal(item);
            }
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
        return 'Bugun';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
        return 'Kecha';
    } else {
        return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

function showDetailModal(item) {
    if (!detailModal || !detailFoodName || !detailContent) return;
    
    detailFoodName.textContent = item.food_name;
    detailContent.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between border-b pb-1">
                <span class="font-semibold text-gray-600 dark:text-gray-300">Sana:</span>
                <span class="font-bold text-green-500">${formatDate(item.log_date)}</span>
            </div>
            <div class="flex justify-between border-b pb-1">
                <span class="font-semibold text-gray-600 dark:text-gray-300">Kaloriyalar:</span>
                <span class="font-bold text-green-500">${item.calories.toFixed(0)} Kkal</span>
            </div>
            <div class="flex justify-between border-b pb-1">
                <span class="font-semibold text-gray-600 dark:text-gray-300">Protein:</span>
                <span class="font-bold">${item.protein.toFixed(1)}g</span>
            </div>
            <div class="flex justify-between border-b pb-1">
                <span class="font-semibold text-gray-600 dark:text-gray-300">Yogʻ:</span>
                <span class="font-bold">${item.fat.toFixed(1)}g</span>
            </div>
            <div class="flex justify-between border-b pb-1">
                <span class="font-semibold text-gray-600 dark:text-gray-300">Uglevod:</span>
                <span class="font-bold">${item.carbs.toFixed(1)}g</span>
            </div>
            <div class="flex justify-between">
                <span class="font-semibold text-gray-600 dark:text-gray-300">Kletchatka:</span>
                <span class="font-bold">${item.fiber.toFixed(1)}g</span>
            </div>
        </div>
    `;
    detailModal.classList.remove('hidden');
}

if (closeDetailModal) {
    closeDetailModal.addEventListener('click', () => {
        detailModal.classList.add('hidden');
    });
}


if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
        if (!confirm("Haqiqatan ham barcha tarixi ma'lumotlarini o'chirmoqchimisiz?")) {
            return;
        }
        if (!globalUserId) {
            showError("Ma'lumotni tozalash uchun tizimga kiring.");
            return;
        }

        showLoading('Tarix tozalanmoqda...');
        try {
            const data = await safeFetch('data.php', {
                action: 'clear_history',
                user_id: globalUserId
            });
            
            showError(data.message);
            await loadHistoryAndStats(); 
            
        } catch (error) {
            showError(error.message || 'Tarixni tozalashda xato roʻy berdi.');
        } finally {
            hideLoading();
        }
    });
}

function generateStats(history) {
    if (!statsBarContainer) return;

    if (!history.length) {
        statsBarContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-10 w-full">Statistikani koʻrish uchun kiritma boʻlishi kerak.</p>';
        if (avgProteinEl) avgProteinEl.textContent = '0g';
        if (avgFatEl) avgFatEl.textContent = '0g';
        if (avgCarbsEl) avgCarbsEl.textContent = '0g';
        return;
    }

    const dailyTotals = history.reduce((acc, item) => {
        const date = item.log_date;
        acc[date] = (acc[date] || 0) + item.calories;
        return acc;
    }, {});
    
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push({
            date: dateStr,
            calories: dailyTotals[dateStr] || 0
        });
    }

    drawBarChart(last7Days);

    const thirtyDaysHistory = history.filter(item => {
        const itemDate = new Date(item.log_date);
        const diffTime = Math.abs(today - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; 
    });
    
    if (thirtyDaysHistory.length > 0) {
        const totalProtein = thirtyDaysHistory.reduce((sum, item) => sum + item.protein, 0);
        const totalFat = thirtyDaysHistory.reduce((sum, item) => sum + item.fat, 0); 
        const totalCarbs = thirtyDaysHistory.reduce((sum, item) => sum + item.carbs, 0); 
        
        const uniqueDays = new Set(thirtyDaysHistory.map(item => item.log_date)).size;

        if (avgProteinEl) avgProteinEl.textContent = `${(totalProtein / uniqueDays).toFixed(1)}g`;
        if (avgFatEl) avgFatEl.textContent = `${(totalFat / uniqueDays).toFixed(1)}g`;
        if (avgCarbsEl) avgCarbsEl.textContent = `${(totalCarbs / uniqueDays).toFixed(1)}g`;
    } else {
        if (avgProteinEl) avgProteinEl.textContent = '0g';
        if (avgFatEl) avgFatEl.textContent = '0g';
        if (avgCarbsEl) avgCarbsEl.textContent = '0g';
    }
}

function drawBarChart(data) {
    if (!statsBarContainer) return;
    statsBarContainer.innerHTML = '';
    const maxCalories = Math.max(...data.map(d => d.calories), 1000); 
    const maxBarHeight = 250; 
    
    data.forEach(day => {
        const height = (day.calories / maxCalories) * maxBarHeight;
        const barItem = document.createElement('div');
        barItem.className = 'bar-item bg-green-500 hover:bg-green-600 rounded-t-lg mx-1 relative';
        barItem.style.height = `${Math.max(height, 5)}px`; 
        barItem.style.width = '12.5%';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'bar-tooltip';
        tooltip.textContent = `${formatDateShort(day.date)}: ${day.calories.toFixed(0)} Kkal`;
        
        barItem.appendChild(tooltip);
        statsBarContainer.appendChild(barItem);
    });
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}


// --- UI Eventlar (Boshqa funksiyalar) ---

if (imageUpload) {
    imageUpload.addEventListener('change', () => {
        if (imageUpload.files.length > 0) {
            if (imageUploadText) imageUploadText.textContent = 'Rasm tanlandi';
            if (imageFileName) {
                imageFileName.textContent = imageUpload.files[0].name;
                imageFileName.classList.remove('hidden');
            }
        } else {
            if (imageUploadText) imageUploadText.textContent = 'Rasm yuklang';
            if (imageFileName) imageFileName.classList.add('hidden');
        }
    });
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        tabButtons.forEach(btn => btn.classList.remove('active', 'text-green-500', 'text-gray-500', 'dark:text-gray-400'));
        tabContents.forEach(content => content.classList.add('hidden'));

        button.classList.add('active', 'text-green-500');
        button.classList.remove('text-gray-500', 'dark:text-gray-400');
        
        const targetContent = document.getElementById(`tabContent-${targetTab}`);
        if (targetContent) targetContent.classList.remove('hidden');
        
        if ((targetTab === 'history' || targetTab === 'stats') && globalUserId) {
             loadHistoryAndStats();
        }
    });
});

if (switchRegisterBtn && loginForm && registerForm) {
    switchRegisterBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        resetAuthMessages();
    });
}

if (switchLoginBtn && loginForm && registerForm) {
    switchLoginBtn.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        resetAuthMessages();
    });
}

if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        if (profileModal) profileModal.classList.remove('hidden');
        resetAuthMessages(); 
    });
}

if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => {
        if (profileModal) profileModal.classList.add('hidden');
        if (changePasswordForm) changePasswordForm.reset();
    });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);
if (logoutBtnModal) logoutBtnModal.addEventListener('click', logout);

document.querySelectorAll('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-password-toggle');
        const targetInput = document.getElementById(targetId);
        const icon = e.currentTarget.querySelector('i');
        
        if (targetInput && icon) {
             if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.add('fa-eye');
                icon.classList.remove('fa-eye-slash');
            }
        }
    });
});


// --- Dark Mode Mantiqi ---
function setDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
        setStorage('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        if (themeIcon) {
            themeIcon.classList.add('fa-moon');
            themeIcon.classList.remove('fa-sun');
        }
        setStorage('theme', 'light');
    }
}

function initTheme() {
    const savedTheme = getStorage('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        setDarkMode(!isDark);
    });
}

// --- Animatsiya (login.html uchun) ---
const canvas = document.getElementById('floatingBallsCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });

    class Ball {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 5 + 2;
            this.vx = Math.random() * 0.5 - 0.25;
            this.vy = Math.random() * 0.5 - 0.25;
            this.color = 'rgba(16, 185, 129, 0.5)';
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            this.draw();
        }
    }

    let balls = [];
    for (let i = 0; i < 30; i++) { 
        balls.push(new Ball());
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);
        
        balls.forEach(ball => {
            ball.update();
        });
    }
    animate();
}


// --- Boshlash ---

function initializeApp(user) {
    if (mainApp && user) {
        showMainApp();
    } 
    else if (authContainer && user) {
        window.location.href = 'index.html';
    }
    else if (authContainer && !user) {
        showAuthScreen();
    }
    else if (mainApp && !user) {
         window.location.href = 'login.html';
    }
}

window.onload = () => {
    initTheme(); 
    checkAuth();
};