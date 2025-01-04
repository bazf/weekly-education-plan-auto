// js/app.js

/****************************************************
 * CHECK AUTH ON PAGE LOAD
 ****************************************************/
(function checkAuth() {
    if (typeof isAuthValid === 'function' && !isAuthValid()) {
        window.location.href = 'index.html';
    }
})();

/****************************************************
 * DOMContentLoaded logic
 ****************************************************/
document.addEventListener('DOMContentLoaded', function () {
    initYearMonthSelections();
    restoreApiKey();
    restoreSelectedModel();
    restoreUseAI();
    restoreGeneratedTables();

    // Make sure new changes to API key are saved
    const apiKeyInput = document.getElementById('apiKeyInput');
    apiKeyInput.addEventListener('input', function () {
        localStorage.setItem('geminiApiKey', this.value);
        checkAutoFillAvailability();
    });

    // Restore skip filled checkbox state
    const skipFilledCheck = document.getElementById('skipFilledCheck');
    skipFilledCheck.checked = localStorage.getItem('skipFilled') === 'true';

    // Save skip filled checkbox state on change
    skipFilledCheck.addEventListener('change', function () {
        localStorage.setItem('skipFilled', this.checked);
    });

    // Keep "Clear All" checkbox in sync
    updateClearApiKeyCheckbox();
    updateGenerateButtonState();
    checkAutoFillAvailability();
});


/****************************************************
 * RESTORE UI / LOCALSTORAGE
 ****************************************************/
function initYearMonthSelections() {
    if (!localStorage.getItem('selectedYear') || !localStorage.getItem('selectedMonth')) {
        setDefaultNextMonth();
    }
    const savedSelectedYear = localStorage.getItem('selectedYear');
    const savedSelectedMonth = localStorage.getItem('selectedMonth');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');

    if (savedSelectedYear) {
        yearSelect.value = savedSelectedYear;
    }
    if (savedSelectedMonth) {
        monthSelect.value = savedSelectedMonth;
    }
}

function setDefaultNextMonth() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');

    const nextYear = nextMonth.getFullYear().toString();
    if (yearSelect.querySelector(`option[value="${nextYear}"]`)) {
        yearSelect.value = nextYear;
    }

    const nextMonthNumber = (nextMonth.getMonth() + 1).toString();
    if (monthSelect.querySelector(`option[value="${nextMonthNumber}"]`)) {
        monthSelect.value = nextMonthNumber;
    }

    localStorage.setItem('selectedYear', nextYear);
    localStorage.setItem('selectedMonth', nextMonthNumber);
}

function restoreApiKey() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        document.getElementById('apiKeyInput').value = savedApiKey;
    }
}

function restoreSelectedModel() {
    const savedModel = localStorage.getItem('selectedModel');
    const useModelsCheck = document.getElementById('useModelsCheck');
    const modelSelectContainer = document.getElementById('modelSelectContainer');
    const modelSelect = document.getElementById('modelSelect');

    if (!savedModel) {
        localStorage.setItem('selectedModel', 'optimal');
        useModelsCheck.checked = false;
        modelSelectContainer.style.display = "none";
        modelSelect.value = 'optimal';
    } else {
        if (savedModel !== 'optimal') {
            useModelsCheck.checked = true;
            modelSelectContainer.style.display = "block";
            modelSelect.value = savedModel;
        } else {
            useModelsCheck.checked = false;
            modelSelectContainer.style.display = "none";
            modelSelect.value = 'optimal';
        }
    }
}

function restoreUseAI() {
    const savedUseAICheck = localStorage.getItem('useAICheck');
    const useAICheck = document.getElementById('useAICheck');
    const aiAutofillSection = document.getElementById('aiAutofillSection');

    if (savedUseAICheck === 'true') {
        useAICheck.checked = savedUseAICheck === 'true';
        aiAutofillSection.style.display = 'block';
    } else {
        useAICheck.checked = false;
        aiAutofillSection.style.display = 'none';
    }
}

function restoreGeneratedTables() {
    const savedPages = localStorage.getItem('allGeneratedPages');
    if (savedPages) {
        document.querySelector('.overflow-x-auto').insertAdjacentHTML('beforeend', savedPages);
        reattachTableHandlers?.();
        reattachThemeInputHandlers?.();
        updateRegenerateButtonsState?.();
    }
}

/****************************************************
 * CLEAR ALL / DELETE API KEY
 ****************************************************/
