import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCw, 
  Wallet, 
  Briefcase, 
  Building2, 
  Landmark, 
  Coins,
  Globe
} from "lucide-react";
import DonutChart from "./DonutChart";
import ScrollReveal from "./ScrollReveal";

export default function DashboardView({ portfolio, onRefresh, isRefreshing }) {
  const summary = portfolio.summary || {
    total_net_worth: 0,
    bank_balance_total: 0,
    stocks_etfs_total: 0,
    mutual_funds_total: 0,
    reits_total: 0,
    government_bonds_total: 0,
    us_stocks_total: 0,
    total_pnl: 0,
    usd_inr_rate: 83.5
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Build chart data
  const chartData = [
    { label: "Banks", value: summary.bank_balance_total, color: "#00f0ff" },
    { label: "Stocks/ETFs", value: summary.stocks_etfs_total, color: "#d4ff00" },
    { label: "Mutual Funds", value: summary.mutual_funds_total, color: "#6d00f9" },
    { label: "REITs", value: summary.reits_total, color: "#ff9e00" },
    { label: "Bonds", value: summary.government_bonds_total, color: "#10b981" },
    { label: "US Stocks", value: summary.us_stocks_total, color: "#ff0055" },
    { label: "Retirement", value: summary.pf_nps_total || 0, color: "#ec4899" }
  ].filter(item => item.value > 0);

  const categories = [
    {
      name: "Bank Balances",
      count: (portfolio.bank_balances || []).length,
      amount: summary.bank_balance_total,
      color: "rgba(0, 240, 255, 0.08)",
      icon: <Wallet className="text-[#00f0ff]" size={22} />,
      pnl: null
    },
    {
      name: "Indian Stocks & ETFs",
      count: (portfolio.stocks_etfs || []).length,
      amount: summary.stocks_etfs_total,
      color: "rgba(212, 255, 0, 0.08)",
      icon: <Briefcase className="text-[#d4ff00]" size={22} />,
      pnl: (portfolio.stocks_etfs || []).reduce((sum, item) => sum + (item.pnl_inr || 0), 0)
    },
    {
      name: "Mutual Funds",
      count: (portfolio.mutual_funds || []).length,
      amount: summary.mutual_funds_total,
      color: "rgba(109, 0, 249, 0.08)",
      icon: <Coins className="text-[#a78bfa]" size={22} />,
      pnl: (portfolio.mutual_funds || []).reduce((sum, item) => sum + (item.pnl_inr || 0), 0)
    },
    {
      name: "REITs",
      count: (portfolio.reits || []).length,
      amount: summary.reits_total,
      color: "rgba(255, 158, 0, 0.08)",
      icon: <Building2 className="text-[#ff9e00]" size={22} />,
      pnl: (portfolio.reits || []).reduce((sum, item) => sum + (item.pnl_inr || 0), 0),
      extra: `Dividends: ${formatINR((portfolio.reits || []).reduce((sum, item) => sum + (item.total_dividends_received || 0), 0))}`
    },
    {
      name: "Govt Bonds",
      count: (portfolio.government_bonds || []).length,
      amount: summary.government_bonds_total,
      color: "rgba(16, 185, 129, 0.08)",
      icon: <Landmark className="text-[#10b981]" size={22} />,
      pnl: (portfolio.government_bonds || []).reduce((sum, item) => sum + (item.interest_earned || 0), 0)
    },
    {
      name: "US Stocks",
      count: (portfolio.us_stocks || []).length,
      amount: summary.us_stocks_total,
      color: "rgba(255, 0, 85, 0.08)",
      icon: <Globe className="text-[#ff0055]" size={22} />,
      pnl: (portfolio.us_stocks || []).reduce((sum, item) => sum + (item.pnl_inr || 0), 0)
    },
    {
      name: "Retirement (PF/NPS)",
      count: (portfolio.pf_nps || []).length,
      amount: summary.pf_nps_total || 0,
      color: "rgba(236, 72, 153, 0.08)",
      icon: <Briefcase className="text-[#ec4899]" size={22} />,
      pnl: (portfolio.pf_nps || []).reduce((sum, item) => sum + (item.pnl_inr || 0), 0)
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Landing Networth Banner */}
      <ScrollReveal>
        <div className="networth-banner">
          <div className="networth-label">Total Net Worth</div>
          <div className="networth-value">
            {formatINR(summary.total_net_worth)}
          </div>
          
          <div className={`networth-change ${summary.total_pnl >= 0 ? "positive" : "negative"}`}>
            {summary.total_pnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              All-time Returns: {summary.total_pnl >= 0 ? "+" : ""}{formatINR(summary.total_pnl)}
            </span>
          </div>

          <button 
            className="refresh-btn" 
            onClick={onRefresh} 
            disabled={isRefreshing}
          >
            <RotateCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing Market Prices..." : "Refresh Live Prices"}
          </button>
        </div>
      </ScrollReveal>

      {/* Main Breakdown Section */}
      <div className="dashboard-grid">
        {/* Category Breakdown */}
        <ScrollReveal>
          <div className="glass-card" style={{ height: "100%" }}>
            <div className="card-header-accent" style={{ background: "linear-gradient(90deg, var(--plasma-lime), var(--plasma-cyan))" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px", fontFamily: "var(--font-serif)" }}>Asset Allocation</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {categories.map((cat, idx) => (
                <div key={idx} className="category-row">
                  <div className="category-info">
                    <div className="category-icon-wrapper" style={{ backgroundColor: cat.color }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="category-name">{cat.name}</div>
                      <div className="category-count">
                        {cat.count} {cat.count === 1 ? "asset" : "assets"}
                        {cat.extra ? ` • ${cat.extra}` : ""}
                      </div>
                    </div>
                  </div>
                  
                  <div className="category-values">
                    <div className="category-amount">{formatINR(cat.amount)}</div>
                    {cat.pnl !== null && (
                      <div className={`category-pnl ${cat.pnl >= 0 ? "text-[#10b981]" : "text-[#f43f5e]"}`}>
                        {cat.pnl >= 0 ? "+" : ""}{formatINR(cat.pnl)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Allocation Donut Chart */}
        <ScrollReveal>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            <div>
              <div className="card-header-accent" style={{ background: "linear-gradient(90deg, var(--plasma-purple), var(--plasma-pink))" }} />
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px", fontFamily: "var(--font-serif)" }}>Distribution Breakdown</h2>
            </div>
            
            <div className="chart-container">
              <DonutChart data={chartData} total={summary.total_net_worth} />
              
              <div className="chart-legend">
                {chartData.map((item, idx) => (
                  <div key={idx} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }} />
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>{item.label}</span>
                      <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                        {((item.value / summary.total_net_worth) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {chartData.length === 0 && (
                  <div className="legend-item" style={{ justifyContent: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                    No assets entered yet. Switch to Manage Portfolio to add holdings.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
