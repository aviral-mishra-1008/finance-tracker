import React, { useState, useEffect, useMemo } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader, HelpCircle, Save, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API_BASE = "http://localhost:8000/api";

const MNEMONICS = [
    { code: "HOU", desc: "Housing" },
    { code: "FOD", desc: "Food" },
    { code: "TRN", desc: "Transport" },
    { code: "SHP", desc: "Shopping" },
    { code: "HLT", desc: "Health" },
    { code: "BIL", desc: "Bills" },
    { code: "EMI", desc: "Loan EMI" },
    { code: "INS", desc: "Insurance" },
    { code: "FAM", desc: "Family" },
    { code: "INV", desc: "Investment" }
];

export default function ExpenseAnalyzerView({ portfolio }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); 
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState("");
  
  // Custom Rules & Resolution Modal
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolvingTxIndex, setResolvingTxIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("Miscellaneous");
  const [rememberRule, setRememberRule] = useState(true);

  // Load budgets for this month from portfolio
  const budgets = portfolio?.budgets || [];
  const activeBudget = budgets.find(b => b.month_id === selectedMonth);
  const plannedExpenses = activeBudget?.expenses || [];
  
  const CATEGORIES = [
    "Housing & Utilities", "Food & Dining", "Transportation", 
    "Entertainment", "Shopping", "Health & Fitness", 
    "Education", "Miscellaneous", "Bills", "Loan EMI",
    "Insurance Premiums", "Investment", "Savings", "Family Transfer"
  ];

  useEffect(() => {
    fetchTransactions(selectedMonth);
  }, [selectedMonth]);

  const fetchTransactions = async (monthId) => {
    try {
      const response = await fetch(`${API_BASE}/transactions/${monthId}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("month_id", selectedMonth);
    if (password) {
      formData.append("password", password);
    }

    try {
      const response = await fetch(`${API_BASE}/upload-statement`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus({ type: "success", message: data.message });
        setTransactions(data.transactions);
      } else {
        setUploadStatus({ type: "error", message: data.detail || "Upload failed" });
      }
    } catch (err) {
      setUploadStatus({ type: "error", message: "Network error during upload" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const uncategorizedTxs = transactions.filter(t => t.category === "Uncategorized");

  const startResolution = () => {
    if (uncategorizedTxs.length > 0) {
      setResolvingTxIndex(0);
      setSelectedCategory("Miscellaneous");
      setRememberRule(true);
      setShowResolutionModal(true);
    }
  };

  const submitResolution = async () => {
    const tx = uncategorizedTxs[resolvingTxIndex];
    
    // 1. If rememberRule is true, save to backend
    if (rememberRule && tx.effective_name) {
      try {
        await fetch(`${API_BASE}/custom-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_name: tx.effective_name,
            category: selectedCategory
          })
        });
      } catch (err) {
        console.error("Failed to save rule", err);
      }
    }
    
    // 2. Update all matching transactions locally
    const updatedTxs = transactions.map(t => {
      // Update this exact transaction
      if (t === tx) return { ...t, category: selectedCategory };
      
      // Also retroactively update any other uncategorized items with the exact same effective name
      if (rememberRule && t.category === "Uncategorized" && t.effective_name === tx.effective_name) {
          return { ...t, category: selectedCategory };
      }
      return t;
    });
    
    setTransactions(updatedTxs);
    
    // 3. Move to next or close
    // Because we just mutated state, the uncategorizedTxs list on the next render will be shorter.
    // For safety, we can just close the modal and let the user click "Resolve X" again if any remain,
    // OR we can eagerly find the next one.
    
    // Simple approach: find next uncategorized in updated array
    const remaining = updatedTxs.filter(t => t.category === "Uncategorized");
    if (remaining.length > 0) {
       setResolvingTxIndex(0); // It will always be 0 in the new filtered array
       setSelectedCategory("Miscellaneous");
    } else {
       setShowResolutionModal(false);
    }
  };

  // --- Data Formatting for Visualizer ---
  
  const comparisonData = useMemo(() => {
    const categoryMap = {};
    
    plannedExpenses.forEach(exp => {
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { category: exp.category, Planned: 0, Actual: 0 };
      }
      categoryMap[exp.category].Planned += exp.amount;
    });

    transactions.forEach(tx => {
      // Exclude Transfers from Spend Analysis
      if (tx.category === "Transfers") return;
        
      if (!categoryMap[tx.category]) {
        categoryMap[tx.category] = { category: tx.category, Planned: 0, Actual: 0 };
      }
      categoryMap[tx.category].Actual += tx.amount;
    });

    return Object.values(categoryMap).sort((a, b) => (b.Planned + b.Actual) - (a.Planned + a.Actual));
  }, [plannedExpenses, transactions]);

  const totalPlanned = plannedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Exclude Transfers from total actual spend
  const totalActual = transactions
    .filter(tx => tx.category !== "Transfers")
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const variance = totalPlanned - totalActual; 

  const formatINR = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "40px", paddingBottom: "40px", position: "relative" }}>
      
      {/* Top Header & Month Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px" }}>
        <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>Expense Analyzer</h2>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>Compare actual spending against your planned budget</div>
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
      
      {/* Mnemonic Legend */}
      <div style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "8px", padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <HelpCircle size={20} style={{ color: "#3b82f6", flexShrink: 0, marginTop: "2px" }} />
          <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff", marginBottom: "8px" }}>Auto-Categorize with Mnemonics</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: "1.5" }}>
                  Add these 3-letter codes to your UPI payment remarks. The parser will instantly recognize them and map the transaction to the correct category without any manual intervention!
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {MNEMONICS.map(m => (
                      <div key={m.code} style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", display: "flex", gap: "6px" }}>
                          <span style={{ color: "#3b82f6", fontWeight: "700" }}>{m.code}</span>
                          <span style={{ color: "var(--text-secondary)" }}>{m.desc}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Main Grid: Upload Area + Summary Cards */}
      <div className="responsive-grid-1-2 mobile-stack">
        
        {/* Upload Card */}
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", fontWeight: "700" }}>Statement Upload</h3>
          
          <div style={{ border: "2px dashed rgba(255,255,255,0.1)", padding: "30px 20px", textAlign: "center", borderRadius: "8px", position: "relative" }}>
             <input type="file" accept=".xls,.xlsx,.csv,.pdf" onChange={handleFileChange} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
             <UploadCloud size={32} style={{ color: "var(--text-secondary)", margin: "0 auto 12px" }} />
             <div style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>{selectedFile ? selectedFile.name : "Click or drag file to upload"}</div>
             <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "8px" }}>Supports Excel/CSV exports</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
             <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Password (if protected)</label>
             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="File Password" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "10px 14px", fontSize: "13px", outline: "none" }} />
          </div>

          <button onClick={handleUpload} disabled={isLoading || !selectedFile} style={{ background: isLoading || !selectedFile ? "rgba(59, 130, 246, 0.3)" : "#3b82f6", color: "#ffffff", border: "none", padding: "14px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: isLoading || !selectedFile ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
             {isLoading ? <Loader size={16} className="animate-spin" /> : "Process Statement"}
          </button>

          {uploadStatus && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: uploadStatus.type === 'success' ? "#10b981" : "#f43f5e", fontSize: "12px", padding: "10px", background: uploadStatus.type === 'success' ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)", borderRadius: "4px" }}>
              {uploadStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {uploadStatus.message}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="responsive-grid-2 mobile-stack">
          <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", textTransform: "uppercase" }}>Total Planned (Budget)</div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: "#fff", marginTop: "12px" }}>{formatINR(totalPlanned)}</div>
          </div>
          
          <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", textTransform: "uppercase" }}>Total Actual Spend</div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: totalActual > totalPlanned ? "#f43f5e" : "#10b981", marginTop: "12px" }}>{formatINR(totalActual)}</div>
          </div>

          <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", display: "flex", flexDirection: "column", justifyContent: "center", gridColumn: "span 2" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", fontWeight: "700", textTransform: "uppercase" }}>Variance</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "12px" }}>
                <div style={{ fontSize: "32px", fontWeight: "700", color: variance >= 0 ? "#10b981" : "#f43f5e" }}>
                    {variance >= 0 ? "+" : ""}{formatINR(variance)}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    {variance >= 0 ? "Under budget" : "Over budget"}
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Uncategorized Resolution Banner */}
      {uncategorizedTxs.length > 0 && (
          <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <AlertCircle size={24} style={{ color: "#f59e0b" }} />
                  <div>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#f59e0b", margin: 0 }}>Action Required</h4>
                      <div style={{ fontSize: "13px", color: "rgba(245, 158, 11, 0.8)", marginTop: "4px" }}>You have {uncategorizedTxs.length} uncategorized transactions. Categorize them to improve accuracy.</div>
                  </div>
              </div>
              <button onClick={startResolution} style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "10px 20px", fontSize: "12px", fontWeight: "700", borderRadius: "4px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Resolve Now
              </button>
          </div>
      )}

      {/* Chart View */}
      {comparisonData.length > 0 && (
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", padding: "30px", height: "400px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "30px", fontWeight: "700" }}>Category Breakdown</h3>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip formatter={(value) => formatINR(value)} cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Legend iconSize={8} wrapperStyle={{ paddingTop: "20px", fontSize: "11px", color: "var(--text-secondary)" }} />
                  <Bar dataKey="Planned" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Actual" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* Transactions Table */}
      {transactions.length > 0 && (
        <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                 <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>Parsed Transactions</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "12px 24px", fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>DATE</th>
                  <th style={{ padding: "12px 24px", fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>EXTRACTED NAME</th>
                  <th style={{ padding: "12px 24px", fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CATEGORY</th>
                  <th style={{ padding: "12px 24px", fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "16px 24px", color: "var(--text-secondary)" }}>{tx.date}</td>
                    <td style={{ padding: "16px 24px", color: "#fff" }}>
                        <div style={{ fontWeight: "500" }}>{tx.effective_name || "Unknown"}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "400px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                        <span style={{ padding: "4px 8px", background: tx.category === "Uncategorized" ? "rgba(245, 158, 11, 0.1)" : tx.category === "Transfers" ? "rgba(255,255,255,0.1)" : "rgba(59, 130, 246, 0.1)", color: tx.category === "Uncategorized" ? "#f59e0b" : tx.category === "Transfers" ? "var(--text-secondary)" : "#3b82f6", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                            {tx.category}
                        </span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right", color: tx.category === "Transfers" ? "var(--text-secondary)" : "#f43f5e", fontWeight: "700" }}>{formatINR(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
      
      {/* Resolution Modal Overlay */}
      {showResolutionModal && uncategorizedTxs[resolvingTxIndex] && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", width: "480px", overflow: "hidden" }}>
                
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", margin: 0 }}>Categorize Transaction</h3>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{resolvingTxIndex + 1} of {uncategorizedTxs.length} uncategorized</div>
                    </div>
                    <button onClick={() => setShowResolutionModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={20} /></button>
                </div>
                
                <div style={{ padding: "24px" }}>
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700", marginBottom: "8px" }}>Extracted Merchant Name</div>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: "#3b82f6" }}>{uncategorizedTxs[resolvingTxIndex].effective_name || "Unknown Merchant"}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ marginBottom: "4px" }}><strong>Raw Description:</strong></div>
                            {uncategorizedTxs[resolvingTxIndex].description}
                        </div>
                        <div style={{ marginTop: "12px", fontSize: "18px", color: "#f43f5e", fontWeight: "700" }}>{formatINR(uncategorizedTxs[resolvingTxIndex].amount)} <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "400" }}>on {uncategorizedTxs[resolvingTxIndex].date}</span></div>
                    </div>
                    
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700", marginBottom: "8px", display: "block" }}>Assign Category</label>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: "6px", fontSize: "14px", outline: "none" }}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                        <input type="checkbox" id="remember" checked={rememberRule} onChange={e => setRememberRule(e.target.checked)} style={{ cursor: "pointer" }} />
                        <label htmlFor="remember" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                            Remember this! Always map <strong style={{ color: "#fff" }}>"{uncategorizedTxs[resolvingTxIndex].effective_name}"</strong> to this category.
                        </label>
                    </div>
                    
                    <button onClick={submitResolution} style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", padding: "14px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <Save size={16} /> Save & Continue
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
