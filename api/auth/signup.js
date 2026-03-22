const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabaseClient');
const { applyCors } = require('../../utils/auth');

module.exports = async (req, res) => {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const { data: existingUser, error: existingError } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existingError) return res.status(500).json({ message: 'Error checking existing user' });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{ email, password: hashed }]).select().single();
    if (error) return res.status(500).json({ message: 'Error creating user' });

    const token = jwt.sign({ id: data.id, email: data.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.status(201).json({ message: 'Account created successfully', token, user: { id: data.id, email: data.email } });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
