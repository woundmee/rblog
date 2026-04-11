# rblog

Современный IT-блог с адаптивным light/dark UI, верхним navbar и админ-панелью.

## Что реализовано

- хранение статей в SQLite (`rblog.db`)
- автоматическая генерация slug при создании статьи
- верхний navbar: логотип, разделы, поиск, вход в админку, переключатель темы
- поиск статей по заголовкам
- markdown-редактор с live preview
- хоткеи редактора: `Cmd/Ctrl+B`, `Cmd/Ctrl+I`, `Cmd/Ctrl+U`, `Cmd/Ctrl+~`
- цветовое выделение текста в markdown через токены `{{blue|текст}}`
- подсветка кода в markdown-блоках по языкам (`go`, `csharp`, `ts`, `js` и др.)
- редактирование опубликованных статей в админке

## Запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Если появляется ошибка `Module not found: Can't resolve 'better-sqlite3'`, выполни `npm install` в корне проекта ещё раз.

Открыть:

- Блог: `http://localhost:3000`
- Админ-вход: `http://localhost:3000/admin/login`
- Новая статья: `http://localhost:3000/admin/new`

## Безопасность админ-панели

В проекте добавлены:

- вход только по `ADMIN_PASSWORD_HASH` в production
- подпись сессионного cookie через `ADMIN_SECRET`
- `HttpOnly + Secure + SameSite=Strict` cookie
- ограничение попыток входа (rate-limit + lock)
- проверка `Origin/Referer` для админских mutating API (`POST/PUT/DELETE`)

### Подготовка production-конфига

1. Сгенерируй hash пароля:

```bash
npm run admin:hash -- "your-strong-password"
```

Команда уже выводит значение в правильном формате для `.env.local` (с экранированными `\$`).

2. Сгенерируй `ADMIN_SECRET` (пример):

```bash
openssl rand -base64 48
```

3. Заполни `.env.local` (или переменные окружения на хостинге):

```env
ADMIN_USERNAME=your-login
ADMIN_PASSWORD_HASH=scrypt\$16384\$8\$1\$...
ADMIN_SECRET=very-long-random-secret-at-least-32-chars
ADMIN_SESSION_TTL_SECONDS=43200
ADMIN_RATE_LIMIT_MAX_ATTEMPTS=5
ADMIN_RATE_LIMIT_WINDOW_SECONDS=900
ADMIN_RATE_LIMIT_LOCK_SECONDS=900
TRUST_PROXY_HEADERS=0
```

### Что означает каждая переменная

- `ADMIN_USERNAME` — логин для входа в админку.
- `ADMIN_PASSWORD_HASH` — hash пароля (сам пароль в `.env` хранить не нужно).
  Важно: в `.env` символы `$` должны быть экранированы как `\$`.
- `ADMIN_SECRET` — секрет для подписи админ-сессии (cookie token).  
  Если его поменять, текущие админ-сессии станут невалидными и потребуется повторный вход.
- `ADMIN_PASSWORD` — legacy fallback только для локальной разработки, когда не задан `ADMIN_PASSWORD_HASH`.  
  Для production лучше не использовать.
- `TRUST_PROXY_HEADERS` — доверять ли `x-forwarded-*` заголовкам (`1`/`true`) для Origin-check и rate-limit по IP.  
  По умолчанию `0` (безопаснее). Включай `1` только если reverse proxy гарантированно очищает поддельные заголовки от клиента.

### Если забыл пароль

1. Сгенерируй новый hash:

```bash
npm run admin:hash -- "your-new-strong-password"
```

2. Замени значение `ADMIN_PASSWORD_HASH` в `.env.local` (или в env на сервере).
3. Перезапусти приложение.

### Если сработал rate-limit

Сними блокировку командой:

```bash
npm run admin:unlock
```

Команда очищает таблицу `admin_login_attempts` в `rblog.db`.

### Если вход не работает после вставки hash

Частая причина: hash вставлен без экранирования `$`, и Next.js \"ломает\" значение при загрузке `.env`.  
Должно быть так:

```env
ADMIN_PASSWORD_HASH=scrypt\$16384\$8\$1\$...
```

### Нужно ли оставлять `ADMIN_PASSWORD`

Если у тебя уже заполнен `ADMIN_PASSWORD_HASH`, то `ADMIN_PASSWORD` можно удалить или закомментировать.  
Рекомендуется оставить только:

```env
ADMIN_USERNAME=...
ADMIN_PASSWORD_HASH=...
ADMIN_SECRET=...
```

### `ADMIN_SECRET` и `ADMIN_PASSWORD_HASH` вместе

`ADMIN_PASSWORD_HASH` проверяет пароль во время входа, а `ADMIN_SECRET` подписывает админ-сессию (cookie token) после входа.  
Поэтому даже если `ADMIN_PASSWORD_HASH` уже задан, `ADMIN_SECRET` все равно обязателен.

Сгенерировать `ADMIN_SECRET` можно так:

```bash
openssl rand -base64 48
```

Если потом изменить `ADMIN_SECRET`, все текущие админ-сессии автоматически завершатся и потребуется войти заново.

## База данных

Файл базы создаётся автоматически в корне проекта:

- `rblog.db`

Таблица `posts` создаётся при первом запуске.  
Если в БД нет записей, старые markdown-файлы из `content/posts/*.md` автоматически импортируются в SQLite один раз.


## Для обновлений проект на удаленном сервере
cd /var/www/rblog
git pull
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 20
npm ci
npm run build
systemctl restart rblog
