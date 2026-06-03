import React, { useState } from "react";
import { Plus, Minus, X, AlertCircle, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EmergencyFundView({ portfolio, onAdd, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("deposit");
  const [formData, setFormData] = useState({ date: "", amount: "", description: "" });

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    let amt = parseFloat(formData.amount);
    if (modalMode === "withdraw") amt = -Math.abs(amt);
    else amt = Math.abs(amt);

    const payload = {
      date: formData.date,
      amount: amt,
      description: formData.description
    };
    onAdd("emergency_funds", payload);
    setIsModalOpen(false);
    setFormData({ date: "", amount: "", description: "" });
  };

  const emergencyFunds = portfolio?.emergency_funds || [];

  // Sort by date to chart evolution correctly
  const sortedFunds = [...emergencyFunds].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate running total for evolution chart
  let runningTotal = 0;
  const evolutionData = sortedFunds.map(f => {
    runningTotal += parseFloat(f.amount);
    return {
      date: f.date,
      total: runningTotal
    };
  });

  const totalFund = portfolio?.summary?.emergency_funds_total || 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(10, 10, 14, 0.9)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
          <p style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700" }}>{formatINR(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "40px" }}>
      {/* Banner Image */}
      <div style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
        <img src="https://images.unsplash.com/photo-1621243806950-b8c7300c3b03?auto=format&fit=crop&w=1200&q=80" alt="Emergency Fund Safety Net" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(12,12,16,1) 0%, rgba(12,12,16,0) 100%)" }} />
      </div>

      {/* Top Controls & Summary Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>Emergency Fund Safety Net</h2>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#10b981", marginTop: "10px" }}>{formatINR(totalFund)}</div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => { setModalMode("withdraw"); setIsModalOpen(true); }} style={{ background: "transparent", color: "#fff", border: "1px solid #e11d48", padding: "12px 24px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#e11d48"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Minus size={16} /> Withdraw
          </button>
          <button onClick={() => { setModalMode("deposit"); setIsModalOpen(true); }} style={{ background: "transparent", color: "#fff", border: "1px solid #10b981", padding: "12px 24px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#10b981"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Plus size={16} /> Add Funds
          </button>
        </div>
      </div>

      {/* Evolution Chart */}
      {evolutionData.length > 0 && (
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "40px" }}>
          <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "30px", fontWeight: "700" }}>Fund Evolution over Time</h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEvolution)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main List */}
      <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
        {sortedFunds.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px", textAlign: "center" }}>
            <AlertCircle size={44} strokeWidth={1.2} style={{ color: "#10b981", marginBottom: "20px", opacity: 0.8 }} />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "8px", color: "#ffffff" }}>No Emergency Funds Saved</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Start building your safety net to protect against unforeseen expenses.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>DATE RECORDED</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>DESCRIPTION</th>
                <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>AMOUNT LOGGED</th>
                <th style={{ padding: "16px 24px", width: "50px" }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedFunds.map((fund, idx) => (
                <tr key={fund.id || idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{fund.date}</td>
                  <td style={{ padding: "18px 24px", color: "#fff" }}>{fund.description || (fund.amount < 0 ? "System Withdrawal" : "System Deposit")}</td>
                  <td style={{ padding: "18px 24px", textAlign: "right", color: fund.amount < 0 ? "#e11d48" : "#10b981", fontWeight: "700" }}>{fund.amount > 0 ? "+" : ""}{formatINR(fund.amount)}</td>
                  <td style={{ padding: "18px 24px", textAlign: "right" }}>
                    {fund.id && (
                      <button onClick={() => onDelete("emergency_funds", fund.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Funds Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "520px", padding: "40px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: modalMode === "withdraw" ? "#e11d48" : "#10b981" }} />
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>{modalMode === "withdraw" ? "Withdraw Funds" : "Add Emergency Funds"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Date</label>
                  <input type="date" required value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Amount</label>
                  <input type="number" step="any" required value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Description (Optional)</label>
                <input type="text" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Monthly allocation" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
              </div>

              <button type="submit" style={{ background: modalMode === "withdraw" ? "#e11d48" : "#10b981", color: "#ffffff", border: "none", padding: "16px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: "10px" }}>{modalMode === "withdraw" ? "Log Withdrawal" : "Log Funds"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
