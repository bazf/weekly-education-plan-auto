// js/modal.js
const modal = {
    element: null,
    titleElement: null,
    messageElement: null,
    okButton: null,

    init() {
        this.element = document.getElementById('customModal');
        this.titleElement = document.getElementById('modalTitle');
        this.messageElement = document.getElementById('modalMessage');
        this.okButton = document.getElementById('modalOkBtn');
    },

    show(title, message) {
        this.titleElement.textContent = title;
        this.messageElement.textContent = message;
        this.element.classList.remove('hidden');

        return new Promise((resolve) => {
            const handleClick = () => {
                this.hide();
                this.okButton.removeEventListener('click', handleClick);
                resolve(true);
            };
            this.okButton.addEventListener('click', handleClick);
        });
    },

    hide() {
        this.element.classList.add('hidden');
    }
};

async function showModal(message, title = 'Повідомлення') {
    // Make sure modal is initialized
    if (!modal.element) {
        modal.init();
    }
    return modal.show(title, message);
}
