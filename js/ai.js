// js/ai.js

// This config is used to choose the correct model IDs for different tasks
const MODEL_CONFIG = {
    optimal: {
        name: "🌟 Оптимальна",
        weekThemes: "gemini-2.0-flash-exp",
        dayThemes: "gemini-2.0-flash-thinking-exp-1219",
        activities: "gemini-2.0-flash-exp"
    },
    models: {
        "gemini-1.5-flash-8b": "⚡️ Блискавична",
        "gemini-1.5-flash": "🚀 Швидка",
        "gemini-1.5-pro": "💪 Професійна",
        "gemini-2.0-flash-exp": "🔥 Потужна",
        "gemini-2.0-flash-thinking-exp-1219": "🧠 Розумна"
    }
};

// Helper to choose the right model based on user’s selection or default "optimal"
function getSelectedModel(taskType = 'default') {
    const savedModel = localStorage.getItem('selectedModel') || 'optimal';
    if (savedModel !== 'optimal') {
        return savedModel.trim();
    }
    switch (taskType) {
        case 'weekThemes':
            return MODEL_CONFIG.optimal.weekThemes;
        case 'dayThemes':
            return MODEL_CONFIG.optimal.dayThemes;
        case 'activities':
            return MODEL_CONFIG.optimal.activities;
        default:
            return MODEL_CONFIG.optimal.weekThemes;
    }
}

// Handle single cell regeneration
async function handleRegeneration(element) {
    // If button is disabled, show warnings
    if (element.disabled) {
        if (element.dataset.type === 'day-theme') {
            showModal?.('Будь ласка, спочатку заповніть тему тижня!', 'Увага');
        } else if (element.dataset.type === 'activity') {
            showModal?.('Будь ласка, спочатку заповніть тему дня!', 'Увага');
        }
        return;
    }

    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        showModal?.('API ключ не знайдено! Спочатку збережіть ключ.');
        return;
    }

    const type = element.dataset.type;
    const year = document.getElementById('yearSelect').value;
    const monthIndex = parseInt(document.getElementById('monthSelect').value) - 1;
    const monthName = monthNamesUkr[monthIndex] || "";

    // Show a spinner in the cell
    const spinner = document.createElement('div');
    spinner.className = 'cell-spinner';
    let originalContent;
    let contentContainer;

    if (type === 'week-theme' || type === 'day-theme') {
        const container = element.closest('.cell-content-wrapper');
        const input = container.querySelector('input');
        originalContent = input.value;
        container.querySelectorAll('*').forEach(el => (el.style.display = 'none'));
        contentContainer = container;
        container.appendChild(spinner);
    } else if (type === 'activity') {
        const cell = element.closest('td');
        const span = cell.querySelector('span');
        originalContent = span.textContent;
        span.style.display = 'none';
        contentContainer = span.parentElement;
        contentContainer.insertBefore(spinner, element);
    }

    element.style.display = 'none'; // Hide regenerate button while processing

    try {
        let promptText = '';
        let selectedModel = '';

        if (type === 'week-theme') {
            selectedModel = getSelectedModel('weekThemes');
            promptText = `
          Будь ласка, запропонуй одну актуальну тему для тижня у дитячому садочку в Україні 
          на період: ${monthName} ${year}.
          Тема має бути креативною, але враховувати сезон та особливості виховання дітей дошкільного віку.
          Якщо в тижні є державне свято України чи велике міжнародне свято, будь ласка, врахуй його при формуванні теми тижня.
          Надай лише тему, без коментарів.
        `.trim();
        } else if (type === 'day-theme') {
            const weekThemeInput = element.closest('.page')?.querySelector('.week-theme-input');
            const weekTheme = weekThemeInput ? weekThemeInput.value : '';

            selectedModel = getSelectedModel('dayThemes');
            promptText = `
          Будь ласка, запропонуй одну тему дня для дитячого садочку в Україні, 
          враховуючи що тема тижня: "${weekTheme}".
          Тема має бути пов'язана з темою тижня, але бути унікальною.
          Надай лише тему, без коментарів.
        `.trim();
        } else if (type === 'activity') {
            const lineNumber = element.dataset.line;
            const row = element.closest('tr');
            const weekThemeInput = element.closest('.page')?.querySelector('.week-theme-input');
            const dayThemeInput = row.querySelector('.day-theme-input');
            const weekTheme = weekThemeInput ? weekThemeInput.value : '';
            const dayTheme = dayThemeInput ? dayThemeInput.value : '';

            // Collect existing activities in this TBody (to avoid duplicates)
            const weekActivities = Array.from(element.closest('tbody').querySelectorAll('td'))
                .slice(1)
                .map(td => td.textContent.trim())
                .filter(Boolean);

            selectedModel = getSelectedModel('activities');
            promptText = `
          Запропонуй одну єдину унікальну активність для освітньої лінії ${lineNumber} у дитячому садочку.
          ${weekTheme ? `Тема тижня: "${weekTheme}"` : ''}
          ${dayTheme ? `Тема дня: "${dayTheme}"` : ''}                
          Назва і суть активності має бути короткою, без додаткових пояснень що повинні робити діти. 
          Активність має бути конкретною і не повторювати існуючі активності цього тижня:
          ${weekActivities.join(', ')}
          Надай лише опис активності, без коментарів. Активність повинна відображати освітню лінію, 
          може бути якась гра, руханка, танці чи інша діяльність, що ти вважаєш доцільною для дошкільнят.
        `.trim();
        }

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
        const generatedText = data.candidates[0].content.parts.at(-1).text.trim();

        if (type === 'week-theme' || type === 'day-theme') {
            const container = element.closest('.cell-content-wrapper');
            const input = container.querySelector('input');
            input.value = generatedText;
            container.querySelectorAll('*').forEach(el => (el.style.display = ''));
        } else if (type === 'activity') {
            const cell = element.closest('td');
            const span = cell.querySelector('span');
            span.textContent = generatedText;
            span.style.display = '';
        }

        saveGeneratedPages?.();
        checkAutoFillAvailability?.();
        updateRegenerateButtonsState?.();
    } catch (error) {
        console.error(error);
        if (error.message.includes("429")) {
            showModal?.(
                "Будь ласка, не поспішайте! Зачекайте хвильку і нові генерації стануть доступні. У вас багато часу, Ви усе встигнете!",
                "Ви занадто швидкі"
            );
        } else {
            showModal?.("Помилка генерації: " + error.message);
        }

        // Revert content in case of error
        if (type === 'week-theme' || type === 'day-theme') {
            const container = element.closest('.cell-content-wrapper');
            container.querySelector('input').value = originalContent;
            container.querySelectorAll('*').forEach(el => (el.style.display = ''));
        } else if (type === 'activity') {
            const cell = element.closest('td');
            const span = cell.querySelector('span');
            span.textContent = originalContent;
            span.style.display = '';
        }
    } finally {
        if (spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
        }
        element.style.display = '';
    }
}

