const supabase = require('../../config/supabaseClient');
const { applyCors } = require('../../utils/auth');

module.exports = async (req, res) => {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;
  if (!id) return res.status(400).json({ message: 'Expense ID required' });

  if (req.method === 'PUT') {
    const { amount, description, category, date } = req.body || {};
    if (amount == null || !description || !category || !date) return res.status(400).json({ message: 'All fields are required' });
    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });

    const { data, error } = await supabase.from('expenses').update({ amount: numericAmount, description, category, date, updated_at: new Date() }).eq('id', id).select().single();
    if (error) return res.status(500).json({ message: 'Error updating expense', error });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) return res.status(500).json({ message: 'Error deleting expense', error });
    return res.status(200).json({ message: 'Expense deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
