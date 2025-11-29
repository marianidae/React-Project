# RecipeHub – React SPA проект

RecipeHub е учебно Single Page Application (SPA), реализирано с **React**, **React Router** и **Node/Express** REST сървър.  
Целта на проекта е да демонстрира работа с:

- клиентски routing
- компоненти и state в React
- извличане и изпращане на данни към бекенд (CRUD)
- формуляри и валидация

## Структура на проекта

- `recipehub/` – фронтенд (React + Vite + Tailwind)
  - `src/App.jsx` – основното приложение, routing, страници
  - `src/index.css` – Tailwind стилове
- `recipehub-server/` – бекенд (Node.js + Express)
  - `index.js` – прост REST сървър в паметта

## Стартиране на проекта локално

### 1. Бекенд (recipehub-server)

```bash
cd recipehub-server
npm install      # само първия път
node index.js