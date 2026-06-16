# Рагулин Роман — Платформа персонального бренда

Премиальный сайт для ведущего эксперта по недвижимости Рагулина Романа Александровича (компания «Этажи», Москва) с полноценной административной панелью.

## Технологический стек

**Backend:** FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL · JWT · Pydantic v2
**Frontend:** React 19 · TypeScript · Vite · TanStack Query · Tailwind CSS · Framer Motion

## Структура проекта

```
├── backend/
│   ├── app/
│   │   ├── api/endpoints/     # auth, properties, reviews, seo, uploads
│   │   ├── core/              # config, security, deps
│   │   ├── db/                # session, base
│   │   ├── models/            # Property, Review, User, SEOPage
│   │   └── schemas/           # Pydantic schemas
│   ├── alembic/                # Миграции БД
│   ├── static/uploads/         # Загруженные изображения
│   └── main.py
├── frontend/
│   └── src/
│       ├── api/                # axios клиенты
│       ├── components/         # layout, ui, property, home, admin
│       ├── pages/              # Публичные + admin страницы
│       ├── types/               # TypeScript типы
│       └── utils/               # format, auth, cn
└── deploy/                      # systemd-сервис и nginx-конфиг для продакшена
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

## Контакты специалиста

**Рагулин Роман Александрович**
Ведущий эксперт по недвижимости · Компания «Этажи»
Москва, Балтийская 9
+7 910 277-52-12 · r.a.ragulin@msk.etagi.com