const btnClearAll = document.getElementById('btnClearAll');
const clearApiKeyCheck = document.getElementById('clearApiKeyCheck');
btnClearAll.addEventListener('click', function () {
    if (confirm("Ви впевнені, що хочете видалити всі дані та перезавантажити сторінку?")) {
        const authData = localStorage.getItem('authData');
        const apiKey = localStorage.getItem('geminiApiKey');

        localStorage.clear();

        if (!clearApiKeyCheck.checked && apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
        }
        if (authData) {
            localStorage.setItem('authData', authData);
        }
        window.location.reload();
    }
});

function updateClearApiKeyCheckbox() {
    const apiKey = localStorage.getItem('geminiApiKey');
    clearApiKeyCheck.disabled = !apiKey;
    if (!apiKey) {
        clearApiKeyCheck.checked = false;
    }
}

/****************************************************
 * GENERATE (OR RE-GENERATE) WEEK TABLES
 ****************************************************/
const generateWeeksBtn = document.getElementById('generateWeeksBtn');
generateWeeksBtn.addEventListener('click', () => {
    const yearSelect = document.getElementById('yearSelect').value;
    const monthSelect = document.getElementById('monthSelect').value;

    if (!yearSelect || !monthSelect) {
        showModal?.('Будь ласка, оберіть рік та місяць!');
        return;
    }

    localStorage.setItem('selectedYear', yearSelect);
    localStorage.setItem('selectedMonth', monthSelect);

    // Clear existing
    document.querySelectorAll('.page').forEach(page => page.remove());
    localStorage.removeItem('allGeneratedPages');

    const year = parseInt(yearSelect, 10);
    const monthIndex = parseInt(monthSelect, 10) - 1;
    const weeks = getWorkingWeeksOfMonth(year, monthIndex);
    if (weeks.length === 0) {
        showModal?.('У цьому місяці немає робочих днів (за логікою getWorkingWeeksOfMonth).');
        return;
    }

    const tableContainer = document.querySelector('.overflow-x-auto');

    weeks.forEach((daysArray, index) => {
        const weekNumber = index + 1;
        const firstDateStr = formatDateDDMM(daysArray[0]);
        const lastDateStr = formatDateDDMM(daysArray[daysArray.length - 1]);

        const pageDiv = document.createElement('div');
        pageDiv.classList.add('page', 'mb-8');

        const header = document.createElement('h2');
        header.classList.add('text-lg', 'font-semibold', 'mb-4');
        header.innerHTML = `
        Тиждень ${weekNumber} (${firstDateStr} – ${lastDateStr}).
        <div class="mt-2">
            <label class="inline-flex items-center">
                <div class="week-theme-container cell-content-wrapper">
                    <span>Тема тижня:</span>
                    <input type="text" class="week-theme-input border rounded-md ml-2 py-1 px-2" placeholder="Вкажіть тему тижня">
                    <button class="regenerate-btn" data-type="week-theme" title="Згенерувати нову тему тижня">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </label>
        </div>
      `;
        pageDiv.appendChild(header);

        const noPrintDiv = document.createElement('div');
        noPrintDiv.classList.add('no-print', 'grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-4', 'mb-4');

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.classList.add(
            'editBtn', 'w-full', 'md:col-span-1', 'bg-yellow-500', 'hover:bg-yellow-600',
            'text-white', 'px-4', 'py-2', 'rounded', 'flex', 'items-center', 'justify-center', 'space-x-2'
        );
        editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        <span>Редагувати таблицю власноруч</span>
      `;

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.classList.add(
            'saveBtn', 'w-full', 'md:col-span-1', 'bg-green-500', 'hover:bg-green-600',
            'text-white', 'px-4', 'py-2', 'rounded', 'flex', 'items-center', 'justify-center', 'space-x-2'
        );
        saveBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
        </svg>
        <span>Зберегти ручні зміни таблиці</span>
      `;

        const tableId = `weekTable${weekNumber}`;
        editBtn.setAttribute('data-table', tableId);
        saveBtn.setAttribute('data-table', tableId);
        noPrintDiv.appendChild(editBtn);
        noPrintDiv.appendChild(saveBtn);
        pageDiv.appendChild(noPrintDiv);

        // Create table
        const table = document.createElement('table');
        table.id = tableId;
        table.classList.add('min-w-full', 'bg-white', 'shadow-md', 'rounded', 'overflow-hidden');
        table.innerHTML = `
        <thead>
            <tr>
                <th class="px-4 py-2">Дні тижня (Тема дня)</th>
                <th class="px-4 py-2">Освітня лінія «Особистість дитини»</th>
                <th class="px-4 py-2">Освітня лінія «Дитина в соціумі»</th>
                <th class="px-4 py-2">Освітня лінія «Дитина в природному довкіллі»</th>
                <th class="px-4 py-2">Освітня лінія «Дитина у світі культури»</th>
                <th class="px-4 py-2">Освітня лінія «Мовлення дитини»</th>
                <th class="px-4 py-2">Освітня лінія «Дитина в сенсорно-математичному просторі»</th>
                <th class="px-4 py-2">Освітня лінія «Гра дитини»</th>
            </tr>
        </thead>
        <tbody></tbody>
      `;

        daysArray.forEach(dayDate => {
            const ddMM = formatDateDDMM(dayDate);
            const dayOfWeekName = getDayNameUkr(dayDate.getDay());

            const row = document.createElement('tr');
            row.innerHTML = `
          <td class="border px-4 py-2">
              <strong>${ddMM} (${dayOfWeekName})</strong>
              <br>
              <div class="week-theme-container cell-content-wrapper">
                  <span>Тема дня:</span>
                  <input type="text" class="day-theme-input border rounded-md mt-1 py-1 px-2" placeholder="Вкажіть тему дня">
                  <button class="regenerate-btn" data-type="day-theme" title="Згенерувати нову тему дня">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                      </svg>
                  </button>
              </div>
          </td>
        `;
            // 7 columns for the 7 educational lines
            for (let i = 1; i <= 7; i++) {
                row.innerHTML += `
            <td class="border px-4 py-2">
                <div class="flex justify-between items-start">
                    <span class="flex-grow"></span>
                    <button class="regenerate-btn flex-shrink-0" data-type="activity" data-line="${i}" title="Згенерувати нову активність">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </td>
          `;
            }
            table.querySelector('tbody').appendChild(row);
        });

        pageDiv.appendChild(table);
        tableContainer.appendChild(pageDiv);
    });

    // Re-enable AI usage if needed
    const useAICheck = document.getElementById('useAICheck');
    useAICheck.disabled = false;

    // Reattach events
    reattachTableHandlers?.();
    reattachThemeInputHandlers?.();
    updateRegenerateButtonsState?.();

    saveGeneratedPages();
    checkAutoFillAvailability?.();
    updateGenerateButtonState();
    updateRegenerateButtonsState?.();
});

