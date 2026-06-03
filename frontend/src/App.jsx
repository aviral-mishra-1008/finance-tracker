import React, { useState, useEffect, useRef } from "react";
import { Landmark, LayoutDashboard, Settings, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PortfolioView from "./components/PortfolioView";
import LoansView from "./components/LoansView";
import EmergencyFundView from "./components/EmergencyFundView";
import BudgetPlannerView from "./components/BudgetPlannerView";
import InsurancesView from "./components/InsurancesView";
import ExpenseAnalyzerView from "./components/ExpenseAnalyzerView";
import RetirementView from "./components/RetirementView";
import LandingView from "./components/LandingView";
import { LogOut } from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

// --- Smooth Intersection Scroll Reveal ---
function ScrollReveal({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });

    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(35px)",
        transition: "opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform"
      }}
    >
      {children}
    </div>
  );
}

// --- True Data-Driven Historical Sparkline ---
function LiveHistoryChart({ historyData }) {
  if (!historyData || historyData.length === 0) return <div style={{ height: "100%" }} />;

  const values = historyData.map(h => h.net_worth);
  const maxVal = Math.max(...values) * 1.02;
  const minVal = Math.min(...values) * 0.98 === maxVal ? 0 : Math.min(...values) * 0.98;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(10, 10, 14, 0.9)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
          <p style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700" }}>₹{payload[0].value.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={historyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b84a00" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#b84a00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis domain={[minVal, maxVal]} hide />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="net_worth" stroke="#b84a00" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// --- Structural SVG Investment Tree Diagram ---
function InvestmentTreeGraph({ summary }) {
  const total = summary?.total_net_worth || 0;
  const leaves = [
    { name: "Reserves", val: summary?.bank_balance_total || 0, color: "#9a1026" },
    { name: "Stocks/ETFs", val: summary?.stocks_etfs_total || 0, color: "#b84a00" },
    { name: "Mutual Funds", val: summary?.mutual_funds_total || 0, color: "#a38000" },
    { name: "REIT Assets", val: summary?.reits_total || 0, color: "#d4af37" },
    { name: "Govt Bonds", val: summary?.government_bonds_total || 0, color: "#708090" },
    { name: "US Equities", val: summary?.us_stocks_total || 0, color: "#5c6bc0" },
    { name: "Emergency Fund", val: summary?.emergency_funds_total || 0, color: "#10b981" },
    { name: "PF & NPS", val: summary?.pf_nps_total || 0, color: "#3b82f6" },
  ].filter(l => l.val > 0);

  return (
    <div style={{ background: "rgba(10, 10, 14, 0.3)", border: "1px solid var(--border-subtle)", padding: "60px 40px", marginTop: "100px" }}>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "4px", color: "var(--text-secondary)", marginBottom: "50px", textAlign: "center", fontWeight: "700" }}>
        SYSTEM CAPITALIZATION MAPPING TREE
      </h3>
      <div style={{ width: "100%", overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <svg width="800" height="260" viewBox="0 0 800 260" style={{ overflow: "visible" }}>
          <g transform="translate(400, 30)">
            <rect x="-100" y="-20" width="200" height="40" fill="#040405" stroke="rgba(255,255,255,0.08)" />
            <text x="0" y="-3" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" letterSpacing="2">INVESTED POOL</text>
            <text x="0" y="14" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700">₹{total.toLocaleString('en-IN')}</text>
          </g>

          {leaves.map((leaf, idx) => {
            const spacing = 720 / (leaves.length - 1 || 1);
            const targetX = leaves.length === 1 ? 400 : 40 + idx * spacing;
            const targetY = 190;
            const pathData = `M 400 70 C 400 130, ${targetX} 110, ${targetX} ${targetY}`;

            return (
              <g key={leaf.name}>
                <path d={pathData} fill="none" stroke={leaf.color} strokeWidth="1.5" opacity="0.4" />
                <circle cx={targetX} cy={targetY} r="3.5" fill="#040405" stroke={leaf.color} strokeWidth="2" />
                <g transform={`translate(${targetX}, ${targetY + 28})`}>
                  <text x="0" y="0" textAnchor="middle" fill="var(--text-secondary)" fontSize="12" fontWeight="600">{leaf.name}</text>
                  <text x="0" y="16" textAnchor="middle" fill="var(--text-green)" fontSize="13" fontWeight="700">
                    ₹{leaf.val.toLocaleString('en-IN')}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [token, setToken] = useState(localStorage.getItem("pf_token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("pf_user") || "null"));
  
  const handleLogout = () => {
    localStorage.removeItem("pf_token");
    localStorage.removeItem("pf_user");
    setToken(null);
    setUser(null);
  };
  const [timeFrame, setTimeFrame] = useState("1Y");
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = () => {
    const h = { "Authorization": "Bearer " + token };
    return h;
  };
  
  const fetchPortfolio = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/portfolio`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPortfolio(data);
    } catch {
      setError("Cannot establish secure bridge with localized data container.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (token) fetchPortfolio(); 
  }, [token]);

  const handleRefreshPrices = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`${API_BASE_URL}/portfolio/refresh`, { method: "POST", headers: getHeaders() });
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddAsset = async (category, assetData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/portfolio/${category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify(assetData)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
      alert("Error adding asset tracking ledger node.");
    }
  };

  const handleUpdateAsset = async (category, itemId, assetData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/portfolio/${category}/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify(assetData)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
      alert("Error mutating remote tracking allocation context.");
    }
  };

  const handleDeleteAsset = async (category, itemId) => {
    if (!confirm("Are you sure you want to drop this allocation trace from system files?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/portfolio/${category}/${itemId}`, {
        method: "DELETE", headers: getHeaders()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
      alert("Error pruning data parameters from ledger system files.");
    }
  };

  const createDynamicCardStack = (summary) => [
    {
      id: "bank_balances",
      title: "Liquid Assets & Liquidity",
      description: "Instant capital reserves monitored across your primary bank accounts. Maintains deployment runway security.",
      value: summary?.bank_balance_total || 0,
      label: "CONSOLIDATED CASH BALANCE",
      accent: "#9a1026",
      image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "stocks_etfs",
      title: "Market Securities & ETFs",
      description: "Strategic allocations categorized across domestic vehicles, thematic frameworks including Defense sector nodes, and commodity assets.",
      value: summary?.stocks_etfs_total || 0,
      label: "DOMESTIC EQUITIES SECURITIES",
      accent: "#b84a00",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "mutual_funds",
      title: "Diversified Mutual Funds",
      description: "Managed portfolios pooling capital across high-growth indices, compounding yields systematically.",
      value: summary?.mutual_funds_total || 0,
      label: "MUTUAL FUND LEVERAGE",
      accent: "#a38000",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "reits",
      title: "Real Estate Property Trusts",
      description: "Allocated shares in infrastructure trusts yielding continuous long-term annualized compounding dividend payouts.",
      value: summary?.reits_total || 0,
      label: "TOTAL TRUST MATURITY ASSETS",
      accent: "#d4af37",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "government_bonds",
      title: "Sovereign Debt Obligations",
      description: "Prisk-adjusted low volatility fixed-income government bonds backing the macro ledger framework capital foundations.",
      value: summary?.government_bonds_total || 0,
      label: "BOND SECURED MATURITY BALANCE",
      accent: "#708090",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "us_stocks",
      title: "Global Equities Market",
      description: "International exposure hedges denominated in overseas currencies, anchoring security against native market volatility.",
      value: summary?.us_stocks_total || 0,
      label: "US DENOMINATED MARGIN",
      accent: "#5c6bc0",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "loans",
      title: "Loans & Liabilities",
      description: "Active debt obligations and credit facilities tracking principal repayment and accrued interest capitalization.",
      value: summary?.loans_total || 0,
      label: "TOTAL OUTSTANDING PRINCIPAL",
      accent: "#e11d48",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "emergency_funds",
      title: "Emergency Fund",
      description: "A highly liquid capital safety net preserved specifically to mitigate unexpected systemic shocks or liquidity crises.",
      value: summary?.emergency_funds_total || 0,
      label: "TOTAL SECURITY RESERVE",
      accent: "#10b981",
      image: "https://images.unsplash.com/photo-1621243806950-b8c7300c3b03?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "pf_nps",
      title: "PF & NPS",
      description: "Retirement corpus projected to build foundational financial independence through compounding.",
      value: summary?.pf_nps_total || 0,
      label: "TOTAL RETIREMENT CORPUS",
      accent: "#3b82f6",
      image: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&w=600&q=80"
    }
  ].filter(card => card.value > 0);

  const actionableCards = portfolio ? createDynamicCardStack(portfolio.summary) : [];

  if (!token) {
    return <LandingView onLoginSuccess={(t, u) => { setToken(t); setUser(u); localStorage.setItem("pf_token", t); localStorage.setItem("pf_user", JSON.stringify(u)); }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="plasma-background">
        <div className="wave-container">
          <div className="liquid-wave-red" />
          <div className="liquid-wave-orange" />
          <div className="liquid-wave-yellow" />
        </div>
      </div>

      <div className="app-container" style={{ flex: 1 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "100px" }}>
          <div className="app-logo" style={{ display: "flex", alignItems: "center", gap: "14px", fontFamily: "var(--font-sans)", fontWeight: "800", fontSize: "18px", letterSpacing: "3px" }}>
            <Landmark size={20} style={{ color: "#b84a00" }} />
            <span>PROJECT FUTURE</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", padding: "4px" }}>
            <button className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Overview</button>
            <button className={`nav-tab ${activeTab === "portfolio" ? "active" : ""}`} onClick={() => setActiveTab("portfolio")}>Assets</button>
            <button className={`nav-tab ${activeTab === "loans" ? "active" : ""}`} onClick={() => setActiveTab("loans")}>Liabilities</button>
            <button className={`nav-tab ${activeTab === "emergency" ? "active" : ""}`} onClick={() => setActiveTab("emergency")}>Emergency Fund</button>
            <button className={`nav-tab ${activeTab === "pf_nps" ? "active" : ""}`} onClick={() => setActiveTab("pf_nps")}>PF & NPS</button>
            <button className={`nav-tab ${activeTab === "budget" ? "active" : ""}`} onClick={() => setActiveTab("budget")}>Budget Planner</button>
            <button className={`nav-tab ${activeTab === "insurances" ? "active" : ""}`} onClick={() => setActiveTab("insurances")}>Insurances</button>
            <button className={`nav-tab ${activeTab === "expense_analyzer" ? "active" : ""}`} onClick={() => setActiveTab("expense_analyzer")}>Expense Analyzer</button>
            <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 10px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 10px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>{user?.name?.toUpperCase()}</span>
              <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        {error && <div style={{ padding: "20px", background: "rgba(255,23,68,0.06)", border: "1px solid #9a1026", fontSize: "14px", marginBottom: "40px" }}>{error}</div>}

        {!isLoading && (
          activeTab === "dashboard" ? (
            <div>
              <div className={`networth-banner ${portfolio?.summary?.total_pnl >= 0 ? 'positive' : 'negative'}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "flex-end", marginBottom: "60px", padding: "40px", textAlign: "left", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div>
                  <span className="networth-label" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "3.5px", color: "var(--text-secondary)", fontWeight: "700" }}>TOTAL PORTFOLIO NET WORTH</span>
                  <h1 className="networth-value" style={{ fontFamily: "var(--font-serif)", fontSize: "84px", fontWeight: "700", marginTop: "12px", lineHeight: 1, letterSpacing: "-2px", color: "#ffffff" }}>
                    ₹{portfolio?.summary?.total_net_worth?.toLocaleString('en-IN') || "0.00"}
                  </h1>
                  <div className={`networth-change ${portfolio?.summary?.total_pnl >= 0 ? 'positive' : 'negative'}`} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", fontSize: "15px", fontWeight: "700", letterSpacing: "0.5px" }}>
                    {portfolio?.summary?.total_pnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    <span>{portfolio?.summary?.total_pnl >= 0 ? "+" : ""}₹{portfolio?.summary?.total_pnl?.toLocaleString('en-IN')} All-Time Yield</span>
                  </div>
                </div>

                <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.02)", padding: "4px", border: "1px solid var(--border-subtle)" }}>
                  {["1M", "1Y", "3Y", "ALL"].map(tf => (
                    <button key={tf} onClick={() => setTimeFrame(tf)} style={{ background: timeFrame === tf ? "#ffffff" : "transparent", color: timeFrame === tf ? "#000000" : "var(--text-secondary)", border: "none", padding: "8px 18px", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease" }}>{tf}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "50px", marginBottom: "160px", alignItems: "flex-end" }}>
                <div style={{ height: "180px" }}>
                  <LiveHistoryChart historyData={portfolio?.history} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <button className="refresh-btn" onClick={handleRefreshPrices} disabled={isRefreshing}>
                    <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} style={{ marginRight: "10px" }} />
                    {isRefreshing ? "Syncing..." : "Sync Market Value"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "120px" }}>
                {actionableCards.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "16px", letterSpacing: "1px" }}>No allocation profiles detected. Mount assets in the system core configuration panel.</p>
                ) : (
                  actionableCards.map((card, idx) => {
                    const flip = idx % 2 === 0;
                    return (
                      <ScrollReveal key={card.id}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "80px", alignItems: "center", background: "rgba(10, 10, 14, 0.4)", border: "1px solid var(--border-subtle)", padding: "60px", position: "relative" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: card.accent, opacity: 0.4 }} />

                          {flip ? (
                            <>
                              <div style={{ height: "320px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                <img src={card.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                              </div>
                              <div>
                                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "42px", fontWeight: "500", marginBottom: "20px", lineHeight: "1.2" }}>{card.title}</h2>
                                <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: "1.7", marginBottom: "40px" }}>{card.description}</p>
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px" }}>
                                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "2px", fontWeight: "700" }}>{card.label}</span>
                                  <div style={{ fontSize: "46px", fontFamily: "var(--font-serif)", fontWeight: "700", marginTop: "6px" }}>₹{card.value.toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "42px", fontWeight: "500", marginBottom: "20px", lineHeight: "1.2" }}>{card.title}</h2>
                                <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: "1.7", marginBottom: "40px" }}>{card.description}</p>
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px" }}>
                                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "2px", fontWeight: "700" }}>{card.label}</span>
                                  <div style={{ fontSize: "46px", fontFamily: "var(--font-serif)", fontWeight: "700", marginTop: "6px" }}>₹{card.value.toLocaleString('en-IN')}</div>
                                </div>
                              </div>
                              <div style={{ height: "320px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                <img src={card.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                              </div>
                            </>
                          )}
                        </div>
                      </ScrollReveal>
                    );
                  })
                )}
              </div>

              <ScrollReveal>
                <InvestmentTreeGraph summary={portfolio?.summary} />
              </ScrollReveal>
            </div>
          ) : activeTab === "portfolio" ? (
            <PortfolioView
              portfolio={portfolio}
              onAdd={handleAddAsset}
              onUpdate={handleUpdateAsset}
              onDelete={handleDeleteAsset}
            />
          ) : activeTab === "loans" ? (
            <LoansView
              portfolio={portfolio}
              onAdd={handleAddAsset}
              onUpdate={handleUpdateAsset}
              onDelete={handleDeleteAsset}
            />
          ) : activeTab === "emergency" ? (
            <EmergencyFundView
              portfolio={portfolio}
              onAdd={handleAddAsset}
              onDelete={handleDeleteAsset}
            />
          ) : activeTab === "pf_nps" ? (
            <RetirementView
              portfolio={portfolio}
              onAdd={handleAddAsset}
              onUpdate={handleUpdateAsset}
            />
          ) : activeTab === "budget" ? (
            <BudgetPlannerView
              portfolio={portfolio}
              onAdd={handleAddAsset}
              onUpdate={handleUpdateAsset}
              onDelete={handleDeleteAsset}
            />
          ) : activeTab === "insurances" ? (
            <InsurancesView />
          ) : (
            <ExpenseAnalyzerView portfolio={portfolio} />
          )
        )}
      </div>

      <footer className="app-footer">
        <div className="footer-content">Built & Managed by <span className="footer-highlight">Aviral Mishra</span></div>
      </footer>
    </div>
  );
}