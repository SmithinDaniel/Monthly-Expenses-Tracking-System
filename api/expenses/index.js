const supabase = require('../../config/supabaseClient');
const { verifyAuthToken, applyCors } = require('../../utils/auth');

function parseRange(month) {
  const [year, mon] = (month || '').split('-').map(Number);
  if (!year || !mon) return null;
  const start = `${year}-${String(mon).padStart(2, '0')}-01`;
  const end = new Date(year, mon, 0).toISOString().split('T')[0];
  return { start, end };
}

module.exports = async (req, res) => {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyAuthToken(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const month = url.searchParams.get('month');
    const category = url.searchParams.get('category');

    let query = supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (month) {
      const range = parseRange(month);
      if (range) query = query.gte('date', range.start).lte('date', range.end);
    }
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return res.status(500).json({ message: 'Error fetching expenses', error });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { amount, description, category, date } = req.body || {};
    if (amount == null || !description || !category || !date) return res.status(400).json({ message: 'All fields are required' });

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });

    const { data, error } = await supabase.from('expenses').insert([{ user_id: user.id, amount: numericAmount, description, category, date }]).select().single();
    if (error) return res.status(500).json({ message: 'Error adding expense', error });
    return res.status(201).json(data);
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
