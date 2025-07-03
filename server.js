// server.js - Starter Express server for Week 2 assignment
require('dotenv').config();

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

// Middleware setup
app.use(bodyParser.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || '12345';
  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ error: 'Forbidden - Invalid API Key' });
  }
  next();
});

function validateProduct(req, res, next) {
  const { name, description, price, category, inStock } = req.body;
  if (
    !name ||
    !description ||
    typeof price !== 'number' ||
    !category ||
    typeof inStock !== 'boolean'
  ) {
    return next(new ValidationError('Invalid product data'));
  }
  next();
}

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
}
);

app.get('/api/products', (req, res) => {
  res.json(products)
  let result = [...products];
});

app.get('/api/products/:id', (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));
  res.json(product);
});

app.post('/api/products', validateProduct, (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  const newProduct = {
    id: uuidv4(),
    name,
    description,
    price,
    category,
    inStock
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', validateProduct, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));

  const { name, description, price, category, inStock } = req.body;

  products[index] = {
    ...products[index],
    name,
    description,
    price,
    category,
    inStock
  };

  const updatedProduct = products[index];
  res.json(updatedProduct);
});

app.delete('/api/products/:id', (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));

  products.splice(index, 1);
  res.status(204).send();
});

app.get('/api/products/search', (req, res) => {
  const q = req.query.q?.toLowerCase();
  if (!q) return res.status(400).json({ error: 'Missing search query (q)' });

  const results = products.filter(p =>
    p.name.toLowerCase().includes(q)
  );

  res.json({ total: results.length, results });
});

app.get('/api/products/stats', (req, res) => {
  const stats = {};

  products.forEach(p => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });

  res.json(stats);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 