// index.js - прост REST сървър за RecipeHub с потребители и рецепти

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3030;

app.use(cors());
app.use(express.json());

// ===== In-memory "база данни" =====
let users = []; // { _id, email, password }
let sessions = []; // { token, userId }

let recipes = [
  {
    _id: '1',
    _ownerId: null,
    title: 'Спагети Болонезе',
    imageUrl: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
    summary: 'Класически паста сос с кайма и домати.',
    description:
      'Сварете спагетите според указанията на опаковката.\nСосът се приготвя с лук, чесън, кайма и домати.'
  },
  {
    _id: '2',
    _ownerId: null,
    title: 'Палачинки с плодове',
    imageUrl: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
    summary: 'Пухкави палачинки със сезонни плодове.',
    description:
      'Разбийте яйцата, млякото и брашното.\nИзпържете на среден огън и сервирайте с пресни плодове.'
  }
];

// ===== Хелпери за auth =====
function createToken(userId) {
  const token = randomUUID();
  sessions.push({ token, userId });
  return token;
}

function getUserByToken(token) {
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  return users.find((u) => u._id === session.userId) || null;
}

function authMiddleware(req, res, next) {
  const token = req.header('X-Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid access token' });
  }
  req.user = user;
  req.token = token;
  next();
}

// ===== Auth маршрути =====

// POST /users/register
app.post('/users/register', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и парола са задължителни.' });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({ message: 'Този email вече е регистриран.' });
  }

  const user = {
    _id: randomUUID(),
    email,
    password // За учебни цели държим plain text
  };
  users.push(user);

  const accessToken = createToken(user._id);

  res.status(201).json({
    _id: user._id,
    email: user.email,
    accessToken
  });
});

// POST /users/login
app.post('/users/login', (req, res) => {
  const { email, password } = req.body || {};

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Невалидни данни за вход.' });
  }

  const accessToken = createToken(user._id);

  res.json({
    _id: user._id,
    email: user.email,
    accessToken
  });
});

// GET /users/logout
app.get('/users/logout', (req, res) => {
  const token = req.header('X-Authorization');
  if (token) {
    sessions = sessions.filter((s) => s.token !== token);
  }
  res.status(204).end();
});

// ===== Recipes API =====

// GET /data/recipes - всички рецепти
app.get('/data/recipes', (req, res) => {
  res.json(recipes);
});

// GET /data/recipes/:id - детайли
app.get('/data/recipes/:id', (req, res) => {
  const recipe = recipes.find((r) => r._id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }
  res.json(recipe);
});

// POST /data/recipes - създаване (само логнат потребител)
app.post('/data/recipes', authMiddleware, (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.imageUrl || !body.description) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const newRecipe = {
    _id: randomUUID(),
    _ownerId: req.user._id,
    title: body.title,
    imageUrl: body.imageUrl,
    summary: body.summary || '',
    description: body.description || ''
  };

  recipes.unshift(newRecipe);
  res.status(201).json(newRecipe);
});

// PUT /data/recipes/:id - редакция (само автор)
app.put('/data/recipes/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const body = req.body || {};

  const index = recipes.findIndex((r) => r._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Recipe not found' });
  }

  if (recipes[index]._ownerId !== req.user._id) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  if (!body.title || !body.imageUrl || !body.description) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const updated = {
    ...recipes[index],
    title: body.title,
    imageUrl: body.imageUrl,
    summary: body.summary || '',
    description: body.description || ''
  };

  recipes[index] = updated;
  res.json(updated);
});

// DELETE /data/recipes/:id - изтриване (само автор)
app.delete('/data/recipes/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const index = recipes.findIndex((r) => r._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Recipe not found' });
  }

  if (recipes[index]._ownerId !== req.user._id) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  recipes.splice(index, 1);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`RecipeHub server is running on http://localhost:${PORT}`);
});