// Check if all week/day themes are filled
function areAllThemesFilled() {
    const weekInputs = document.querySelectorAll('.week-theme-input');
    const dayInputs = document.querySelectorAll('.day-theme-input');
    for (let wi of weekInputs) {
        if (!wi.value.trim()) return false;
    }
    for (let di of dayInputs) {
        if (!di.value.trim()) return false;
    }
    return true;
}

// Enable or disable "auto fill" buttons depending on the user’s inputs
function checkAutoFillAvailability() {
    const autoFillWeekThemesBtn = document.getElementById('autoFillWeekThemesBtn');
    const autoFillDayThemesBtn = document.getElementById('autoFillDayThemesBtn');
    const autoFillBtn = document.getElementById('autoFillBtn');

    const tablesExist = document.querySelectorAll('.page').length > 0;
    const useAICheck = document.getElementById('useAICheck');
    if (!useAICheck.checked || !tablesExist) {
        autoFillWeekThemesBtn.disabled = true;
        autoFillDayThemesBtn.disabled = true;
        autoFillBtn.disabled = true;
        return;
    }

    const apiKey = localStorage.getItem('geminiApiKey') || '';
    if (!apiKey.trim()) {
        autoFillWeekThemesBtn.disabled = true;
        autoFillDayThemesBtn.disabled = true;
        autoFillBtn.disabled = true;
        return;
    }

    // We can fill week themes
    autoFillWeekThemesBtn.disabled = false;

    // We can fill day themes if all week themes are set
    let allWeekThemesFilled = true;
    document.querySelectorAll('.week-theme-input').forEach(wi => {
        if (!wi.value.trim()) allWeekThemesFilled = false;
    });
    autoFillDayThemesBtn.disabled = !allWeekThemesFilled;

    // We can fill all activities if all themes are set
    autoFillBtn.disabled = !areAllThemesFilled();
}

// For each row, check if day theme is filled => enable/disable activity regenerate
function updateRegenerateButtonsState() {
    document.querySelectorAll('.page').forEach(page => {
        const weekThemeInput = page.querySelector('.week-theme-input');
        const weekThemeFilled = (weekThemeInput?.value ?? "").trim().length > 0;

        // If week theme is not filled, disable day-theme regenerate
        const dayThemeBtns = page.querySelectorAll('.regenerate-btn[data-type="day-theme"]');
        dayThemeBtns.forEach(btn => {
            btn.disabled = !weekThemeFilled;
        });

        // For each row (day):
        page.querySelectorAll('tr').forEach(row => {
            const dayThemeInput = row.querySelector('.day-theme-input');
            if (!dayThemeInput) return;
            const dayThemeFilled = dayThemeInput.value.trim().length > 0;

            // If day theme is not filled, disable activity regenerate
            const activityBtns = row.querySelectorAll('.regenerate-btn[data-type="activity"]');
            activityBtns.forEach(btn => {
                btn.disabled = !dayThemeFilled;
            });
        });
    });
}

// Listen for clicks on any .regenerate-btn
document.addEventListener('click', function (e) {
    if (e.target.closest('.regenerate-btn')) {
        handleRegeneration(e.target.closest('.regenerate-btn'));
    }
});