/****************************************************
 * UPDATE GENERATE BUTTON STATE
 ****************************************************/
function updateGenerateButtonState() {
    const hasGeneratedTables = document.querySelectorAll('.page').length > 0;
    if (hasGeneratedTables) {
        generateWeeksBtn.textContent = 'Створити порожні таблиці для обраного місяця (існуючі перетруться)';
        generateWeeksBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        generateWeeksBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
    } else {
        generateWeeksBtn.textContent = 'Створити порожні таблиці для обраного місяця';
        generateWeeksBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
        generateWeeksBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
}

/****************************************************
 * AI CHECKBOX & MODEL CHECKBOX
 ****************************************************/
const useAICheck = document.getElementById('useAICheck');
const aiAutofillSection = document.getElementById('aiAutofillSection');
useAICheck.addEventListener('change', function () {
    const hasGeneratedTables = document.querySelectorAll('.page').length > 0;

    if (!hasGeneratedTables) {
        this.checked = false;
        showModal?.('Спочатку створіть таблиці!', 'Увага');
        return;
    }

    aiAutofillSection.style.display = this.checked ? 'block' : 'none';
    localStorage.setItem('useAICheck', this.checked);
    setTimeout(() => {
        checkAutoFillAvailability?.();
    }, 0);
});

const useModelsCheck = document.getElementById('useModelsCheck');
const modelSelectContainer = document.getElementById('modelSelectContainer');
const modelSelect = document.getElementById('modelSelect');
useModelsCheck.addEventListener('change', function () {
    if (this.checked) {
        modelSelectContainer.style.display = 'block';
    } else {
        modelSelectContainer.style.display = 'none';
        modelSelect.value = 'optimal';
        localStorage.setItem('selectedModel', 'optimal');
    }
});
modelSelect.addEventListener('change', function () {
    localStorage.setItem('selectedModel', this.value);
});

/****************************************************
 * AUTO FILL BUTTONS
 ****************************************************/
// #1 Auto-fill WEEK THEMES
const autoFillWeekThemesBtn = document.getElementById('autoFillWeekThemesBtn');
autoFillWeekThemesBtn.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        showModal?.('API ключ не знайдено! Спочатку збережіть ключ.', 'Помилка');
        return;
    }
    const yearSelect = document.getElementById('yearSelect').value;
    const monthSelect = document.getElementById('monthSelect').value;
    if (!yearSelect || !monthSelect) {
        showModal?.('Спочатку оберіть рік та місяць!', 'Увага');
        return;
    }

    disableAllButtons();
    showSpinner();

    const year = parseInt(yearSelect, 10);
    const monthIndex = parseInt(monthSelect, 10) - 1;
    const monthName = monthNamesUkr[monthIndex] || "";
    const pages = document.querySelectorAll('.page');
    const howManyWeeks = pages.length;
    if (howManyWeeks === 0) {
        showModal?.("Спочатку створіть тижні!");
        hideSpinner();
        enableAllButtons();
        return;
    }

    const promptText = `
Будь ласка, запропонуй ${howManyWeeks} актуальних тем для тижнів у дитячому садочку в Україні 
на поточний період: ${monthName} ${year}. 
- Кожну тему подай з нового рядка. Надай тільки теми. Теми не повнинні містити назву дня тижня чи порядковий номер.
- Теми мають бути креативними, але враховувати і свіввідноситися до сезону і поточного місяця та враховувати особливості виховання дітей дошкільного віку.
- Якщо в тижні є державне свято України чи велике міжнародне свято, будь ласка, врахуй його при формуванні теми тижня, але не зазначай факт врахування у назві.
Свята повинні відповідати Григоріанському календарю, наприклад: правильно коли Різдво Христове тільки 25 грудня, а неправильно, коли 7 січня; Правильно, коли день Святого Миколая тільки 6 грудня, а неправильно, коли 19 грудня; тощо.).
- Не використовую зимових персонажів для тем у невідповідні їм місяці (як от Святого Миколая).
- Не використовуй персонажів Діда Мороза чи Снігуроньки коли вимагає тема, замінюй Святим Миколаєм.
Надай лише список тем, без нумерації, без коментарів.
            `.trim();

    try {
        const selectedModel = getSelectedModel('weekThemes');
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Помилка від API: ${response.status}`);
        }
        const data = await response.json();
        let generatedText = data.candidates[0].content.parts.at(-1).text || "";

        const lines = generatedText
            .split(/\r?\n/)
            .map(l => l.replace(/^\d+\)\s*/, '').trim())
            .filter(Boolean);

        const weekInputs = document.querySelectorAll('.week-theme-input');
        const skipFilled = document.getElementById('skipFilledCheck').checked;

        for (let i = 0; i < weekInputs.length; i++) {
            if (i < lines.length) {
                // Skip if checkbox is checked and input already has content
                if (skipFilled && weekInputs[i].value.trim()) {
                    continue;
                }
                weekInputs[i].value = lines[i].replace(/^[\*\"]|[\*\"]$/g, '').trim();
            }
        }

        saveGeneratedPages();
        showModal?.("Автозаповнення тем тижнів завершено!");
    } catch (error) {
        console.error(error);
        showModal?.("Не вдалося отримати дані від Gemini API: " + error.message);
    } finally {
        hideSpinner();
        enableAllButtons();
        updateRegenerateButtonsState?.();
    }
});

/****************************************************
* #2 AUTO-FILL DAY THEMES (WITH WEEK THEME)
****************************************************/
const autoFillDayThemesBtn = document.getElementById('autoFillDayThemesBtn');
autoFillDayThemesBtn.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        showModal('API ключ не знайдено! Спочатку збережіть ключ.');
        return;
    }

    const yearSelect = document.getElementById('yearSelect').value;
    const monthSelect = document.getElementById('monthSelect').value;
    if (!yearSelect || !monthSelect) {
        showModal('Спочатку оберіть рік та місяць!');
        return;
    }

    disableAllButtons();
    showSpinner();

    const year = parseInt(yearSelect, 10);
    const monthIndex = parseInt(monthSelect, 10) - 1;
    const monthName = monthNamesUkr[monthIndex] || "";

    try {
        // Get all "pages" (weeks)
        const pages = document.querySelectorAll('.page');
        if (pages.length === 0) {
            showModal("Немає створених тижнів для автозаповнення!");
            hideSpinner();
            enableAllButtons();
            return;
        }


        const skipFilled = document.getElementById('skipFilledCheck').checked;

        // For each page (week), build and send a separate prompt that includes the week's theme
        for (let page of pages) {
            // 1) Find the week theme input for this week
            const weekThemeInput = page.querySelector('.week-theme-input');
            const weekTheme = (weekThemeInput?.value || "").trim();

            // 2) Collect all day data for this week only
            const table = page.querySelector('table');
            if (!table) continue;
            const rows = table.querySelectorAll('tr');

            const dayData = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const dayCell = row.querySelector('td');
                const strong = dayCell?.querySelector('strong');
                const dayInput = row.querySelector('.day-theme-input');
                if (!strong || !dayInput) continue;

                const dateAndDayText = strong.textContent.trim();
                dayData.push({
                    dateAndDay: dateAndDayText,
                    dayInput: dayInput
                });
            }

            if (dayData.length === 0) {
                // No working days in this week? Skip
                continue;
            }

            if (skipFilled) {
                const allDaysFilled = dayData.every(item => item.dayInput.value.trim());
                if (allDaysFilled) {
                    console.log('Skipping day themes generation - all days already filled');
                    continue;
                }
            }

            // 3) Build a prompt that references the week theme
            const howManyDays = dayData.length;
            const datesList = dayData.map(item => item.dateAndDay);

            const promptText = `
Будь ласка, запропонуй ${howManyDays} різних, актуальних тем днів 
для дитячого садочка (період: ${monthName} ${year}, українською мовою), 
з огляду на те, що в Україні можуть бути офіційні державні свята та великі сучасні свята. 
Свята повинні відповідати Григоріанському календарю, наприклад: правильно коли Різдво Христове тільки 25 грудня, а неправильно, коли 7 січня; Правильно, коли день Святого Миколая тільки 6 грудня, а неправильно, коли 19 грудня; тощо.).
Не використовуй персонажів Діда Мороза чи Снігуроньки коли вимагає тема, замінюй Святим Миколаєм.
Якщо свято випадає на вихідний, можна перенести тему на найближчий робочий день.
Деякі теми днів повинні співвідноситися з темою тижня: "${weekTheme}, а інші можуть бути більш різноманітними, якщо немає свята на цей день."
Подай відповідь у вигляді простого списку тем, кожна тема з нового рядка, без нумерації.

