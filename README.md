# Рагулин Роман — Платформа персонального бренда

Премиальный сайт для ведущего эксперта по недвижимости Рагулина Романа Александровича (компания «Этажи», Москва) с полноценной административной панелью.

## Технологический стек

**Backend:** FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL · JWT · Pydantic v2  
**Frontend:** React 19 · TypeScript · Vite · TanStack Query · Tailwind CSS · Framer Motion

## Быстрый старт (Docker)

```bash
# 1. Скопировать переменные среды
cp backend/.env.example backend/.env

# 2. Запустить через Docker Compose
docker-compose up -d

# Сайт: http://localhost
# Admin: http://localhost/admin
# API docs: http://localhost:8000/api/docs
```

## Разработка без Docker

### Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# Установить зависимости
pip install -r requirements.txt

# Скопировать .env
cp .env.example .env
# Отредактировать DATABASE_URL в .env

# Создать базу данных PostgreSQL
createdb ragulin_db

# Применить миграции
alembic upgrade head

# Запустить сервер (создаёт admin пользователя автоматически)
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Открыть: http://localhost:5173
```

## Доступы по умолчанию

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@ragulin.ru | Admin123! |

> Измените пароль в `backend/.env` перед деплоем!

## Структура проекта

```
├── backend/
│   ├── app/
│   │   ├── api/endpoints/     # auth, properties, reviews, seo, uploads
│   │   ├── core/              # config, security, deps
│   │   ├── db/                # session, base
│   │   ├── models/            # Property, Review, User, SEOPage
│   │   └── schemas/           # Pydantic schemas
│   ├── alembic/               # Миграции БД
│   ├── static/uploads/        # Загруженные изображения
│   └── main.py
├── frontend/
│   └── src/
│       ├── api/               # axios клиенты
│       ├── components/        # layout, ui, property, home, admin
│       ├── pages/             # Публичные + admin страницы
│       ├── types/             # TypeScript типы
│       └── utils/             # format, auth, cn
└── docker-compose.yml
```

## API Endpoints

```
POST   /api/v1/auth/login                    # JWT авторизация
GET    /api/v1/auth/me                       # Текущий пользователь

GET    /api/v1/properties                    # Список с фильтрами
GET    /api/v1/properties/featured           # Избранные объекты
GET    /api/v1/properties/{slug}             # Один объект
POST   /api/v1/properties                    # Создать [admin]
PUT    /api/v1/properties/{id}               # Обновить [admin]
DELETE /api/v1/properties/{id}              # Удалить [admin]
POST   /api/v1/properties/{id}/images       # Загрузить фото [admin]
DELETE /api/v1/properties/{id}/images/{img} # Удалить фото [admin]

GET    /api/v1/reviews                       # Опубликованные отзывы
POST   /api/v1/reviews                       # Создать отзыв
GET    /api/v1/reviews/admin                 # Все отзывы [admin]
PUT    /api/v1/reviews/{id}                  # Обновить [admin]
DELETE /api/v1/reviews/{id}                  # Удалить [admin]

GET    /api/v1/seo/{page}                    # SEO страницы
PUT    /api/v1/seo/{page}                    # Обновить SEO [admin]
```

## Страницы сайта

| Маршрут | Описание |
|---------|----------|
| `/` | Главная: hero, статистика, преимущества, объекты, отзывы |
| `/catalog` | Каталог с фильтрацией без перезагрузки |
| `/property/:slug` | Карточка объекта: галерея, карта, форма связи |
| `/about` | Биография, опыт, этапы работы |
| `/reviews` | Отзывы + форма отправки |
| `/contacts` | Карта, форма, мессенджеры |
| `/admin` | Панель управления |
| `/admin/properties` | Управление объектами |
| `/admin/reviews` | Модерация отзывов |
| `/admin/seo` | SEO настройки страниц |

## Деплой на сервер (Ubuntu, без Docker)

Backend работает как systemd-сервис (uvicorn), frontend собирается в статику и раздаётся через Nginx,
который также проксирует `/api` и `/static` на backend.

### Первоначальная настройка сервера

```bash
# Системные пакеты
apt update && apt install -y python3-venv python3-pip nginx postgresql nodejs npm git

# Клонировать репозиторий
mkdir -p /opt && cd /opt
git clone https://github.com/scencort/ragulin-realty.git
cd ragulin-realty

# Backend: venv + зависимости
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env
nano .env   # прописать DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS (домен), ADMIN_PASSWORD
venv/bin/alembic upgrade head
cd ..

# Frontend: сборка
cd frontend && npm ci && npm run build && cd ..

# systemd-сервис backend
cp deploy/ragulin-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ragulin-backend

# Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/ragulin-realty
# отредактировать YOUR_DOMAIN на свой домен
ln -s /etc/nginx/sites-available/ragulin-realty /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL
certbot --nginx -d твой-домен.ru -d www.твой-домен.ru
```

### Обновление (после первоначальной настройки)

```bash
cd /opt/ragulin-realty
./deploy.sh
```

Скрипт сам подтягивает изменения из git, ставит зависимости, прогоняет миграции,
пересобирает фронтенд и перезапускает backend + Nginx.

## Контакты специалиста

**Рагулин Роман Александрович**  
Ведущий эксперт по недвижимости · Компания «Этажи»  
Москва, Балтийская 9  
+7 910 277-52-12 · r.a.ragulin@msk.etagi.com
