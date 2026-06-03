import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Briefcase, Landmark } from "lucide-react";

export default function RetirementView({ portfolio, onAdd, onUpdate }) {
  const pfNpsAccounts = portfolio?.pf_nps || [];
  
  const existingEpf = pfNpsAccounts.find(a => a.account_type === "EPF") || { base_balance: 0, current_balance: 0, monthly_contribution: 0, expected_annual_return: 8.25, start_date: new Date().toISOString().slice(0, 7) };
  const existingNps = pfNpsAccounts.find(a => a.account_type === "NPS") || { base_balance: 0, current_balance: 0, monthly_contribution: 0, expected_annual_return: 10.0, start_date: new Date().toISOString().slice(0, 7) };

  const getNextMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  };

  const [epfData, setEpfData] = useState({ ...existingEpf, effective_month: getNextMonth() });
  const [npsData, setNpsData] = useState({ ...existingNps, effective_month: getNextMonth() });
  
  const [projectionYears, setProjectionYears] = useState(10);

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const handleSaveEPF = (e) => {
    e.preventDefault();
    const payload = { ...epfData, account_type: "EPF" };
    if (parseFloat(epfData.monthly_contribution) !== parseFloat(existingEpf.monthly_contribution || 0)) {
      payload.new_monthly_contribution = epfData.monthly_contribution;
      payload.effective_month = epfData.effective_month || getNextMonth();
    }
    if (parseFloat(epfData.base_balance) !== parseFloat(existingEpf.base_balance || 0)) {
      payload.manual_balance_override = epfData.base_balance;
    }
    if (existingEpf.id) {
      onUpdate("pf_nps", existingEpf.id, payload);
    } else {
      onAdd("pf_nps", payload);
    }
  };

  const handleSaveNPS = (e) => {
    e.preventDefault();
    const payload = { ...npsData, account_type: "NPS" };
    if (parseFloat(npsData.monthly_contribution) !== parseFloat(existingNps.monthly_contribution || 0)) {
      payload.new_monthly_contribution = npsData.monthly_contribution;
      payload.effective_month = npsData.effective_month || getNextMonth();
    }
    if (parseFloat(npsData.base_balance) !== parseFloat(existingNps.base_balance || 0)) {
      payload.manual_balance_override = npsData.base_balance;
    }
    if (existingNps.id) {
      onUpdate("pf_nps", existingNps.id, payload);
    } else {
      onAdd("pf_nps", payload);
    }
  };

  const projectionData = useMemo(() => {
    const data = [];
    const months = projectionYears * 12;
    
    let currentEpf = parseFloat(existingEpf.current_balance) || 0;
    const epfMonthlyCont = parseFloat(epfData.monthly_contribution) || 0;
    const epfMonthlyRate = (parseFloat(epfData.expected_annual_return) || 8.25) / 100 / 12;

    let currentNps = parseFloat(existingNps.current_balance) || 0;
    const npsMonthlyCont = parseFloat(npsData.monthly_contribution) || 0;
    const npsMonthlyRate = (parseFloat(npsData.expected_annual_return) || 10.0) / 100 / 12;

    const today = new Date();

    for (let i = 0; i <= months; i++) {
      if (i % 12 === 0 || i === months) { // Save data points yearly to keep chart clean
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        data.push({
          year: d.getFullYear(),
          EPF: Math.round(currentEpf),
          NPS: Math.round(currentNps),
          Total: Math.round(currentEpf + currentNps)
        });
      }
      
      // Calculate next month
      currentEpf = currentEpf * (1 + epfMonthlyRate) + epfMonthlyCont;
      currentNps = currentNps * (1 + npsMonthlyRate) + npsMonthlyCont;
    }
    
    return data;
  }, [epfData, npsData, projectionYears]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(10, 10, 14, 0.9)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "8px" }}>Projected for {label}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ color: "#3b82f6", fontSize: "14px", fontWeight: "600" }}>EPF: {formatINR(payload.find(p => p.dataKey === "EPF")?.value)}</p>
            <p style={{ color: "#10b981", fontSize: "14px", fontWeight: "600" }}>NPS: {formatINR(payload.find(p => p.dataKey === "NPS")?.value)}</p>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
            <p style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700" }}>Total: {formatINR(payload[0].payload.Total)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "40px" }}>
      
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>Retirement Wealth Builder (EPF & NPS)</h2>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>Mathematically project your retirement corpus based on active contributions.</div>
      </div>

      <div className="responsive-grid-2 mobile-stack">
        
        {/* EPF Card */}
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <Briefcase size={20} color="#3b82f6" />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>Employees' Provident Fund (EPF)</h3>
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>Real-Time Corpus</div>
            <div style={{ fontSize: "28px", color: "#fff", fontWeight: "700", marginTop: "4px" }}>{formatINR(existingEpf.current_balance)}</div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px" }}>
              <div style={{ color: "var(--text-secondary)" }}>Invested: <span style={{ color: "#fff" }}>{formatINR(existingEpf.total_invested || 0)}</span></div>
              <div style={{ color: "var(--text-secondary)" }}>Returns: <span style={{ color: "#3b82f6" }}>+{formatINR(existingEpf.pnl_inr || 0)}</span></div>
            </div>
          </div>
          
          <form onSubmit={handleSaveEPF} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Manual Baseline Balance (₹)</label>
              <input type="number" step="any" required value={epfData.base_balance} onChange={(e) => setEpfData({ ...epfData, base_balance: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Monthly Deduction (₹)</label>
              <input type="number" step="any" required value={epfData.monthly_contribution} onChange={(e) => setEpfData({ ...epfData, monthly_contribution: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#3b82f6", letterSpacing: "1px" }}>Effective Month (New Deduction)</label>
              <input type="month" required value={epfData.effective_month} onChange={(e) => setEpfData({ ...epfData, effective_month: e.target.value })} style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Govt Interest Rate (% p.a.)</label>
                <button type="button" onClick={async () => {
                  try {
                    const res = await fetch("http://localhost:8000/api/epf-rate");
                    const data = await res.json();
                    if(data.epf_rate) setEpfData({...epfData, expected_annual_return: data.epf_rate});
                  } catch (e) {
                    console.error("Failed to fetch EPF rate", e);
                  }
                }} style={{ background: "transparent", border: "none", color: "#3b82f6", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>FETCH LATEST</button>
              </div>
              <input type="number" step="any" required value={epfData.expected_annual_return} onChange={(e) => setEpfData({ ...epfData, expected_annual_return: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <button type="submit" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "14px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: "10px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)"}>Update EPF</button>
          </form>
        </div>

        {/* NPS Card */}
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <Landmark size={20} color="#10b981" />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>National Pension System (NPS)</h3>
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>Real-Time Corpus</div>
            <div style={{ fontSize: "28px", color: "#fff", fontWeight: "700", marginTop: "4px" }}>{formatINR(existingNps.current_balance)}</div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px" }}>
              <div style={{ color: "var(--text-secondary)" }}>Invested: <span style={{ color: "#fff" }}>{formatINR(existingNps.total_invested || 0)}</span></div>
              <div style={{ color: "var(--text-secondary)" }}>Returns: <span style={{ color: "#10b981" }}>+{formatINR(existingNps.pnl_inr || 0)}</span></div>
            </div>
          </div>
          
          <form onSubmit={handleSaveNPS} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Manual Baseline Balance (₹)</label>
              <input type="number" step="any" required value={npsData.base_balance} onChange={(e) => setNpsData({ ...npsData, base_balance: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Monthly Contribution (₹)</label>
              <input type="number" step="any" required value={npsData.monthly_contribution} onChange={(e) => setNpsData({ ...npsData, monthly_contribution: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#10b981", letterSpacing: "1px" }}>Effective Month (New Contrib.)</label>
              <input type="month" required value={npsData.effective_month} onChange={(e) => setNpsData({ ...npsData, effective_month: e.target.value })} style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Expected Market Return CAGR (%)</label>
              <input type="number" step="any" required value={npsData.expected_annual_return} onChange={(e) => setNpsData({ ...npsData, expected_annual_return: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
            </div>
            <button type="submit" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "14px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", marginTop: "10px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)"}>Update NPS</button>
          </form>
        </div>

      </div>

      {/* Projection Chart */}
      <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "40px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", fontWeight: "700" }}>Total Corpus Prediction</h3>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#fff", marginTop: "8px" }}>{formatINR(projectionData[projectionData.length - 1]?.Total)} <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>in {projectionYears} years</span></div>
          </div>
          
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "4px" }}>
            {[5, 10, 15, 20].map(y => (
              <button 
                key={y}
                onClick={() => setProjectionYears(y)}
                style={{ 
                  background: projectionYears === y ? "rgba(255,255,255,0.1)" : "transparent", 
                  color: projectionYears === y ? "#fff" : "var(--text-secondary)", 
                  border: "none", padding: "8px 16px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" 
                }}>
                {y} Years
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: "400px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 0, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEpf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorNps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="EPF" stackId="1" stroke="#3b82f6" fill="url(#colorEpf)" strokeWidth={2} />
              <Area type="monotone" dataKey="NPS" stackId="1" stroke="#10b981" fill="url(#colorNps)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