Ось дати та дні тижня для контексту:
${datesList.join('\n')}
            `.trim();

            // 4) Send the request for just this week
            const selectedModel = getSelectedModel('dayThemes');
            const requestBody = {
                contents: [{
                    parts: [{ text: promptText }]
                }]
            };

            let themes = [];
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    }
                );

                if (!response.ok) {
                    throw new Error(`Помилка від API: ${response.status}`);
                }
                const data = await response.json();

                // Attempt JSON parse first
                try {
                    const responseText = data.candidates[0].content.parts[0].text;
                    const parsedResponse = JSON.parse(responseText);
                    themes = parsedResponse.response || [];
                } catch (e) {
                    // Fallback: split lines
                    const generatedText = data.candidates[0].content.parts.at(-1).text || "";
                    themes = generatedText
                        .split(/\r?\n/)
                        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
                        .filter(Boolean);
                }

                const skipFilled = document.getElementById('skipFilledCheck').checked;

                for (let i = 0; i < dayData.length; i++) {
                    if (i < themes.length) {
                        if (skipFilled && dayData[i].dayInput.value.trim()) {
                            continue;
                        }
                        dayData[i].dayInput.value = themes[i].replace(/^["*]|["*]$/g, '').trim();
                    }
                }
            } catch (error) {
                console.error(error);
                showModal("Не вдалося отримати дані від Gemini API: " + error.message);
                // Go on to next week (page)
            }
        } // end for each page

        // After all weeks
        saveGeneratedPages();
        showModal("Автозаповнення тем днів із урахуванням теми тижня завершено!");
    } catch (error) {
        console.error(error);
        showModal("Не вдалося отримати дані від Gemini API: " + error.message);
    } finally {
        hideSpinner();
        enableAllButtons();
        updateRegenerateButtonsState();
    }
});

/****************************************************
 * #3 AUTO-FILL ACTIVITIES
 ****************************************************/
const autoFillBtn = document.getElementById('autoFillBtn');
autoFillBtn.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        showModal('API ключ не знайдено! Спочатку збережіть ключ.');
        return;
    }

    const yearSelect = document.getElementById('yearSelect').value;
    const monthSelect = document.getElementById('monthSelect').value;
    if (!yearSelect || !monthSelect) {
        showModal('Спочатку оберіть рік та місяць!');
        return;
    }

    disableAllButtons();
    showSpinner();

    const year = parseInt(yearSelect, 10);
    const monthIndex = parseInt(monthSelect, 10) - 1;
    const monthName = monthNamesUkr[monthIndex] || "";

    try {
        // Check if we should skip this table when checkbox is checked
        const skipFilled = document.getElementById('skipFilledCheck').checked;

        // For each "page" = one week
        const pages = document.querySelectorAll('.page');
        for (let page of pages) {
            // Week theme
            const weekThemeInput = page.querySelector('.week-theme-input');
            if (!weekThemeInput) continue;
            const weekTheme = weekThemeInput.value.trim();
            if (!weekTheme) continue;

            // Table & rows
            const table = page.querySelector('table');
            if (!table) continue;
            const rows = table.querySelectorAll('tr');

            // Gather day themes from each row
            const dayData = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const dayThemeInput = row.querySelector('.day-theme-input');
                if (!dayThemeInput) continue;
                const dayCell = row.querySelector('td');
                const strong = dayCell.querySelector('strong');
                const dayText = strong ? strong.textContent.trim() : '';
                dayData.push({
                    dateAndDay: dayText,
                    dayTheme: dayThemeInput.value.trim()
                });
            }

            if (skipFilled) {
                // Check all activity cells in this table
                const allCellsFilled = Array.from(table.querySelectorAll('tbody tr')).every(row => {
                    return Array.from(row.querySelectorAll('td')).slice(1).every(td => {
                        const span = td.querySelector('span');
                        return span && span.textContent.trim();
                    });
                });

                if (allCellsFilled) {
                    console.log('Skipping activities generation - all cells already filled');
                    continue; // Skip to next page/week
                }
            }

            // Build a JSON-like object for context
            const promptObj = {
                weekTheme: weekTheme,
                days: dayData
            };

            // The prompt text
            const promptText = `
