const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3030;

// Позволяваме заявки от фронтенда
app.use(cors());
app.use(express.json());

// Няколко примерни рецепти в паметта
let recipes = [
  {
    _id: '1',
    title: 'Спагети Болонезе',
    imageUrl: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
    summary: 'Класически паста сос с кайма и домати.',
    description: 'Сварете спагетите според указанията...\nСосът се приготвя с лук, чесън, кайма и домати.'
  },
  {
    _id: '2',
    title: 'Палачинки с плодове',
    imageUrl: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
    summary: 'Пухкави палачинки със сезонни плодове.',
    description: 'Разбийте яйцата, млякото и брашното...\nИзпържете на среден огън и сервирайте с пресни плодове.'
  }
];

// GET /data/recipes - всички рецепти
app.get('/data/recipes', (req, res) => {
  res.json(recipes);
});

// GET /data/recipes/:id - детайли за една рецепта
app.get('/data/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r._id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }
  res.json(recipe);
});

// POST /data/recipes - създаване на нова рецепта
app.post('/data/recipes', (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.imageUrl || !body.description) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // PUT /data/recipes/:id - редакция на рецепта
app.put('/data/recipes/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body || {};

  const index = recipes.findIndex(r => r._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Recipe not found' });
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

// DELETE /data/recipes/:id - изтриване на рецепта
app.delete('/data/recipes/:id', (req, res) => {
  const id = req.params.id;
  const index = recipes.findIndex(r => r._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Recipe not found' });
  }

  recipes.splice(index, 1);
  res.status(204).end();
});

  const newRecipe = {
    _id: Date.now().toString(),
    title: body.title,
    imageUrl: body.imageUrl,
    summary: body.summary || '',
    description: body.description || ''
  };

  recipes.unshift(newRecipe);
  res.status(201).json(newRecipe);
});

app.listen(PORT, () => {
  console.log(`RecipeHub server is running on http://localhost:${PORT}`);
});