const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

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

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
    }
}

function readData() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return normalizeData(JSON.parse(raw));
    } catch (error) {
        const fallback = JSON.parse(JSON.stringify(DEFAULT_DATA));
        fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf8');
        return fallback;
    }
}

function writeData(data) {
    ensureDataFile();
    const normalized = normalizeData(data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
    return normalized;
}

function findUserByEmail(data, email) {
    return data.users.find((user) => String(user.email || '').toLowerCase() === String(email || '').toLowerCase()) || null;
}

function isValidEmail(email) {
    const value = String(email || '').trim();
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
}

function isValidPassword(password) {
    return String(password || '').length >= 6;
}

function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        avatar: user.avatar || ''
    };
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.get('/api/data', (req, res) => {
    res.json(readData());
});

app.put('/api/data', (req, res) => {
    const saved = writeData(req.body);
    res.json(saved);
});

app.post('/api/auth/login', (req, res) => {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
        return res.status(400).json({ error: 'fill_fields' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'invalid_email' });
    }

    const data = readData();
    const user = findUserByEmail(data, email);
    if (!user) {
        return res.status(404).json({ error: 'user_not_found' });
    }
    if (!user.password || user.password !== password) {
        return res.status(401).json({ error: 'wrong_password' });
    }

    res.json({ user: toPublicUser(user) });
});

app.post('/api/auth/register', (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'fill_required' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'invalid_email' });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'invalid_password' });
    }

    const data = readData();
    if (findUserByEmail(data, email)) {
        return res.status(409).json({ error: 'user_exists' });
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        phone: '',
        language: 'Русский',
        registered: new Date().toLocaleDateString('ru-RU'),
        password,
        avatar: '',
        applications: [],
        resume: { name, profession: '', experience: '' }
    };

    data.users.push(newUser);
    writeData(data);

    res.status(201).json({ user: toPublicUser(newUser) });
});

app.patch('/api/users/:id/profile', (req, res) => {
    const userId = Number(req.params.id);
    const name = req.body.name !== undefined ? String(req.body.name || '').trim() : undefined;
    const email = req.body.email !== undefined ? String(req.body.email || '').trim() : undefined;
    const newPassword = req.body.newPassword ? String(req.body.newPassword) : '';
    const currentPassword = req.body.currentPassword ? String(req.body.currentPassword) : '';
    const avatar = req.body.avatar;

    if (name !== undefined && !name) {
        return res.status(400).json({ error: 'fill_required' });
    }
    if (email !== undefined && !isValidEmail(email)) {
        return res.status(400).json({ error: 'invalid_email' });
    }
    if (newPassword && !isValidPassword(newPassword)) {
        return res.status(400).json({ error: 'invalid_password' });
    }

    const data = readData();
    const user = data.users.find((item) => Number(item.id) === userId);
    if (!user) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    const emailChanged = email !== undefined && email.toLowerCase() !== String(user.email || '').toLowerCase();
    const passwordChanged = Boolean(newPassword);
    if ((emailChanged || passwordChanged) && !currentPassword) {
        return res.status(400).json({ error: 'current_password_required' });
    }

    if (emailChanged || passwordChanged) {
        if (!user.password || user.password !== currentPassword) {
            return res.status(401).json({ error: 'wrong_password' });
        }
    }

    if (emailChanged) {
        const existing = findUserByEmail(data, email);
        if (existing && Number(existing.id) !== userId) {
            return res.status(409).json({ error: 'user_exists' });
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
        user.avatar = avatar || '';
    }

    writeData(data);
    res.json({ user: toPublicUser(user) });
});

app.listen(PORT, () => {
    ensureDataFile();
    console.log(`MigrantKZ server: http://localhost:${PORT}`);
});