Будь ласка, згенеруй план занять для дитячого садочка в Україні на тиждень (період: ${monthName} ${year}) 
за темою "${promptObj.weekTheme}". 
Для кожного дня потрібно 7 активностей, що відповідають освітнім лініям:
1. «Особистість дитини»
2. «Дитина в соціумі»
3. «Дитина в природному довкіллі»
4. «Дитина у світі культури»
5. «Мовлення дитини»
6. «Дитина в сенсорно-математичному просторі»
7. «Гра дитини»

Активності мають враховувати:
- Пору року та державні свята України, як Пасха чи інші свята, міжнародні значні дати, як День чаю чи День дитини, або інші тобі відомі.
- Відповідність Григоріанському календарю, наприклад: правильно коли Різдво Христове тільки 25 грудня, а неправильно, коли 7 січня; Правильно, коли день Святого Миколая тільки 6 грудня, а неправильно, коли 19 грудня; тощо.).
- Не використовуй персонажів Діда Мороза чи Снігуроньки коли вимагає активність, замінюй Святим Миколаєм.
- Можеш використовувати інших відомих міжнародних персонажів.
- Активності повинні бути короткими, цікавими, різноманітними та не повторюватися.
- Якщо за потреби наводиш приклад чи пояснення активності - то приклад або пояснення має бути не довшим, ніж 5-7 слів.
- Активності повинн співвідноситися до освітньої лінії.
- Приклади активностей (створи конкретну активність на основі прикладу): гри чи ігрової ситуації, спостереження, руханки, розповіді вихователя, слухання казки, слухання історії, розглядання, розповіді-бесіді, фізкультури на свіжому повітні, читання віршів, малювання, читання казки з емоційним забарвленням, вправа на емпатію, лінгводидактична вправа, дидактична вправи, рухлива гра, танець на відчуття ритму, лексична вправа, творче завдання, сенсорна активності, сюжетно-рольова гра, гра для розвитку емоційного інтелекту, ліплення, колективна гра, групова взаємодія, розпізнавання звуків, розпізнавання образів, розпізнавання обличчь, порівняння предметів, вивчення нових слів, розвиток звʼязного мовлення, перцепсія частин тіла, заняття на свіжому повітрі та інший вид діяльності для дошкільнят, що сприяє різнобічному розвитку дитини.
- Відповідати темі тижня та темі дня.
- У назві активності НЕ ВКАЗУЙ І НЕ ПРОПИСУЙ назву освітньої лінії, але вони повинні відповідати зазначеним лініям.

