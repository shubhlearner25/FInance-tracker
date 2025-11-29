import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import useCurrency from '../hooks/useCurrency';

const RecurringTransactions = () => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { currency } = useCurrency();

  // Fetch recurring transactions and categories
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recurringRes, categoriesRes] = await Promise.all([
        api.get('/recurring'),
        api.get('/transactions/categories'),
      ]);
      setRecurring(recurringRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch recurring transactions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const handleOpenModal = (transaction = null) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (formData, id) => {
    try {
      if (id) {
        await api.put(`/recurring/${id}`, formData);
      } else {
        await api.post('/recurring/create', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save recurring transaction', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await api.delete(`/recurring/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete recurring transaction', err);
      }
    }
  };

  // ------------------ Inline Modal Component ------------------
  const RecurringTransactionModal = ({ isOpen, onClose, onSubmit, transaction, categories }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [isIncome, setIsIncome] = useState(true);
    const [frequency, setFrequency] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');

    useEffect(() => {
      if (transaction) {
        setName(transaction.name);
        setCategory(transaction.category);
        setAmount(transaction.amount);
        setIsIncome(transaction.isIncome);
        setFrequency(transaction.frequency);
        setNextDueDate(transaction.nextDueDate.split('T')[0]); // YYYY-MM-DD
      } else {
        setName('');
        setCategory('');
        setAmount('');
        setIsIncome(true);
        setFrequency('');
        setNextDueDate('');
      }
    }, [transaction, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!name || !category || !amount || !frequency || !nextDueDate)
        return alert('All fields are required');
      onSubmit(
        {
          name,
          category,
          amount: Number(amount),
          isIncome,
          frequency,
          nextDueDate,
        },
        transaction?._id
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
          <h2 className="text-xl font-bold mb-4">
            {transaction ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {/* Name */}
            <label className="flex flex-col text-sm font-medium">
              Name
              <input
                type="text"
                className="border p-2 rounded mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            {/* Category */}
            <label className="flex flex-col text-sm font-medium">
              Category
              <select
                className="border p-2 rounded mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) =>
                  typeof c === 'string' ? (
                    <option key={c} value={c}>{c}</option>
                  ) : (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  )
                )}
              </select>
            </label>

            {/* Amount */}
            <label className="flex flex-col text-sm font-medium">
              Amount
              <input
                type="number"
                className="border p-2 rounded mt-1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>

            {/* Type */}
            <label className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={isIncome}
                onChange={() => setIsIncome(!isIncome)}
              />
              Is Income?
            </label>

            {/* Frequency */}
            <label className="flex flex-col text-sm font-medium">
              Frequency
              <input
                type="text"
                className="border p-2 rounded mt-1"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g., Monthly"
                required
              />
            </label>

            {/* Next Due Date */}
            <label className="flex flex-col text-sm font-medium">
              Next Due Date
              <input
                type="date"
                className="border p-2 rounded mt-1"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                required
              />
            </label>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ------------------ Render ------------------
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Recurring
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {recurring.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>

                  {/* Category with dropdown filter */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                    <select
                      className="mt-1 block border p-1 rounded text-sm w-full"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      {categories.map((c) =>
                        typeof c === 'string' ? (
                          <option key={c} value={c}>{c}</option>
                        ) : (
                          <option key={c._id} value={c.name}>{c.name}</option>
                        )
                      )}
                    </select>
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recurring
                  .filter((r) => !categoryFilter || r.category === categoryFilter)
                  .map((r) => (
                  <tr key={r._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{r.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{r.category}</td>
                    <td className={`px-6 py-4 whitespace-nowrap font-semibold ${r.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {r.isIncome ? '+' : '-'}
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.code }).format(r.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{r.isIncome ? 'Income' : 'Expense'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{r.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(r.nextDueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(r)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                      <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState message="No recurring transactions" />
            </div>
          )}
        </div>
      )}

      {/* Inline Modal */}
      <RecurringTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        transaction={editingTransaction}
        categories={categories}
      />
    </>
  );
};

export default RecurringTransactions;
