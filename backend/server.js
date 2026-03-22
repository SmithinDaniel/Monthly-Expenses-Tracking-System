const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const supabase = require('../api/config/supabaseClient');

const app = express();
const basePort = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
function parseMonthDateRange(monthString) {
  const [year, month] = monthString.split('-').map(Number);
  if (!year || !month) return null;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  return { start, end };
}

app.get('/api/expenses', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client not configured. Please set SUPABASE_URL and key in environment variables.' });
  }

  const month = req.query.month;
  const category = req.query.category;

  let query = supabase.from('expenses').select('*').order('date', { ascending: false });

  if (month) {
    const range = parseMonthDateRange(month);
    if (range) query = query.gte('date', range.start).lte('date', range.end);
  }

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return res.status(500).json({ message: 'Error fetching expenses', error });
  return res.json(data);
});

app.post('/api/expenses', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client not configured. Please set SUPABASE_URL and key in environment variables.' });
  }

  const { amount, description, category, date } = req.body;
  if (!amount || !description || !category || !date) return res.status(400).json({ message: 'All fields are required' });

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });

  const { data, error } = await supabase.from('expenses').insert([{ amount: numericAmount, description, category, date }]).select().single();
  if (error) return res.status(500).json({ message: 'Error adding expense', error });
  return res.status(201).json(data);
});

app.put('/api/expenses/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client not configured. Please set SUPABASE_URL and key in environment variables.' });
  }

  const { id } = req.params;
  const { amount, description, category, date } = req.body;
  if (!amount || !description || !category || !date) return res.status(400).json({ message: 'All fields are required' });

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });

  const { data, error } = await supabase.from('expenses').update({ amount: numericAmount, description, category, date, updated_at: new Date() }).eq('id', id).select().single();
  if (error) return res.status(500).json({ message: 'Error updating expense', error });
  return res.json(data);
});

app.delete('/api/expenses/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase client not configured. Please set SUPABASE_URL and key in environment variables.' });
  }

  const { id } = req.params;
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return res.status(500).json({ message: 'Error deleting expense', error });
  return res.json({ message: 'Expense deleted' });
});

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'signup.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

function startServer(port, retries = 0) {
  const maxRetries = 3;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Frontend path: ${frontendPath}`);
    console.log(`Visit http://localhost:${port} in your browser`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries < maxRetries) {
      console.warn(`Port ${port} is in use, trying ${port + 1}`);
      startServer(port + 1, retries + 1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

startServer(basePort);
