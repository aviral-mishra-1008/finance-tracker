import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, RadialBarChart, RadialBar, Legend, AreaChart, Area, XAxis, YAxis } from "recharts";

export default function LoansView({ portfolio, onAdd, onUpdate, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);
  const [isPmtModalOpen, setIsPmtModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({});
  const [emiData, setEmiData] = useState({ start_date: "", emi: "", interest_rate: "" });
  const [pmtData, setPmtData] = useState({ date: "", amount: "" });

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val || 0);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ name: "", principal: "", annual_interest_rate: "", emi_schedule: [], one_time_payments: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      principal: parseFloat(formData.principal || 0),
      annual_interest_rate: parseFloat(formData.annual_interest_rate || 0),
      emi_schedule: formData.emi_schedule || [],
      one_time_payments: formData.one_time_payments || []
    };
    if (editingItem) {
      onUpdate("loans", editingItem.id, payload);
    } else {
      onAdd("loans", payload);
    }
    setIsModalOpen(false);
  };

  const handleAddEmi = (e) => {
    e.preventDefault();
    const loan = portfolio.loans.find(l => l.id === selectedLoanId);
    if (!loan) return;
    const newEmi = { 
      start_date: emiData.start_date, 
      emi: parseFloat(emiData.emi),
      interest_rate: emiData.interest_rate ? parseFloat(emiData.interest_rate) : null
    };
    const payload = { ...loan, emi_schedule: [...(loan.emi_schedule || []), newEmi] };
    onUpdate("loans", selectedLoanId, payload);
    setIsEmiModalOpen(false);
    setEmiData({ start_date: "", emi: "", interest_rate: "" });
  };

  const handleAddPmt = (e) => {
    e.preventDefault();
    const loan = portfolio.loans.find(l => l.id === selectedLoanId);
    if (!loan) return;
    const newPmt = { date: pmtData.date, amount: parseFloat(pmtData.amount) };
    const payload = { ...loan, one_time_payments: [...(loan.one_time_payments || []), newPmt] };
    onUpdate("loans", selectedLoanId, payload);
    setIsPmtModalOpen(false);
    setPmtData({ date: "", amount: "" });
  };

  const loans = portfolio?.loans || [];
  
  // Visualizer Data
  const pieData = loans.map(l => ({ name: l.name, value: l.remaining_principal }));
  const COLORS = ['#e11d48', '#be123c', '#9f1239', '#fb7185', '#fda4af', '#fecdd3'];
  const GREEN_COLORS = ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7', '#a7f3d0'];

  // Interactive Calculator State
  const [calcData, setCalcData] = useState({ principal: 639000, rate: 7.8, emi: 10000 });
  const [calcResult, setCalcResult] = useState(null);

  React.useEffect(() => {
    let p = parseFloat(calcData.principal) || 0;
    let r = parseFloat(calcData.rate) || 0;
    let e = parseFloat(calcData.emi) || 0;

    if (p > 0 && e > 0) {
      let months = 0;
      let totalInterest = 0;
      let currentP = p;
      let safeBreak = 0;
      let timeline = [];
      
      while (currentP > 0 && safeBreak < 1200) {
        if (months % 6 === 0 || currentP <= 0) {
            timeline.push({ month: `Mo ${months}`, balance: Math.round(currentP) });
        }
        let interest = currentP * (r / 100) / 12;
        currentP += interest;
        if (currentP < e) {
          totalInterest += interest;
          currentP = 0;
        } else {
          currentP -= e;
          totalInterest += interest;
        }
        months++;
        safeBreak++;
      }
      
      if (safeBreak >= 1200) {
         setCalcResult({ error: "EMI is too low to cover monthly interest. Loan will never be paid off!" });
      } else {
         timeline.push({ month: `Mo ${months}`, balance: 0 });
         let years = Math.floor(months / 12);
         let remMonths = months % 12;
         let timeStr = years > 0 ? `${years} Yrs, ${remMonths} Mos` : `${months} Months`;
         setCalcResult({ months, timeStr, totalInterest, timeline });
      }
    } else {
      setCalcResult(null);
    }
  }, [calcData]);

  return (
    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Top Visualizers Section */}
      {loans.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", height: "350px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "20px", fontWeight: "700" }}>Debt Distribution</h3>
            <div style={{ flex: 1, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatINR(value)} contentStyle={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "1px" }}>TOTAL</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>{formatINR(portfolio?.summary?.loans_total || 0)}</div>
              </div>
            </div>
          </div>
          
          <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", height: "350px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "20px", fontWeight: "700" }}>Repayment Progress</h3>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="45%" innerRadius="40%" outerRadius="90%" barSize={12} data={loans.map((l, i) => ({ name: l.name, progress: l.principal > 0 ? Math.min((l.total_paid / l.principal) * 100, 100) : 0, fill: GREEN_COLORS[i % GREEN_COLORS.length] }))}>
                  <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.04)' }} clockWise dataKey="progress" cornerRadius={10} />
                  <RechartsTooltip formatter={(value) => `${value.toFixed(1)}% Paid`} contentStyle={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: "20px", fontSize: "11px", color: "var(--text-secondary)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Controls Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>Active Liabilities & Credit Lines</h2>
        <button onClick={handleOpenAddModal} style={{ background: "transparent", color: "#fff", border: "1px solid #e11d48", padding: "12px 24px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#e11d48"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <Plus size={16} /> Add Loan
        </button>
      </div>

      {/* Main List */}
      <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
        {loans.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px", textAlign: "center" }}>
            <AlertCircle size={44} strokeWidth={1.2} style={{ color: "#e11d48", marginBottom: "20px", opacity: 0.8 }} />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "8px", color: "#ffffff" }}>No Active Loans</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Record your debt obligations to track principal reduction.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>LOAN DETAILS</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>ORIGINAL PRINCIPAL</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>TOTAL REPAID</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>REMAINING</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ fontWeight: "600", color: "#fff" }}>{loan.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{loan.annual_interest_rate}% APR</div>
                  </td>
                  <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(loan.principal)}</td>
                  <td style={{ padding: "18px 24px", color: "var(--text-green)", fontWeight: "600" }}>{formatINR(loan.total_paid)}</td>
                  <td style={{ padding: "18px 24px", color: "#e11d48", fontWeight: "700" }}>{formatINR(loan.remaining_principal)}</td>
                  <td style={{ padding: "18px 24px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                      <button onClick={() => { setSelectedLoanId(loan.id); setIsEmiModalOpen(true); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "6px 10px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}>Update EMI</button>
                      <button onClick={() => { setSelectedLoanId(loan.id); setIsPmtModalOpen(true); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "6px 10px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}>Add Pmt</button>
                      <button onClick={() => handleOpenEditModal(loan)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                      <button onClick={() => onDelete("loans", loan.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Interactive Loan Simulator */}
      <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "40px", marginTop: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "30px" }}>Amortization Simulator & Forecaster</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Simulated Principal (₹)</label>
              <input type="number" step="any" value={calcData.principal} onChange={(e) => setCalcData({ ...calcData, principal: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "14px 18px", fontSize: "16px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Interest Rate (% PA)</label>
              <input type="number" step="any" value={calcData.rate} onChange={(e) => setCalcData({ ...calcData, rate: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "14px 18px", fontSize: "16px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Monthly EMI (₹)</label>
              <input type="number" step="any" value={calcData.emi} onChange={(e) => setCalcData({ ...calcData, emi: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #e11d48", color: "#ffffff", padding: "14px 18px", fontSize: "16px", outline: "none" }} />
            </div>
          </div>
          
          <div>
            {calcResult?.error ? (
              <div style={{ padding: "20px", background: "rgba(225,29,72,0.1)", border: "1px solid #e11d48", color: "#e11d48", fontSize: "14px", fontWeight: "600" }}>{calcResult.error}</div>
            ) : calcResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "24px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", marginBottom: "8px" }}>ESTIMATED PAYOFF TIME</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>{calcResult.timeStr}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "24px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", marginBottom: "8px" }}>TOTAL INTEREST PAID</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#e11d48" }}>{formatINR(calcResult.totalInterest)}</div>
                  </div>
                </div>
                <div style={{ height: "180px", marginTop: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calcResult.timeline} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" hide />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <RechartsTooltip contentStyle={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} formatter={(val) => formatINR(val)} />
                      <Area type="monotone" dataKey="balance" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Base Loan Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "520px", padding: "40px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#e11d48" }} />
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>{editingItem ? "Edit Loan" : "Add Loan"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Loan Name</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Home Loan" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Original Principal</label>
                  <input type="number" step="any" required value={formData.principal || ""} onChange={(e) => setFormData({ ...formData, principal: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Annual Rate (%)</label>
                  <input type="number" step="any" required value={formData.annual_interest_rate || ""} onChange={(e) => setFormData({ ...formData, annual_interest_rate: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                </div>
              </div>
              <button type="submit" style={{ background: "#e11d48", color: "#ffffff", border: "none", padding: "16px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: "10px" }}>Save Loan</button>
            </form>
          </div>
        </div>
      )}

      {/* EMI Update Modal */}
      {isEmiModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "420px", padding: "40px", position: "relative" }}>
            <button onClick={() => setIsEmiModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            <h3 style={{ fontSize: "20px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>Update EMI Schedule</h3>
            <form onSubmit={handleAddEmi} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>Start Date</label>
                <input type="date" required value={emiData.start_date} onChange={(e) => setEmiData({ ...emiData, start_date: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>Monthly EMI Amount</label>
                  <input type="number" step="any" required value={emiData.emi} onChange={(e) => setEmiData({ ...emiData, emi: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>New Rate (Optional %)</label>
                  <input type="number" step="any" value={emiData.interest_rate} onChange={(e) => setEmiData({ ...emiData, interest_rate: e.target.value })} placeholder="Leave empty if no change" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", outline: "none" }} />
                </div>
              </div>
              <button type="submit" style={{ background: "#fff", color: "#000", border: "none", padding: "14px", fontWeight: "700", cursor: "pointer" }}>Save Schedule</button>
            </form>
          </div>
        </div>
      )}

      {/* One-time Payment Modal */}
      {isPmtModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "420px", padding: "40px", position: "relative" }}>
            <button onClick={() => setIsPmtModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            <h3 style={{ fontSize: "20px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>Add Repayment</h3>
            <form onSubmit={handleAddPmt} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>Payment Date</label>
                <input type="date" required value={pmtData.date} onChange={(e) => setPmtData({ ...pmtData, date: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>Amount Paid</label>
                <input type="number" step="any" required value={pmtData.amount} onChange={(e) => setPmtData({ ...pmtData, amount: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", outline: "none" }} />
              </div>
              <button type="submit" style={{ background: "#fff", color: "#000", border: "none", padding: "14px", fontWeight: "700", cursor: "pointer" }}>Add Repayment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
