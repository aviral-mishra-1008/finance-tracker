import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";

export default function PortfolioView({ portfolio, onAdd, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState("bank_balances");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State Control
  const [formData, setFormData] = useState({});

  // Precise Number Formatter Utilities
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatUSD = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val || 0);
  };

  const tabs = [
    { id: "bank_balances", label: "Bank Balances", accent: "#9a1026" },
    { id: "stocks_etfs", label: "Indian Stocks & ETFs", accent: "#b84a00" },
    { id: "mutual_funds", label: "Mutual Funds", accent: "#a38000" },
    { id: "reits", label: "REITs", accent: "#d4af37" },
    { id: "government_bonds", label: "Govt Bonds", accent: "#708090" },
    { id: "us_stocks", label: "US Stocks", accent: "#5c6bc0" }
  ];

  const currentAccent = tabs.find((t) => t.id === activeTab)?.accent || "#ff6d00";

  const handleOpenAddModal = () => {
    setEditingItem(null);
    if (activeTab === "bank_balances") {
      setFormData({ name: "", balance: "", currency: "INR" });
    } else if (activeTab === "stocks_etfs") {
      setFormData({ ticker: "", name: "", quantity: "", avg_buy_price: "", sector: "Broad Market", asset_type: "Indian Stock", exchange: "NSE" });
    } else if (activeTab === "mutual_funds") {
      setFormData({ name: "", units: "", avg_buy_nav: "", scheme_code: "", sector: "Equity" });
    } else if (activeTab === "reits") {
      setFormData({ ticker: "", name: "", quantity: "", avg_buy_price: "", dividend_yield_pct: "0", buy_date: "", sector: "Real Estate", exchange: "NSE" });
    } else if (activeTab === "government_bonds") {
      setFormData({ name: "", principal: "", interest_rate: "", purchase_date: "", maturity_date: "", interest_payout_frequency: "semi-annual" });
    } else if (activeTab === "us_stocks") {
      setFormData({ ticker: "", name: "", quantity: "", avg_buy_price: "", sector: "Technology", currency: "USD" });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const castedData = { ...formData };

    if (activeTab === "bank_balances") {
      castedData.balance = parseFloat(castedData.balance);
    } else if (activeTab === "stocks_etfs") {
      castedData.quantity = parseFloat(castedData.quantity);
      castedData.avg_buy_price = parseFloat(castedData.avg_buy_price);
      if (castedData.ticker && !castedData.ticker.includes(".")) {
        castedData.ticker = castedData.ticker + (castedData.exchange === "BSE" ? ".BO" : ".NS");
      }
    } else if (activeTab === "mutual_funds") {
      castedData.units = parseFloat(castedData.units);
      castedData.avg_buy_nav = parseFloat(castedData.avg_buy_nav);
    } else if (activeTab === "reits") {
      castedData.quantity = parseFloat(castedData.quantity);
      castedData.avg_buy_price = parseFloat(castedData.avg_buy_price);
      castedData.dividend_yield_pct = parseFloat(castedData.dividend_yield_pct || 0);
      if (castedData.ticker && !castedData.ticker.includes(".")) { castedData.ticker = castedData.ticker + (castedData.exchange === "BSE" ? ".BO" : ".NS"); }
    } else if (activeTab === "government_bonds") {
      castedData.principal = parseFloat(castedData.principal);
      castedData.interest_rate = parseFloat(castedData.interest_rate);
    } else if (activeTab === "us_stocks") {
      castedData.quantity = parseFloat(castedData.quantity);
      castedData.avg_buy_price = parseFloat(castedData.avg_buy_price);
    }

    if (editingItem) {
      onUpdate(activeTab, editingItem.id, castedData);
    } else {
      onAdd(activeTab, castedData);
    }
    setIsModalOpen(false);
  };

  const listData = portfolio?.[activeTab] || [];

  return (
    <div style={{ marginTop: "20px" }}>
      {/* Tab Navigation & Allocation Triggers Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? "rgba(255,255,255,0.02)" : "transparent",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  border: "1px solid",
                  borderColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
                {isActive && (
                  <div style={{ position: "absolute", bottom: "-1px", left: 0, right: 0, height: "2px", background: tab.accent }} />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: `1px solid ${currentAccent}`,
            padding: "12px 24px",
            fontSize: "12px",
            fontWeight: "700",
            fontFamily: "var(--font-sans)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = currentAccent; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      {/* Main Ledger Core Display Block */}
      <div style={{ background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
        {listData.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px", textAlign: "center" }}>
            <AlertCircle size={44} strokeWidth={1.2} style={{ color: currentAccent, marginBottom: "20px", opacity: 0.8 }} />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "8px", color: "#ffffff" }}>No entries discovered</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: "1.6" }}>
              Click "Add Asset" above to record your first entry into this system configuration layer.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontFamily: "var(--font-sans)", fontSize: "14px" }}>

              {/* --- BANK BALANCES VIEW --- */}
              {activeTab === "bank_balances" && (
                <>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>BANK NAME</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>BALANCE</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CURRENCY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>VALUE (INR)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "18px 24px", fontWeight: "600", color: "#ffffff" }}>{item.name}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.currency === "USD" ? formatUSD(item.balance) : formatINR(item.balance)}</td>
                        <td style={{ padding: "18px 24px" }}><span style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "700", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff" }}>{item.currency || "INR"}</span></td>
                        <td style={{ padding: "18px 24px", fontWeight: "700", color: "var(--text-green)" }}>{formatINR(item.value_inr)}</td>
                        <td style={{ padding: "18px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                            <button onClick={() => onDelete(activeTab, item.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* --- INDIAN STOCKS & ETFS VIEW --- */}
              {activeTab === "stocks_etfs" && (
                <>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>ASSET</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>QTY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>AVG BUY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CURRENT</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>COST BASIS</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>VALUE (INR)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>ALL-TIME P&L</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>DAILY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "18px 24px" }}>
                          <div style={{ fontWeight: "600", color: "#ffffff" }}>{item.name || item.ticker}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>{item.asset_type}</span>
                            <span>{item.ticker}</span>
                          </div>
                        </td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.quantity}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.avg_buy_price)}</td>
                        <td style={{ padding: "18px 24px", color: "#ffffff" }}>{formatINR(item.current_price)}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.cost_inr)}</td>
                        <td style={{ padding: "18px 24px", fontWeight: "700", color: "#ffffff" }}>{formatINR(item.value_inr)}</td>
                        <td style={{ padding: "18px 24px", color: item.pnl_inr >= 0 ? "var(--text-green)" : "#ef4444", fontWeight: "600" }}>
                          <div>{item.pnl_inr >= 0 ? "+" : ""}{formatINR(item.pnl_inr)}</div>
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>{item.pnl_inr >= 0 ? "+" : ""}{item.pnl_pct}%</div>
                        </td>
                        <td style={{ padding: "18px 24px", color: item.daily_change_inr >= 0 ? "var(--text-green)" : "#ef4444" }}>
                          <div>{item.daily_change_inr >= 0 ? "+" : ""}{formatINR(item.daily_change_inr)}</div>
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>{item.daily_change_inr >= 0 ? "+" : ""}{item.daily_change_pct.toFixed(2)}%</div>
                        </td>
                        <td style={{ padding: "18px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                            <button onClick={() => onDelete(activeTab, item.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* --- MUTUAL FUNDS VIEW --- */}
              {activeTab === "mutual_funds" && (
                <>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>FUND SCHEME</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>UNITS</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>AVG BUY NAV</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CURRENT NAV</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>COST BASIS</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>VALUE (INR)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>ALL-TIME P&L</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>DAILY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "18px 24px" }}>
                          <div style={{ fontWeight: "600", color: "#ffffff", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || "Syncing data standard name..."}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Code: {item.scheme_code}</div>
                        </td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.units}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.avg_buy_nav)}</td>
                        <td style={{ padding: "18px 24px", color: "#ffffff" }}>{formatINR(item.current_nav)}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.cost_inr)}</td>
                        <td style={{ padding: "18px 24px", fontWeight: "700", color: "#ffffff" }}>{formatINR(item.value_inr)}</td>
                        <td style={{ padding: "18px 24px", color: item.pnl_inr >= 0 ? "var(--text-green)" : "#ef4444", fontWeight: "600" }}>
                          <div>{item.pnl_inr >= 0 ? "+" : ""}{formatINR(item.pnl_inr)}</div>
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>{item.pnl_inr >= 0 ? "+" : ""}{item.pnl_pct}%</div>
                        </td>
                        <td style={{ padding: "18px 24px", color: item.daily_change_inr >= 0 ? "var(--text-green)" : "#ef4444" }}>
                          <div>{item.daily_change_inr >= 0 ? "+" : ""}{formatINR(item.daily_change_inr)}</div>
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>{item.daily_change_inr >= 0 ? "+" : ""}{item.daily_change_pct.toFixed(2)}%</div>
                        </td>
                        <td style={{ padding: "18px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                            <button onClick={() => onDelete(activeTab, item.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* --- REITS VIEW --- */}
              {activeTab === "reits" && (
                <>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>REIT</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>QTY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>AVG BUY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CURRENT</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>COST BASIS</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>VALUE (INR)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>YIELD (%)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>TOTAL RETURN</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "18px 24px" }}>
                          <div style={{ fontWeight: "600", color: "#ffffff" }}>{item.name || item.ticker}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{item.ticker}</div>
                        </td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.quantity}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.avg_buy_price)}</td>
                        <td style={{ padding: "18px 24px", color: "#ffffff" }}>{formatINR(item.current_price)}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.cost_inr)}</td>
                        <td style={{ padding: "18px 24px", fontWeight: "700", color: "#ffffff" }}>{formatINR(item.value_inr)}</td>
                        <td style={{ padding: "18px 24px", color: "#ffffff" }}>{item.dividend_yield_pct ? `${item.dividend_yield_pct}%` : `${((item.total_dividends_received / item.cost_inr) * 100 || 0).toFixed(2)}%`}</td>
                        <td style={{ padding: "18px 24px", color: item.total_return_inr >= 0 ? "var(--text-green)" : "#ef4444", fontWeight: "600" }}>
                          <div>{item.total_return_inr >= 0 ? "+" : ""}{formatINR(item.total_return_inr)}</div>
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>{item.total_return_inr >= 0 ? "+" : ""}{item.total_return_pct.toFixed(2)}%</div>
                        </td>
                        <td style={{ padding: "18px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                            <button onClick={() => onDelete(activeTab, item.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* --- GOVT BONDS VIEW --- */}
              {activeTab === "government_bonds" && (
                <>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>BOND NAME</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>PRINCIPAL</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>RATE</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>PURCHASE</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>MATURITY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>YIELD EARNED</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>TOTAL VALUE</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "18px 24px" }}>
                          <div style={{ fontWeight: "600", color: "#ffffff" }}>{item.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Freq: {item.interest_payout_frequency}</div>
                        </td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.principal)}</td>
                        <td style={{ padding: "18px 24px", color: "#ffffff" }}>{item.interest_rate}%</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.purchase_date}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.maturity_date}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-green)", fontWeight: "600" }}>+{formatINR(item.interest_earned)}</td>
                        <td style={{ padding: "18px 24px", fontWeight: "700", color: "#ffffff" }}>{formatINR(item.value_inr)}</td>
                        <td style={{ padding: "18px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                            <button onClick={() => onDelete(activeTab, item.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {/* --- US STOCKS VIEW --- */}
              {activeTab === "us_stocks" && (
                <>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>ASSET</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>QTY</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>AVG BUY (USD)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>CURRENT (USD)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>COST (INR)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>VALUE (INR)</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px" }}>ALL-TIME P&L</th>
                      <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "18px 24px" }}>
                          <div style={{ fontWeight: "600", color: "#ffffff" }}>{item.name || item.ticker}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "9px", padding: "1px 6px", background: "rgba(92,107,192,0.15)", border: "1px solid rgba(92,107,192,0.3)", color: "#a78bfa" }}>US Stock</span>
                            <span>{item.ticker}</span>
                          </div>
                        </td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{item.quantity}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatUSD(item.avg_buy_price)}</td>
                        <td style={{ padding: "18px 24px", color: "#ffffff" }}>{formatUSD(item.current_price_usd)}</td>
                        <td style={{ padding: "18px 24px", color: "var(--text-secondary)" }}>{formatINR(item.cost_inr)}</td>
                        <td style={{ padding: "18px 24px", fontWeight: "700", color: "#ffffff" }}>{formatINR(item.value_inr)}</td>
                        <td style={{ padding: "18px 24px", color: item.pnl_inr >= 0 ? "var(--text-green)" : "#ef4444", fontWeight: "600" }}>
                          <div>{item.pnl_inr >= 0 ? "+" : ""}{formatINR(item.pnl_inr)}</div>
                          <div style={{ fontSize: "11px", opacity: 0.8 }}>{item.pnl_inr >= 0 ? "+" : ""}{item.pnl_pct}%</div>
                        </td>
                        <td style={{ padding: "18px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "14px", justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenEditModal(item)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                            <button onClick={() => onDelete(activeTab, item.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

            </table>
          </div>
        )}
      </div>

      {/* Modern Matte Overlay Modal Component */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,5,0.94)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.08)", width: "100%", maxWidth: "520px", padding: "40px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: currentAccent }} />

            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>

            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: "500", marginBottom: "32px", color: "#ffffff" }}>
              {editingItem ? "Edit Asset Holding" : "Register New Asset"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {activeTab === "bank_balances" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Bank Name</label>
                    <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HDFC Bank, SBI Savings" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Balance Amount</label>
                      <input type="number" step="any" required value={formData.balance || ""} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} placeholder="e.g. 50000" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Currency</label>
                      <select value={formData.currency || "INR"} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "stocks_etfs" && (
                <>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Ticker</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="text" required value={formData.ticker || ""} onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })} placeholder="e.g. RELIANCE" style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                        <select value={formData.exchange || "NSE"} onChange={(e) => setFormData({ ...formData, exchange: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px", fontSize: "14px", outline: "none" }}>
                          <option value="NSE">NSE</option>
                          <option value="BSE">BSE</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Asset Type</label>
                      <select value={formData.asset_type || "Indian Stock"} onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }}>
                        <option value="Indian Stock">Indian Stock</option>
                        <option value="Indian ETF">Indian ETF</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Company/Asset Name</label>
                    <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Reliance Industries Ltd" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Quantity</label>
                      <input type="number" step="any" required value={formData.quantity || ""} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="e.g. 10" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Avg Buy Price (₹)</label>
                      <input type="number" step="any" required value={formData.avg_buy_price || ""} onChange={(e) => setFormData({ ...formData, avg_buy_price: e.target.value })} placeholder="e.g. 2450.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Sector / Category Tag</label>
                    <input type="text" value={formData.sector || ""} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} placeholder="e.g. Technology, Energy, Defense" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                  </div>
                </>
              )}

              {activeTab === "mutual_funds" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>AMFI Scheme Code (6-Digit ID)</label>
                    <input type="text" required value={formData.scheme_code || ""} onChange={(e) => setFormData({ ...formData, scheme_code: e.target.value })} placeholder="e.g. 122639" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", opacity: 0.6 }}>Provides automated daily pricing updates via API sync hooks.</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Fund Name (Optional)</label>
                    <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Leaves blank to fetch via database lookup" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Units Owned</label>
                      <input type="number" step="any" required value={formData.units || ""} onChange={(e) => setFormData({ ...formData, units: e.target.value })} placeholder="e.g. 450.25" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Average Buy NAV (₹)</label>
                      <input type="number" step="any" required value={formData.avg_buy_nav || ""} onChange={(e) => setFormData({ ...formData, avg_buy_nav: e.target.value })} placeholder="e.g. 56.4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "reits" && (
                <>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Ticker (REIT)</label>
                      <div style={{ display: "flex", gap: "8px" }}><input type="text" required value={formData.ticker || ""} onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })} placeholder="e.g. EMBASSY" style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} /><select value={formData.exchange || "NSE"} onChange={(e) => setFormData({ ...formData, exchange: e.target.value })} style={{ background: "#0a0a0d", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px", fontSize: "14px", outline: "none" }}><option value="NSE">NSE</option><option value="BSE">BSE</option></select></div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>REIT Name</label>
                      <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Embassy Parks REIT" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Quantity</label>
                      <input type="number" step="any" required value={formData.quantity || ""} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="100" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Avg Buy Price (₹)</label>
                      <input type="number" step="any" required value={formData.avg_buy_price || ""} onChange={(e) => setFormData({ ...formData, avg_buy_price: e.target.value })} placeholder="310" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Yearly Dividend Yield (%)</label>
                      <input type="number" step="any" value={formData.dividend_yield_pct || ""} onChange={(e) => setFormData({ ...formData, dividend_yield_pct: e.target.value })} placeholder="e.g. 6.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Buy Date</label>
                      <input type="date" required value={formData.buy_date || ""} onChange={(e) => setFormData({ ...formData, buy_date: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "government_bonds" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Bond Name</label>
                    <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. GOI 7.18% 2033" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Principal Amount (₹)</label>
                      <input type="number" step="any" required value={formData.principal || ""} onChange={(e) => setFormData({ ...formData, principal: e.target.value })} placeholder="100000" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Annual Interest Rate (%)</label>
                      <input type="number" step="any" required value={formData.interest_rate || ""} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} placeholder="7.18" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Purchase Date</label>
                      <input type="date" required value={formData.purchase_date || ""} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Maturity Date</label>
                      <input type="date" required value={formData.maturity_date || ""} onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "us_stocks" && (
                <>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Ticker (US Market)</label>
                      <input type="text" required value={formData.ticker || ""} onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })} placeholder="e.g. MSFT" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Company Name</label>
                      <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Microsoft Corp" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                  <div className="responsive-grid-2 mobile-stack">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Quantity</label>
                      <input type="number" step="any" required value={formData.quantity || ""} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "1px" }}>Avg Buy Price (USD $)</label>
                      <input type="number" step="any" required value={formData.avg_buy_price || ""} onChange={(e) => setFormData({ ...formData, avg_buy_price: e.target.value })} placeholder="180.50" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#ffffff", padding: "12px 16px", fontSize: "14px", outline: "none" }} />
                    </div>
                  </div>
                </>
              )}

              {/* Form Action Controls */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", padding: "12px 24px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ background: "#ffffff", border: "1px solid #ffffff", color: "#000000", padding: "12px 24px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>
                  {editingItem ? "Update Holding" : "Add Holding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}