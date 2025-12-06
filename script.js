// Основной объект приложения
const UmamiApp = {
    // Текущее состояние
    state: {
        user: null,
        contacts: [],
        activeContact: null,
        currentCall: null,
        callTimer: null,
        callSeconds: 0
    },

    // Инициализация
    init() {
        this.loadUser();
        this.loadContacts();
        this.bindEvents();
        this.setupFakeData();
    },

    // Загрузка пользователя
    loadUser() {
        const savedUser = localStorage.getItem('umami_user');
        if (savedUser) {
            this.state.user = JSON.parse(savedUser);
            this.updateUserUI();
            this.showMainScreen();
        }
    },

    // Загрузка контактов
    loadContacts() {
        const savedContacts = localStorage.getItem('umami_contacts');
        if (savedContacts) {
            this.state.contacts = JSON.parse(savedContacts);
        } else {
            // Загрузка тестовых контактов
            this.state.contacts = [
                {
                    id: 1,
                    name: 'Алексей',
                    avatar: 'https://i.pravatar.cc/150?img=2',
                    status: 'online',
                    lastMessage: 'Привет! Как дела?',
                    time: '10:30',
                    messages: [
                        { text: 'Привет!', time: '10:25', incoming: true },
                        { text: 'Привет! Как дела?', time: '10:30', incoming: false }
                    ]
                },
                {
                    id: 2,
                    name: 'Мария',
                    avatar: 'https://i.pravatar.cc/150?img=3',
                    status: 'online',
                    lastMessage: 'Встречаемся в 18:00',
                    time: '09:15',
                    messages: [
                        { text: 'Привет! Встречаемся в 18:00', time: '09:15', incoming: true },
                        { text: 'Хорошо, буду!', time: '09:20', incoming: false }
                    ]
                },
                {
                    id: 3,
                    name: 'Иван',
                    avatar: 'https://i.pravatar.cc/150?img=4',
                    status: 'offline',
                    lastMessage: 'Отправил документы',
                    time: 'Вчера',
                    messages: [
                        { text: 'Привет, отправил документы', time: 'Вчера 15:30', incoming: true },
                        { text: 'Спасибо, получил', time: 'Вчера 15:45', incoming: false }
                    ]
                }
            ];
            this.saveContacts();
        }
        
        this.renderContacts();
        
        // Активируем первый контакт
        if (this.state.contacts.length > 0) {
            this.setActiveContact(this.state.contacts[0]);
        }
    },

    // Сохранение контактов
    saveContacts() {
        localStorage.setItem('umami_contacts', JSON.stringify(this.state.contacts));
    },

    // Привязка событий
    bindEvents() {
        // Авторизация
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        
        // Профиль
        document.getElementById('profile-btn').addEventListener('click', () => this.showProfile());
        document.getElementById('close-profile').addEventListener('click', () => this.hideProfile());
        document.getElementById('save-profile').addEventListener('click', () => this.saveProfile());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Звонки
        document.getElementById('incoming-call-btn').addEventListener('click', () => this.simulateIncomingCall());
        document.getElementById('outgoing-call-btn').addEventListener('click', () => this.simulateOutgoingCall());
        document.getElementById('answer-call').addEventListener('click', () => this.answerCall());
        document.getElementById('decline-call').addEventListener('click', () => this.declineCall());
        document.getElementById('end-call').addEventListener('click', () => this.endCall());
        
        // Сообщения
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Поиск
        document.getElementById('search-contacts').addEventListener('input', (e) => this.searchContacts(e.target.value));
    },

    // Настройка фейковых данных
    setupFakeData() {
        // Автогенерация сообщений
        setInterval(() => {
            if (Math.random() > 0.7 && this.state.activeContact) {
                this.receiveMessage();
            }
        }, 30000);
    },

    // Авторизация
    login() {
        const phoneInput = document.getElementById('phone-number');
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (phone.length !== 10) {
            this.showNotification('Введите корректный номер телефона (10 цифр)');
            return;
        }
        
        // Создаем или загружаем пользователя
        if (!this.state.user) {
            this.state.user = {
                name: 'Гость',
                phone: `+7${phone}`,
                avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
                status: 'В сети'
            };
            localStorage.setItem('umami_user', JSON.stringify(this.state.user));
        }
        
        this.updateUserUI();
        this.showMainScreen();
        this.showNotification('Успешный вход в систему!');
    },

    // Выход
    logout() {
        localStorage.removeItem('umami_user');
        this.state.user = null;
        this.hideProfile();
        this.showAuthScreen();
        this.showNotification('Вы вышли из системы');
    },

    // Показать профиль
    showProfile() {
        if (this.state.user) {
            document.getElementById('profile-name').value = this.state.user.name;
            document.getElementById('profile-status').value = this.state.user.status;
            document.getElementById('profile-phone').value = this.state.user.phone;
            document.getElementById('profile-avatar-preview').src = this.state.user.avatar;
        }
        document.getElementById('profile-modal').classList.add('active');
    },

    // Скрыть профиль
    hideProfile() {
        document.getElementById('profile-modal').classList.remove('active');
    },

    // Сохранить профиль
    saveProfile() {
        const name = document.getElementById('profile-name').value;
        const status = document.getElementById('profile-status').value;
        
        if (this.state.user) {
            this.state.user.name = name;
            this.state.user.status = status;
            localStorage.setItem('umami_user', JSON.stringify(this.state.user));
            this.updateUserUI();
            this.showNotification('Профиль сохранен');
            this.hideProfile();
        }
    },

    // Имитация входящего звонка
    simulateIncomingCall() {
        const randomContact = this.state.contacts[Math.floor(Math.random() * this.state.contacts.length)];
        
        this.state.currentCall = {
            type: 'incoming',
            contact: randomContact,
            status: 'ringing'
        };
        
        // Обновляем UI
        document.getElementById('caller-name').textContent = randomContact.name;
        document.getElementById('caller-avatar').src = randomContact.avatar;
        document.getElementById('call-type').textContent = 'Входящий звонок';
        
        // Показываем окно звонка
        document.getElementById('call-screen').classList.add('active');
        
        // Включаем звонок
        const ringtone = document.getElementById('ringtone');
        ringtone.currentTime = 0;
        ringtone.play();
        
        // Сбрасываем таймер
        this.resetCallTimer();
        
        this.showNotification(`Входящий звонок от ${randomContact.name}`);
    },

    // Имитация исходящего звонка
    simulateOutgoingCall() {
        if (!this.state.activeContact) {
            this.showNotification('Выберите контакт для звонка');
            return;
        }
        
        this.state.currentCall = {
            type: 'outgoing',
            contact: this.state.activeContact,
            status: 'calling'
        };
        
        // Обновляем UI
        document.getElementById('caller-name').textContent = this.state.activeContact.name;
        document.getElementById('caller-avatar').src = this.state.activeContact.avatar;
        document.getElementById('call-type').textContent = 'Исходящий звонок...';
        
        // Показываем окно звонка
        document.getElementById('call-screen').classList.add('active');
        
        // Автоматически "соединяем" через 3 секунды
        setTimeout(() => {
            if (this.state.currentCall) {
                this.answerCall();
            }
        }, 3000);
        
        this.resetCallTimer();
    },

    // Ответить на звонок
    answerCall() {
        if (!this.state.currentCall) return;
        
        this.state.currentCall.status = 'active';
        
        // Меняем UI
        document.getElementById('answer-call').style.display = 'none';
        document.getElementById('decline-call').style.display = 'none';
        document.getElementById('end-call').style.display = 'inline-flex';
        document.getElementById('call-type').textContent = 'Разговор';
        
        // Выключаем звонок
        document.getElementById('ringtone').pause();
        
        // Запускаем таймер
        this.startCallTimer();
        
        this.showNotification('Звонок начат');
    },

    // Отклонить звонок
    declineCall() {
        if (!this.state.currentCall) return;
        
        this.showNotification(`Звонок от ${this.state.currentCall.contact.name} отклонен`);
        this.endCall();
    },

    // Завершить звонок
    endCall() {
        if (this.state.currentCall) {
            const duration = this.state.callSeconds;
            this.showNotification(`Звонок завершен. Длительность: ${this.formatTime(duration)}`);
        }
        
        this.state.currentCall = null;
        document.getElementById('call-screen').classList.remove('active');
        document.getElementById('ringtone').pause();
        this.stopCallTimer();
    },

    // Таймер звонка
    startCallTimer() {
        this.stopCallTimer();
        this.state.callSeconds = 0;
        this.state.callTimer = setInterval(() => {
            this.state.callSeconds++;
            document.getElementById('call-timer').textContent = this.formatTime(this.state.callSeconds);
        }, 1000);
    },

    stopCallTimer() {
        if (this.state.callTimer) {
            clearInterval(this.state.callTimer);
            this.state.callTimer = null;
        }
    },

    resetCallTimer() {
        this.state.callSeconds = 0;
        document.getElementById('call-timer').textContent = '00:00';
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    },

    // Отправка сообщения
    sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        
        if (!text || !this.state.activeContact) return;
        
        // Создаем сообщение
        const message = {
            text: text,
            time: this.getCurrentTime(),
            incoming: false
        };
        
        // Добавляем к активному контакту
        this.state.activeContact.messages.push(message);
        this.state.activeContact.lastMessage = text;
        this.state.activeContact.time = this.getCurrentTimeShort();
        
        // Сохраняем
        this.saveContacts();
        
        // Обновляем UI
        this.renderMessages();
        this.renderContacts();
        
        // Очищаем input
        input.value = '';
        
        // Автоответ через 1-3 секунды
        setTimeout(() => {
            if (this.state.activeContact && Math.random() > 0.3) {
                this.receiveMessage();
            }
        }, 1000 + Math.random() * 2000);
    },

    // Получение сообщения
    receiveMessage() {
        if (!this.state.activeContact) return;
        
        const responses = [
            'Привет!',
            'Как дела?',
            'Хорошо, спасибо!',
            'Чем занимаешься?',
            'Уже на выходных?',
            'Отлично выглядишь!',
            'Давай встретимся',
            'Отправил тебе файл',
            'Позвони мне позже',
            'Спасибо за информацию'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const message = {
            text: randomResponse,
            time: this.getCurrentTime(),
            incoming: true
        };
        
        this.state.activeContact.messages.push(message);
        this.state.activeContact.lastMessage = randomResponse;
        this.state.activeContact.time = this.getCurrentTimeShort();
        
        this.saveContacts();
        this.renderMessages();
        this.renderContacts();
        
        this.showNotification(`Новое сообщение от ${this.state.activeContact.name}`);
    },

    // Поиск контактов
    searchContacts(query) {
        const contactsList = document.getElementById('contacts-list');
        const normalizedQuery = query.toLowerCase().trim();
        
        if (!normalizedQuery) {
            this.renderContacts();
            return;
        }
        
        const filtered = this.state.contacts.filter(contact =>
            contact.name.toLowerCase().includes(normalizedQuery) ||
            contact.lastMessage.toLowerCase().includes(normalizedQuery)
        );
        
        this.renderContacts(filtered);
    },

    // Установить активный контакт
    setActiveContact(contact) {
        this.state.activeContact = contact;
        
        // Обновляем UI
        document.getElementById('contact-name').textContent = contact.name;
        document.getElementById('contact-avatar').src = contact.avatar;
        document.getElementById('contact-status').textContent = contact.status;
        document.getElementById('contact-status').className = `status ${contact.status}`;
        
        // Обновляем список контактов
        this.renderContacts();
        
        // Показываем сообщения
        this.renderMessages();
    },

    // Рендер контактов
    renderContacts(contacts = this.state.contacts) {
        const contactsList = document.getElementById('contacts-list');
        contactsList.innerHTML = '';
        
        contacts.forEach(contact => {
            const isActive = this.state.activeContact && this.state.activeContact.id === contact.id;
            
            const contactElement = document.createElement('div');
            contactElement.className = `contact-item ${isActive ? 'active' : ''}`;
            contactElement.innerHTML = `
                <img src="${contact.avatar}" alt="${contact.name}" class="contact-avatar">
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-last-message">${contact.lastMessage}</div>
                </div>
                <div class="contact-time">${contact.time}</div>
            `;
            
            contactElement.addEventListener('click', () => this.setActiveContact(contact));
            contactsList.appendChild(contactElement);
        });
        
        document.getElementById('contacts-count').textContent = contacts.length;
    },

    // Рендер сообщений
    renderMessages() {
        if (!this.state.activeContact) return;
        
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';
        
        this.state.activeContact.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.incoming ? 'incoming' : 'outgoing'}`;
            messageElement.innerHTML = `
                <div class="message-content">${message.text}</div>
                <div class="message-time">${message.time}</div>
            `;
            messagesContainer.appendChild(messageElement);
        });
        
        // Прокрутка вниз
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // Обновление UI пользователя
    updateUserUI() {
        if (!this.state.user) return;
        
        document.getElementById('user-name').textContent = this.state.user.name;
        document.getElementById('user-avatar').src = this.state.user.avatar;
        document.getElementById('user-status').textContent = this.state.user.status;
        document.getElementById('user-phone').textContent = this.state.user.phone;
    },

    // Показать уведомление
    showNotification(text) {
        const notification = document.getElementById('notification');
        document.getElementById('notification-text').textContent = text;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },

    // Переключение экранов
    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
    },

    showMainScreen() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
    },

    // Вспомогательные функции
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    },

    getCurrentTimeShort() {
        const now = new Date();
        return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    UmamiApp.init();
    
    // Фокус на поле ввода номера
    document.getElementById('phone-number').focus();
});
