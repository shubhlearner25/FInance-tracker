import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import useCurrency from '../hooks/useCurrency';
import EmptyState from '../components/EmptyState';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Fetch budgets, categories, and transactions
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/transactions/categories/expense'),
        api.get('/transactions'),
      ]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
      setTransactions(transactionsRes.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch budgets or transactions', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modal handlers
  const handleOpenBudgetModal = (budget = null) => {
    setEditingBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const handleCloseBudgetModal = () => {
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleFormSubmit = async (formData, id) => {
    try {
      if (id) await api.put(`/budgets/${id}`, formData);
      else await api.post('/budgets', formData);
      fetchData();
      handleCloseBudgetModal();
    } catch (error) {
      console.error('Failed to save budget', error);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await api.delete(`/budgets/${id}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete budget', error);
      }
    }
  };

  const calculateSpent = (budget) => {
    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.addedOn);
        return (
          tx.category === budget.category &&
          txDate.getMonth() + 1 === budget.month &&
          txDate.getFullYear() === budget.year
        );
      })
      .reduce((sum, tx) => sum + tx.cost, 0);
  };

  // ------------------ Modal JSX ------------------
  const BudgetModal = ({ isOpen, onClose, onSubmit, budget, categories }) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    useEffect(() => {
      if (budget) {
        setAmount(budget.amount);
        setCategory(budget.category);
        setMonth(budget.month);
        setYear(budget.year);
      } else {
        setAmount('');
        setCategory('');
        setMonth('');
        setYear('');
      }
    }, [budget, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!amount || !category || !month || !year) return alert('All fields are required');
      onSubmit(
        { amount: Number(amount), category, month: Number(month), year: Number(year) },
        budget?._id
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
          <h2 className="text-xl font-bold mb-4">{budget ? 'Edit Budget' : 'Add Budget'}</h2>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="flex flex-col text-sm font-medium">
              Category
              <select
                className="border p-2 rounded mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

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

            <div className="flex gap-2">
              <label className="flex flex-col text-sm font-medium flex-1">
                Month
                <input
                  type="number"
                  className="border p-2 rounded mt-1"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  min="1"
                  max="12"
                  required
                />
              </label>

              <label className="flex flex-col text-sm font-medium flex-1">
                Year
                <input
                  type="number"
                  className="border p-2 rounded mt-1"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2000"
                  max="2100"
                  required
                />
              </label>
            </div>

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
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
        <div className="flex gap-4">
          <button
            onClick={() => handleOpenBudgetModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Budget
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : budgets.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-x-auto hover:shadow-lg transition-all duration-300">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgets.map((b) => {
                const spent = calculateSpent(b);
                const remaining = b.amount - spent;
                const percent = Math.min((spent / b.amount) * 100, 100).toFixed(1);

                return (
                  <tr key={b._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{b.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{`${b.month}/${b.year}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency.code,
                      }).format(b.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency.code,
                      }).format(spent)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap font-semibold ${
                        remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency.code,
                      }).format(remaining)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-1/3">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            percent < 80 ? 'bg-green-500' : percent < 100 ? 'bg-yellow-500' : 'bg-red-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{percent}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteBudget(b._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 bg-white shadow rounded-lg">
          <EmptyState message="No budgets found" />
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={handleCloseBudgetModal}
        onSubmit={handleFormSubmit}
        budget={editingBudget}
        categories={categories}
      />
    </>
  );
};

export default Budgets;
