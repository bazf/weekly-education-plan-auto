// js/tables.js

// Ukrainian month names
const monthNamesUkr = [
    "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"
];

// Generate the working weeks for a given year and month
function getWorkingWeeksOfMonth(year, month) {
    const allWorkDays = [];
    let d = new Date(year, month, 1);
    while (d.getMonth() === month) {
        const dayOfWeek = d.getDay();
        // Monday-Friday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            allWorkDays.push(new Date(d));
        }
        d.setDate(d.getDate() + 1);
    }
    if (allWorkDays.length === 0) return [];

    const weeks = [];
    let currentWeek = [];
    for (let i = 0; i < allWorkDays.length; i++) {
        const dayDate = allWorkDays[i];
        // If Monday, start a new week
        if (dayDate.getDay() === 1 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(dayDate);
    }
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }
    return weeks;
}

function formatDateDDMM(dateObj) {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    return dd + '.' + mm;
}

function getDayNameUkr(dayIndex) {
    const days = [
        'Неділя',
        'Понеділок',
        'Вівторок',
        'Середа',
        'Четвер',
        'П’ятниця',
        'Субота'
    ];
    return days[dayIndex] || '';
}

// Allows editing a table
function editTableContent(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.style.border = '3px solid orange';
    table.querySelectorAll('td, th').forEach(cell => {
        cell.contentEditable = 'true';
        cell.style.border = '2px solid orange';
        cell.style.color = 'orange';
    });
}

// Disables editing
function saveTableContent(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.style.border = '';
    table.querySelectorAll('td, th').forEach(cell => {
        cell.contentEditable = 'false';
        cell.style.border = '';
        cell.style.color = '';
    });
}

// Reattach edit/save event handlers
function reattachTableHandlers() {
    document.querySelectorAll('.editBtn').forEach(btn => {
        btn.disabled = false;
        btn.onclick = function () {
            const tableId = this.getAttribute('data-table');
            editTableContent(tableId);
        };
    });

    document.querySelectorAll('.saveBtn').forEach(btn => {
        btn.disabled = false;
        btn.onclick = function () {
            const tableId = this.getAttribute('data-table');
            saveTableContent(tableId);
        };
    });
}

// Save the final HTML of all .page containers into localStorage
function saveGeneratedPages() {
    // Remove any leftover spinners
    document.querySelectorAll('.cell-spinner').forEach(spinner => {
        spinner.remove();
    });

    // Ensure all cell content wrappers are visible
    document.querySelectorAll('.cell-content-wrapper *').forEach(el => {
        el.style.display = '';
    });

    // Make sure to set input "value" attributes to keep them on reload
    document.querySelectorAll('.page').forEach(page => {
        page.querySelectorAll('input').forEach(input => {
            input.setAttribute('value', input.value);
        });

        // For each td, convert the regeneratable .flex content into permanent HTML
        page.querySelectorAll('td').forEach((td, index) => {
            if (index > 0) {
                const contentWrapper = td.querySelector('.flex');
                if (contentWrapper) {
                    const span = contentWrapper.querySelector('span');
                    const content = span ? span.textContent : '';
                    td.innerHTML = `
              <div class="flex justify-between items-start">
                <span class="flex-grow">${content}</span>
                <button class="regenerate-btn flex-shrink-0" data-type="activity" data-line="${index}" title="Згенерувати нову активність">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>`;
                }
            }
        });
    });

    const pagesHtml = Array.from(document.querySelectorAll('.page'))
        .map(page => page.outerHTML)
        .join('\n');
    localStorage.setItem('allGeneratedPages', pagesHtml);
}

function reattachThemeInputHandlers() {
    const weekInputs = document.querySelectorAll('.week-theme-input');
    const dayInputs = document.querySelectorAll('.day-theme-input');

    weekInputs.forEach(input => {
        input.addEventListener('input', () => {
            checkAutoFillAvailability?.(); // This is in ai.js
            updateRegenerateButtonsState?.();
            saveGeneratedPages();
        });
    });
    dayInputs.forEach(input => {
        input.addEventListener('input', () => {
            checkAutoFillAvailability?.();
            updateRegenerateButtonsState?.();
            saveGeneratedPages();
        });
    });
}

