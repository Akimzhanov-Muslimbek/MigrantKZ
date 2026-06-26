(function (global) {
    const SHARED_DATA_KEY = 'migrantkz_shared_data_v1';
    const SHARED_UPDATE_CHANNEL = 'migrantkz_shared_data_channel';

    const DEFAULT_DATA = {
        jobs: [
            { id: 1, title: 'Водитель-международник', salary: '250 000 ₸', location: 'Алматы', company: 'ТОО "КазТрансЛогистик"', tags: ['Транспорт', 'Опыт от 3 лет'] },
            { id: 2, title: 'Сварщик', salary: '180 000 ₸', location: 'Астана', company: 'ТОО "КазСтройМонтаж"', tags: ['Строительство', 'Сертификат'] },
            { id: 3, title: 'Повар', salary: '150 000 ₸', location: 'Шымкент', company: 'Ресторан "Шахрияр"', tags: ['Общепит', 'Опыт от 1 года'] },
            { id: 4, title: 'Уборщик', salary: '120 000 ₸', location: 'Актау', company: 'ООО "КазМаркет"', tags: ['Уборка', 'Без опыта'] },
            { id: 5, title: 'Строитель', salary: '200 000 ₸', location: 'Атырау', company: 'ТОО "СтройПлюс"', tags: ['Строительство', 'Опыт от 2 лет'] },
            { id: 6, title: 'Электрик', salary: '220 000 ₸', location: 'Орал', company: 'ОАО "ЭнергоСервис"', tags: ['Электричество', 'Сертификат'] },
            { id: 7, title: 'Механик', salary: '190 000 ₸', location: 'Павлодар', company: 'ТОО "АвтоМастер"', tags: ['Автосервис', 'Опыт от 3 лет'] }
        ],
        employers: [
            { id: 1, name: 'КазТрансЛогистик', rating: 4.5, status: 'verified', description: 'Надежный работодатель с 15-летним опытом в сфере логистики.' },
            { id: 2, name: 'ТОО "КазСтройМонтаж"', rating: 4.2, status: 'verified', description: 'Строительная компания, работает по всему Казахстану.' },
            { id: 3, name: 'Ресторан "Шахрияр"', rating: 4.0, status: 'verified', description: 'Сеть ресторанов узбекской и казахской кухни.' },
            { id: 4, name: 'ООО "КазМаркет"', rating: 3.8, status: 'pending', description: 'Торговая сеть, ищет уборщиков и продавцов.' },
            { id: 5, name: 'ТОО "СтройПлюс"', rating: 4.3, status: 'verified', description: 'Профессиональная строительная организация.' }
        ],
        reviews: [
            { id: 1, company: 'КазТрансЛогистик', author: 'Александр И.', text: 'Отличная компания! Работаю уже 2 года, всегда вовремя платят.', date: '15.04.2026' },
            { id: 2, company: 'ТОО "КазСтройМонтаж"', author: 'Игорь П.', text: 'Хорошие условия труда, начальник справедливый. Рекомендую!', date: '12.04.2026' },
            { id: 3, company: 'Ресторан "Шахрияр"', author: 'Мария К.', text: 'Дружный коллектив, интересная работа. Зарплату платят в срок.', date: '10.04.2026' },
            { id: 4, company: 'КазТрансЛогистик', author: 'Камал М.', text: 'Честная компания, есть социальные гарантии для сотрудников.', date: '08.04.2026' },
            { id: 5, company: 'ТОО "СтройПлюс"', author: 'Азамат Б.', text: 'Нормальная зарплата, выплачивают все по договору.', date: '05.04.2026' }
        ],
        faq: [
            { id: 1, question: 'Как найти работу через MigrantKZ?', answer: 'Просто зарегистрируйтесь на сайте, создайте резюме и начните откликаться на вакансии.' },
            { id: 2, question: 'Как проверить работодателя?', answer: 'Введите название компании в разделе "Проверка работодателя".' },
            { id: 3, question: 'Какие документы нужны для работы в Казахстане?', answer: 'Паспорт, миграционная карта, разрешение на работу, регистрация по месту жительства.' }
        ],
        users: []
    };

    let apiAvailable = null;
    let cachedData = null;

    function getApiBase() {
        if (global.location.protocol === 'file:') {
            return 'http://localhost:3000';
        }
        if (global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1') {
            return `${global.location.protocol}//${global.location.hostname}:3000`;
        }
        return '';
    }

    const AVATAR_KEY_PREFIX = 'migrantkz_avatar_';

    function getAvatarFromStorage(userId) {
        try {
            return global.localStorage.getItem(AVATAR_KEY_PREFIX + userId) || '';
        } catch (error) {
            return '';
        }
    }

    function setAvatarInStorage(userId, dataUrl) {
        const key = AVATAR_KEY_PREFIX + userId;
        try {
            if (dataUrl) {
                global.localStorage.setItem(key, dataUrl);
            } else {
                global.localStorage.removeItem(key);
            }
        } catch (error) {
            throw new Error('avatar_storage_failed');
        }
    }

    function isValidEmail(email) {
        const value = String(email || '').trim();
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }

    function isValidPassword(password) {
        return String(password || '').length >= 6;
    }

    function validateRegistration({ name, email, password }) {
        const trimmedName = String(name || '').trim();
        const trimmedEmail = String(email || '').trim();
        if (!trimmedName || !trimmedEmail || !password) {
            return { ok: false, error: 'fill_required' };
        }
        if (!isValidEmail(trimmedEmail)) {
            return { ok: false, error: 'invalid_email' };
        }
        if (!isValidPassword(password)) {
            return { ok: false, error: 'invalid_password' };
        }
        return { ok: true, name: trimmedName, email: trimmedEmail.toLowerCase(), password };
    }

    function toPublicUser(user) {
        const storedAvatar = getAvatarFromStorage(user.id);
        const inlineAvatar = String(user.avatar || '');
        return {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            avatar: storedAvatar || (inlineAvatar.startsWith('data:') ? inlineAvatar : '')
        };
    }

    function normalizeData(data) {
        const source = data || {};
        return {
            jobs: Array.isArray(source.jobs) ? source.jobs : [],
            employers: Array.isArray(source.employers) ? source.employers : [],
            reviews: Array.isArray(source.reviews) ? source.reviews : [],
            faq: Array.isArray(source.faq) ? source.faq : [],
            users: Array.isArray(source.users) ? source.users : []
        };
    }

    function readLocalData() {
        const raw = global.localStorage.getItem(SHARED_DATA_KEY);
        if (!raw) return null;
        try {
            return normalizeData(JSON.parse(raw));
        } catch (error) {
            return null;
        }
    }

    function writeLocalData(data) {
        const normalized = normalizeData(data);
        normalized.users = normalized.users.map((user) => {
            const copy = { ...user };
            if (copy.avatar && String(copy.avatar).startsWith('data:')) {
                try {
                    setAvatarInStorage(copy.id, copy.avatar);
                } catch (error) {
                    /* keep inline if separate storage fails */
                }
                copy.avatar = '';
            }
            return copy;
        });
        try {
            global.localStorage.setItem(SHARED_DATA_KEY, JSON.stringify(normalized));
            global.localStorage.setItem(SHARED_DATA_KEY + '_updated', Date.now().toString());
        } catch (error) {
            throw new Error('storage_failed');
        }
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(SHARED_UPDATE_CHANNEL);
            channel.postMessage({ type: 'shared-data-updated' });
            channel.close();
        }
        cachedData = normalized;
        return normalized;
    }

    async function checkApi() {
        if (apiAvailable !== null) return apiAvailable;
        const base = getApiBase();
        if (!base) {
            apiAvailable = false;
            return false;
        }
        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
            const response = await fetch(`${base}/api/health`, {
                method: 'GET',
                signal: controller ? controller.signal : undefined
            });
            if (timeoutId) clearTimeout(timeoutId);
            apiAvailable = response.ok;
        } catch (error) {
            apiAvailable = false;
        }
        return apiAvailable;
    }

    async function loadData(forceRefresh) {
        if (!forceRefresh && cachedData) return cachedData;

        if (await checkApi()) {
            try {
                const response = await fetch(`${getApiBase()}/api/data`);
                if (response.ok) {
                    const data = normalizeData(await response.json());
                    writeLocalData(data);
                    return data;
                }
            } catch (error) {
                apiAvailable = false;
            }
        }

        const local = readLocalData();
        if (local) {
            cachedData = local;
            return local;
        }

        const defaults = JSON.parse(JSON.stringify(DEFAULT_DATA));
        writeLocalData(defaults);
        return defaults;
    }

    async function saveData(data) {
        const normalized = writeLocalData(data);
        if (await checkApi()) {
            try {
                await fetch(`${getApiBase()}/api/data`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(normalized)
                });
            } catch (error) {
                apiAvailable = false;
            }
        }
        return normalized;
    }

    function findUserByEmail(data, email) {
        const list = normalizeData(data).users;
        return list.find((user) => String(user.email || '').toLowerCase() === String(email || '').toLowerCase()) || null;
    }

    async function login(email, password) {
        const trimmedEmail = String(email || '').trim();
        if (!trimmedEmail || !password) {
            return { ok: false, error: 'fill_fields' };
        }
        if (!isValidEmail(trimmedEmail)) {
            return { ok: false, error: 'invalid_email' };
        }

        if (await checkApi()) {
            try {
                const response = await fetch(`${getApiBase()}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: trimmedEmail, password })
                });
                const payload = await response.json();
                if (!response.ok) {
                    return { ok: false, error: payload.error || 'login_failed' };
                }
                cachedData = await loadData(true);
                return { ok: true, user: payload.user };
            } catch (error) {
                apiAvailable = false;
            }
        }

        const data = await loadData();
        const existingUser = findUserByEmail(data, trimmedEmail);
        if (!existingUser) {
            return { ok: false, error: 'user_not_found' };
        }
        if (!existingUser.password || existingUser.password !== password) {
            return { ok: false, error: 'wrong_password' };
        }
        return {
            ok: true,
            user: toPublicUser(existingUser)
        };
    }

    async function register(user) {
        const validation = validateRegistration(user);
        if (!validation.ok) {
            return validation;
        }

        const payload = {
            name: validation.name,
            email: validation.email,
            password: validation.password
        };

        if (await checkApi()) {
            try {
                const response = await fetch(`${getApiBase()}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const body = await response.json();
                if (!response.ok) {
                    return { ok: false, error: body.error || 'register_failed' };
                }
                cachedData = await loadData(true);
                return { ok: true, user: body.user };
            } catch (error) {
                apiAvailable = false;
            }
        }

        const data = await loadData();
        if (findUserByEmail(data, payload.email)) {
            return { ok: false, error: 'user_exists' };
        }

        const newUser = {
            id: Date.now(),
            name: payload.name,
            email: payload.email.toLowerCase(),
            phone: '',
            language: 'Русский',
            registered: new Date().toLocaleDateString('ru-RU'),
            password: payload.password,
            avatar: '',
            applications: [],
            resume: { name: payload.name, profession: '', experience: '' }
        };
        data.users.push(newUser);
        await saveData(data);
        return { ok: true, user: toPublicUser(newUser) };
    }

    async function updateProfile(userId, profile) {
        const name = profile.name !== undefined ? String(profile.name || '').trim() : undefined;
        const email = profile.email !== undefined ? String(profile.email || '').trim().toLowerCase() : undefined;
        const newPassword = profile.newPassword ? String(profile.newPassword) : '';
        const currentPassword = profile.currentPassword ? String(profile.currentPassword) : '';
        const avatar = profile.avatar;

        if (name !== undefined && !name) {
            return { ok: false, error: 'fill_required' };
        }
        if (email !== undefined && !isValidEmail(email)) {
            return { ok: false, error: 'invalid_email' };
        }
        if (newPassword && !isValidPassword(newPassword)) {
            return { ok: false, error: 'invalid_password' };
        }

        async function applyProfileUpdate(data) {
            let user = data.users.find((item) => Number(item.id) === Number(userId));
            if (!user && email) {
                user = findUserByEmail(data, email);
            }
            if (!user && profile.lookupEmail) {
                user = findUserByEmail(data, profile.lookupEmail);
            }
            if (!user) {
                return { ok: false, error: 'user_not_found' };
            }

            const emailChanged = email !== undefined && email !== String(user.email || '').toLowerCase();
            const passwordChanged = Boolean(newPassword);

            if ((emailChanged || passwordChanged) && !currentPassword) {
                return { ok: false, error: 'current_password_required' };
            }

            if (emailChanged || passwordChanged) {
                if (!user.password || user.password !== currentPassword) {
                    return { ok: false, error: 'wrong_password' };
                }
            }

            if (emailChanged) {
                const existing = findUserByEmail(data, email);
                if (existing && Number(existing.id) !== Number(user.id)) {
                    return { ok: false, error: 'user_exists' };
                }
                user.email = email;
            }

            if (name !== undefined) {
                user.name = name;
                if (user.resume && typeof user.resume === 'object') {
                    user.resume.name = name;
                }
            }

            if (passwordChanged) {
                user.password = newPassword;
            }

            if (avatar !== undefined) {
                try {
                    if (avatar && String(avatar).startsWith('data:')) {
                        setAvatarInStorage(user.id, avatar);
                        user.avatar = '';
                    } else {
                        setAvatarInStorage(user.id, '');
                        user.avatar = '';
                    }
                } catch (error) {
                    return { ok: false, error: 'avatar_storage_failed' };
                }
            }

            try {
                await saveData(data);
            } catch (error) {
                return { ok: false, error: 'storage_failed' };
            }
            return { ok: true, user: toPublicUser(user) };
        }

        if (await checkApi()) {
            try {
                const response = await fetch(`${getApiBase()}/api/users/${userId}/profile`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, newPassword, currentPassword, avatar })
                });
                const body = await response.json();
                if (response.ok) {
                    if (avatar !== undefined && body.user) {
                        if (avatar && String(avatar).startsWith('data:')) {
                            setAvatarInStorage(body.user.id, avatar);
                        } else if (!avatar) {
                            setAvatarInStorage(body.user.id, '');
                        }
                    }
                    cachedData = await loadData(true);
                    const refreshed = cachedData.users.find((item) => Number(item.id) === Number(userId));
                    return { ok: true, user: refreshed ? toPublicUser(refreshed) : body.user };
                }
                if (body.error !== 'user_not_found') {
                    return { ok: false, error: body.error || 'profile_update_failed' };
                }
            } catch (error) {
                apiAvailable = false;
            }
        }

        const data = await loadData(false);
        return applyProfileUpdate(data);
    }

    async function updateUser(userId, updates) {
        const data = await loadData();
        const user = data.users.find((item) => Number(item.id) === Number(userId));
        if (!user) return null;

        Object.assign(user, updates);
        await saveData(data);
        return user;
    }

    async function addApplication(userId, application) {
        const data = await loadData();
        const user = data.users.find((item) => Number(item.id) === Number(userId));
        if (!user) return null;
        user.applications = Array.isArray(user.applications) ? user.applications : [];
        user.applications.unshift(application);
        await saveData(data);
        return user.applications;
    }

    async function deleteUser(userId) {
        const data = await loadData();
        data.users = data.users.filter((user) => Number(user.id) !== Number(userId));
        await saveData(data);
        return data.users;
    }

    global.MigrantKZApi = {
        SHARED_DATA_KEY,
        SHARED_UPDATE_CHANNEL,
        DEFAULT_DATA,
        getApiBase,
        checkApi,
        loadData,
        saveData,
        findUserByEmail,
        login,
        register,
        updateUser,
        updateProfile,
        addApplication,
        deleteUser,
        isValidEmail,
        isValidPassword,
        validateRegistration,
        getAvatarFromStorage,
        normalizeData,
        invalidateCache() {
            cachedData = null;
            apiAvailable = null;
        }
    };
})(window);
