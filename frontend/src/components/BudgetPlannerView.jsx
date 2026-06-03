import React, { useState, useMemo } from "react";
import { Plus, X, Trash2, Edit2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from "recharts";

export default function BudgetPlannerView({ portfolio, onAdd, onUpdate, onDelete }) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [salaryInput, setSalaryInput] = useState("");
  const [expenseForm, setExpenseForm] = useState({ category: "Food & Dining", amount: "", description: "" });

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val || 0);

  const budgets = portfolio?.budgets || [];
  const activeBudget = budgets.find(b => b.month_id === selectedMonth);
  const CATEGORIES = [
    "Housing & Utilities", "Food & Dining", "Transportation",
    "Entertainment", "Shopping", "Health & Fitness",
    "Education", "Miscellaneous", "Bills", "Loan EMI",
    "Insurance Premiums", "Investment", "Savings", "Family Transfer"
  ];

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#64748b'];

  const handleUpdateSalary = (e) => {
    e.preventDefault();
    const newSalary = parseFloat(salaryInput);
    if (activeBudget) {
      onUpdate("budgets", activeBudget.id, { ...activeBudget, inhand_salary: newSalary });
    } else {
      onAdd("budgets", { month_id: selectedMonth, inhand_salary: newSalary, expenses: [] });
    }
    setIsSalaryModalOpen(false);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const newExpense = {
      id: "exp_" + Math.random().toString(36).substr(2, 9),
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description
    };

    if (activeBudget) {
      onUpdate("budgets", activeBudget.id, { ...activeBudget, expenses: [...activeBudget.expenses, newExpense] });
    } else {
      onAdd("budgets", { month_id: selectedMonth, inhand_salary: 0, expenses: [newExpense] });
    }

    setExpenseForm({ category: "Food & Dining", amount: "", description: "" });
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (expenseId) => {
    if (!activeBudget) return;
    const newExpenses = activeBudget.expenses.filter(e => e.id !== expenseId);
    onUpdate("budgets", activeBudget.id, { ...activeBudget, expenses: newExpenses });
  };

  const expenses = activeBudget?.expenses || [];
  const inhandSalary = activeBudget?.inhand_salary || 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingSavings = inhandSalary - totalExpenses;

  // Aggregate expenses for PieChart
  const pieData = useMemo(() => {
    const agg = {};
    expenses.forEach(e => {
      agg[e.category] = (agg[e.category] || 0) + e.amount;
    });
    return Object.keys(agg).map(key => ({ name: key, value: agg[key] })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const barData = [
    {
      name: "Cashflow",
      Income: inhandSalary,
      Expenses: totalExpenses,
    }
  ];

  return (
    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "40px" }}>

      {/* Top Header & Month Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>Monthly Budget Planner</h2>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>Manage isolated cashflows separately from Core Net Worth</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 14px", outline: "none", fontSize: "14px" }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", position: "relative" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", textTransform: "uppercase" }}>Inhand Salary</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#fff", marginTop: "12px" }}>{formatINR(inhandSalary)}</div>
          <button onClick={() => { setSalaryInput(inhandSalary || ""); setIsSalaryModalOpen(true); }} style={{ position: "absolute", top: "30px", right: "30px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={16} /></button>
        </div>

        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", textTransform: "uppercase" }}>Total Allocated</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#f43f5e", marginTop: "12px" }}>{formatINR(totalExpenses)}</div>
        </div>

        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", textTransform: "uppercase" }}>Remaining / Savings</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: remainingSavings >= 0 ? "#10b981" : "#e11d48", marginTop: "12px" }}>{formatINR(remainingSavings)}</div>
        </div>
      </div>

      {/* Visualizers Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        {/* Expenses PieChart */}
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", height: "350px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "10px", fontWeight: "700" }}>Allocation Distribution</h3>
          {pieData.length > 0 ? (
            <div style={{ flex: 1, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatINR(value)} contentStyle={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Legend iconSize={8} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: -10, fontSize: "11px", color: "var(--text-secondary)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "13px" }}>No allocations planned this month</div>
          )}
        </div>

        {/* Income vs Expense BarChart */}
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", height: "350px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "30px", fontWeight: "700" }}>Cashflow Overview</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, Math.max(inhandSalary, totalExpenses) * 1.1]} />
                <RechartsTooltip formatter={(value) => formatINR(value)} cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Legend iconSize={8} wrapperStyle={{ paddingTop: "20px", fontSize: "11px", color: "var(--text-secondary)" }} />
                <Bar dataKey="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Expenses" name="Allocated" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>Planned Allocations</h3>
        <button onClick={() => setIsExpenseModalOpen(true)} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "10px 20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={14} /> Add Allocation
        </button>
      </div>

      <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden", minHeight: "200px" }}>
        {expenses.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--text-secondary)" }}>
            No allocations recorded yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CATEGORY</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>DESCRIPTION</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>AMOUNT</th>
                <th style={{ padding: "16px 24px", width: "50px" }}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "18px 24px", color: "#fff", fontWeight: "600" }}>{exp.category}</td>
                  <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{exp.description || "-"}</td>
                  <td style={{ padding: "18px 24px", textAlign: "right", color: "#f43f5e", fontWeight: "700" }}>{formatINR(exp.amount)}</td>
                  <td style={{ padding: "18px 24px", textAlign: "right" }}>
                    <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Salary Setup Modal */}
      {isSalaryModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "420px", padding: "40px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#3b82f6" }} />
            <button onClick={() => setIsSalaryModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>Set Monthly Income</h3>
            <form onSubmit={handleUpdateSalary} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Inhand Salary (₹)</label>
                <input type="number" step="any" required value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
              </div>
              <button type="submit" style={{ background: "#3b82f6", color: "#ffffff", border: "none", padding: "16px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: "10px" }}>Save Income</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "420px", padding: "40px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#f43f5e" }} />
            <button onClick={() => setIsExpenseModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>Plan Allocation</h3>
            <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Category</label>
                <select required value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#0a0a0d" }}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Amount (₹)</label>
                <input type="number" step="any" required value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Description</label>
                <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Groceries" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
              </div>
              <button type="submit" style={{ background: "#f43f5e", color: "#ffffff", border: "none", padding: "16px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: "10px" }}>Add Allocation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