Формат відповіді подай у JSON, де ключ "tableData" містить масив із об’єктами:
{
  "dateAndDay": "наприклад '01.01 (Середа)'",
  "dayTheme": "наприклад 'Пригоди сніговика'",
  "lines": [
    "короткий опис активності 1",
    "короткий опис активності 2",
    ... (усього 7 пунктів)
  ]

Ось перелік днів тижня і теми днів для плану:
${JSON.stringify(promptObj.days, null, 2)}
`.trim();


            const selectedModel = getSelectedModel('activities');
            const requestBody = {
                contents: [{
                    parts: [{ text: promptText }]
                }]
            };

            // Example advanced config if not using "thinking-exp"
            if (!selectedModel.includes('thinking-exp')) {
                requestBody.generationConfig = {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            tableData: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        dateAndDay: { type: "string" },
                                        dayTheme: { type: "string" },
                                        lines: {
                                            type: "array",
                                            items: { type: "string" },
                                            minItems: 7,
                                            maxItems: 7
                                        }
                                    },
                                    required: ["dateAndDay", "dayTheme", "lines"]
                                }
                            }
                        },
                        required: ["tableData"]
                    }
                };
            }

            // Helper to fill the final table columns
            function validateAndFillData(data) {
                let allFilled = true;
                if (!data || !data.tableData) return false;

                const rows = table.querySelectorAll('tr');
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const dayCell = row.querySelector('td');
                    if (!dayCell) continue;

                    const strong = dayCell.querySelector('strong');
                    if (!strong) continue;

                    const currentDateAndDay = strong.textContent.trim();
                    const dayEntry = data.tableData.find(
                        entry => entry.dateAndDay && entry.dateAndDay.includes(currentDateAndDay)
                    );

                    if (dayEntry && Array.isArray(dayEntry.lines)) {
                        // Fill up to 7 lines
                        const columns = row.querySelectorAll('td');
                        for (let colIndex = 1; colIndex < columns.length && colIndex <= 7; colIndex++) {
                            if (dayEntry.lines[colIndex - 1]) {
                                const td = columns[colIndex];
                                let contentWrapper = td.querySelector('.flex');
                                if (!contentWrapper) {
                                    contentWrapper = document.createElement('div');
                                    contentWrapper.className = 'flex justify-between items-start';
                                    const span = document.createElement('span');
                                    span.className = 'flex-grow';
                                    const button = td.querySelector('.regenerate-btn') ||
                                        document.createElement('button');
                                    button.className = 'regenerate-btn flex-shrink-0';
                                    button.setAttribute('data-type', 'activity');
                                    button.setAttribute('data-line', colIndex.toString());
                                    button.setAttribute('title', 'Згенерувати нову активність');
                                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" 
                      viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 
                        0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 
                        005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 
                        011-1zm.008 9.057a1 1 0 
                        011.276.61A5.002 5.002 0 
                        0014.001 13H11a1 1 0 
                        110-2h5a1 1 0 011 1v5a1 1 0 
                        11-2 0v-2.101a7.002 7.002 0 
                        01-11.601-2.566 1 1 0 
                        01.61-1.276z" clip-rule="evenodd" /></svg>`;
                                    contentWrapper.appendChild(span);
                                    contentWrapper.appendChild(button);
                                    td.innerHTML = '';
                                    td.appendChild(contentWrapper);
                                }

                                const span = contentWrapper.querySelector('span');
                                if (span) {
                                    const skipFilled = document.getElementById('skipFilledCheck').checked;

                                    if (!(skipFilled && span.textContent.trim())) {
                                        span.textContent = dayEntry.lines[colIndex - 1];
                                    }
                                } else {
                                    allFilled = false;
                                }
                            } else {
                                allFilled = false;
                            }
                        }
                    } else {
                        allFilled = false;
                    }
                }
                return allFilled;
            }

            // Attempt the fetch & fill
            try {
                // First request
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    }
                );
                if (!response.ok) {
                    throw new Error(`Помилка від API: ${response.status}`);
                }

                const data = await response.json();
                let parsedData = null;

                // Try to parse JSON directly
                try {
                    const responseText = data.candidates[0].content.parts[0].text;
                    parsedData = JSON.parse(responseText);
                } catch (e) {
                    // If that fails, fallback to a manual parse
                    const generatedText = data.candidates[0].content.parts.at(-1).text || "";
                    try {
                        const jsonStr = generatedText.match(/\{[\s\S]*\}/);
                        if (jsonStr) {
                            parsedData = JSON.parse(jsonStr[0]);
                        }
                    } catch (e2) {
                        // Final fallback: line-based parse
                        const lines = generatedText
                            .split(/\r?\n/)
                            .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
                            .filter(Boolean);

                        parsedData = {
                            tableData: promptObj.days.map((day, idx) => ({
                                dateAndDay: day.dateAndDay,
                                dayTheme: day.dayTheme,
                                lines: lines.slice(idx * 7, (idx + 1) * 7)
                            }))
                        };
                    }
                }

                // Fill or retry once if needed
                let fillSuccess = validateAndFillData(parsedData);

                if (!fillSuccess) {
                    // Attempt second request as fallback
                    const retryResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody)
                        }
                    );

                    if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        try {
                            const retryResponseText = retryData.candidates[0].content.parts[0].text;
                            const retryParsedData = JSON.parse(retryResponseText);
                            fillSuccess = validateAndFillData(retryParsedData);
                        } catch (e) {
                            console.error("Retry attempt failed:", e);
                        }
                    }
                }

                if (!fillSuccess) {
                    console.warn("Could not fill all cells properly after retry");
                }
            } catch (error) {
                console.error(error);
                // Move to next page/week if this one fails
                showModal("Не вдалося отримати дані від Gemini API: " + error.message);
                continue;
            }
        }

        // After looping all weeks
        saveGeneratedPages();
        showModal(
            "Повне автозаповнення таблиць завершено!\n" +
            "Ви можете перезаповнити все ще раз, натиснувши ту ж кнопку, або " +
            "кожну комірку таблиці окремо (клікнувши на кнопку повторної генерації).\n" +
            "Або ж виберіть ручне редагування, якщо потрібно внести зміни або " +
            "одразу друкуйте.\n"
        );
    } catch (error) {
        console.error(error);
        showModal("Не вдалося отримати дані від Gemini API: " + error.message);
    } finally {
        hideSpinner();
        enableAllButtons();
        updateRegenerateButtonsState();
    }
});


