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

// Toggle "Edit" ↔ "Discard changes"
function toggleEditTable(tableId, editButton) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const currentlyEditing = table.dataset.editing === 'true';
    if (currentlyEditing) {
        // Discard changes
        discardTableContent(tableId, editButton);
    } else {
        // Enable editing
        editTableContent(tableId, editButton);
    }
}

/*****************************************************************************
 * TABLE EDITING & HANDLERS (REPLACEMENT CODE)
 *****************************************************************************/

// Called when user clicks “Редагувати таблицю” (or the discard toggle)
function toggleEditTable(tableId, editButton) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const isCurrentlyEditing = table.dataset.editing === 'true';
    if (isCurrentlyEditing) {
        // User wants to discard
        discardTableContent(table, editButton);
    } else {
        // User wants to start editing
        enterEditMode(table, editButton);
    }
}

// Enable editing: highlight table, make cells clickable for typing, 
// and store the original HTML so we can discard if user cancels.
function enterEditMode(table, editButton) {
    table.dataset.originalHtml = table.innerHTML;
    table.dataset.editing = 'true';

    table.style.border = '3px solid orange';

    // For each cell
    table.querySelectorAll('td, th').forEach(cell => {
        cell.contentEditable = 'true';
        cell.style.border = '2px solid orange';
        cell.style.color = 'orange';

        // If cell is truly empty, put a space so you can click & type
        if (!cell.innerText.trim()) {
            cell.innerText = ' ';
        }

        // Prevent the regenerate button from being edited/deleted
        cell.querySelectorAll('button').forEach(btn => {
            btn.setAttribute('contentEditable', 'false');
        });
    });

    // Change button text to “Відмінити зміни”
    editButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 
                0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 
                005.999 7H9a1 1 0 010 2H4a1 1 0 
                01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 
                011.276.61A5.002 5.002 0 
                0014.001 13H11a1 1 0 
                110-2h5a1 1 0 011 1v5a1 1 0 
                11-2 0v-2.101a7.002 7.002 0 
                01-11.601-2.566 1 1 0 
                01.61-1.276z" 
                clip-rule="evenodd" />
        </svg>
        <span>Відмінити зміни</span>
    `;
}

// If user discards changes, restore the old HTML exactly:
function discardTableContent(table, editButton) {
    if (!table.dataset.originalHtml) {
        // If for some reason we have nothing stored, just treat this like a save
        exitEditMode(table);
        resetEditButton(editButton);
        return;
    }

    // Restore original HTML, revert to non-editing
    table.innerHTML = table.dataset.originalHtml;
    table.dataset.editing = 'false';
    table.style.border = '';

    // Clear out any leftover reference
    delete table.dataset.originalHtml;

    // Since we replaced the HTML, we must reattach all events (including edit/save)
    reattachTableHandlers();

    // Also reset the button text to “Редагувати…”
    resetEditButton(editButton);
}

// Finalize the user’s edits: keep the changed HTML, so it will be saved to localStorage
function saveTableContent(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    exitEditMode(table);

    // Save the final HTML to localStorage using your existing function
    // so changes will persist after reload
    saveGeneratedPages();

    // Reattach event handlers (since table might have changed)
    reattachTableHandlers();
}

// Just exit the editing look (orange highlight, contentEditable, etc.)
function exitEditMode(table) {
    table.dataset.editing = 'false';
    table.style.border = '';

    table.querySelectorAll('td, th').forEach(cell => {
        cell.contentEditable = 'false';
        cell.style.border = '';
        cell.style.color = '';
    });

    // No more "originalHtml" once we decide we’re keeping or discarding
    delete table.dataset.originalHtml;
}

// Restore the “Редагувати таблицю власноруч” text/icon
function resetEditButton(editButton) {
    editButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 
            112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793
            L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
        </svg>
        <span>Редагувати таблицю власноруч</span>
    `;
}

function reattachTableHandlers() {
    // 1) Force every table to start in "non-editing" mode.
    document.querySelectorAll('.page table').forEach(table => {
        table.dataset.editing = 'false';
    });

    // 2) For each Edit button: reset the label to "Редагувати…" and reattach its click
    document.querySelectorAll('.editBtn').forEach(btn => {
        // Always reset it to the "Edit" label at the moment we reattach
        resetEditButton(btn);

        // Enable the button
        btn.disabled = false;

        // Reattach the click event
        btn.onclick = function () {
            const tableId = this.getAttribute('data-table');
            toggleEditTable(tableId, this);
        };
    });

    // 3) For each Save button: reattach its click
    document.querySelectorAll('.saveBtn').forEach(btn => {
        btn.disabled = false;
        btn.onclick = function () {
            const tableId = this.getAttribute('data-table');
            saveTableContent(tableId);

            // Also reset its corresponding .editBtn text after saving
            const editBtn = document.querySelector(`.editBtn[data-table="${tableId}"]`);
            if (editBtn) {
                resetEditButton(editBtn);
            }
        };
    });
}

/***************************************************************
 * SAVE THE FINAL HTML OF ALL .page CONTAINERS INTO localStorage
 ***************************************************************/
function saveGeneratedPages() {
    // Remove any leftover spinners (the little rotating icons)
    document.querySelectorAll('.cell-spinner').forEach(spinner => {
        spinner.remove();
    });

    // Ensure all cell-content-wrapper elements are visible
    document.querySelectorAll('.cell-content-wrapper *').forEach(el => {
        el.style.display = '';
    });

    // For every .page (i.e., each generated table/plan)
    document.querySelectorAll('.page').forEach(page => {
        // Make sure <input> elements persist their value attribute for reload
        page.querySelectorAll('input').forEach(input => {
            input.setAttribute('value', input.value);
        });

        // Force each "activity" column to contain the .regenerate-btn if missing
        // Usually, columns 1..7 are "activity" columns in your code
        const rows = page.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            // Skip the 0-th cell (that’s the "day theme" cell),
            // but if you want to do the same for day-theme cells,
            // set `for (let i = 0; i < cells.length; i++)` instead.
            for (let i = 1; i < cells.length; i++) {
                const td = cells[i];
                // Check if there is already a .regenerate-btn
                const hasRegenBtn = td.querySelector('.regenerate-btn');
                if (!hasRegenBtn) {
                    // The user might have typed something new or left it empty
                    // We'll wrap that text in a <span> and append the button
                    const userHTML = td.innerHTML.trim();

                    td.innerHTML = `
                      <div class="flex justify-between items-start">
                        <span class="flex-grow">${userHTML}</span>
                        <button class="regenerate-btn flex-shrink-0"
                          data-type="activity"
                          data-line="${i}"
                          title="Згенерувати нову активність">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" 
                              viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 
                                7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 
                                5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 
                                01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 
                                011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 
                                110-2h5a1 1 0 011 1v5a1 1 0 
                                11-2 0v-2.101a7.002 7.002 0 
                                01-11.601-2.566 1 1 0 
                                01.61-1.276z" clip-rule="evenodd" />
                            </svg>
                        </button>
                      </div>
                    `;
                }
            }
        });
    });

    // Finally, grab all .page HTML, save to localStorage
    const pagesHtml = Array.from(document.querySelectorAll('.page'))
        .map(page => page.outerHTML)
        .join('\n');
    localStorage.setItem('allGeneratedPages', pagesHtml);

    updateRegenerateButtonsState?.();
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

