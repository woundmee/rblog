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

## База данных

Файл базы создаётся автоматически в корне проекта:

- `rblog.db`

Таблица `posts` создаётся при первом запуске.  
Если в БД нет записей, старые markdown-файлы из `content/posts/*.md` автоматически импортируются в SQLite один раз.