/****************************************************
 * PRINT
 ****************************************************/
const printBtn = document.getElementById('btnPrint');
printBtn.addEventListener('click', function () {
    // Store all elements we'll modify
    const modifications = [];

    // Handle all theme inputs
    document.querySelectorAll('.week-theme-input, .day-theme-input').forEach(input => {
        // Create text node with input's value
        const text = document.createTextNode(input.value.trim());
        
        // Store original parent and input for restoration
        const parent = input.parentNode;
        const container = parent.closest('.week-theme-container');
        
        // Store the modification
        modifications.push({
            container: container,
            originalHTML: container.innerHTML,
            input: input,
            text: text
        });

        // Replace input with text
        if (container) {
            // Simplify container for printing
            container.innerHTML = '';
            container.appendChild(text);
        }
    });

    // Print the document
    window.print();

    // Restore all modifications
    modifications.forEach(mod => {
        if (mod.container) {
            mod.container.innerHTML = mod.originalHTML;
        }
    });

    // Ensure event handlers are reattached
    reattachThemeInputHandlers?.();
    updateRegenerateButtonsState?.();
});

/****************************************************
 * INSTRUCTIONS BUTTON
 ****************************************************/
const btnInstructions = document.getElementById('btnInstructions');
btnInstructions.addEventListener('click', function () {
    window.open('instructions.html', '_blank');
});

/****************************************************
 * LOGOUT
 ****************************************************/
const btnLogout = document.getElementById('btnLogout');
btnLogout.addEventListener('click', function () {
    if (confirm('Ви впевнені, що хочете вийти?')) {
        if (typeof clearAuthData === 'function') {
            clearAuthData();
        }
        window.location.href = 'index.html';
    }
});

/****************************************************
 * SPINNER & BUTTON ENABLE/DISABLE
 ****************************************************/
function showSpinner() {
    document.getElementById('spinnerOverlay').style.display = 'block';
}
function hideSpinner() {
    document.getElementById('spinnerOverlay').style.display = 'none';
}
function disableAllButtons() {
    document.querySelectorAll('.no-print button, .no-print select, .no-print input').forEach(el => {
        el.disabled = true;
    });
}
function enableAllButtons() {
    document.querySelectorAll('.no-print button:not(.editBtn):not(.saveBtn), .no-print select, .no-print input').forEach(el => {
        el.disabled = false;
    });
    document.querySelectorAll('.editBtn, .saveBtn').forEach(el => {
        el.disabled = false;
    });
    checkAutoFillAvailability?.();
}
