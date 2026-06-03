import React, { useState, useEffect, useRef } from "react";
import { Landmark, ArrowRight, ShieldCheck, PieChart, Activity, Zap, TrendingUp, Lock } from "lucide-react";


const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes floatUp {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { opacity: 0.3; }
  80% { opacity: 0.3; }
  100% { transform: translateY(-120vh) scale(1.0); opacity: 0; }
}
@keyframes lightPulse {
  0% { opacity: 0.2; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.5; transform: translateX(-50%) scale(1.2); }
  100% { opacity: 0.2; transform: translateX(-50%) scale(1); }
}
@keyframes waveEmit {
  0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
  70% { box-shadow: 0 0 0 100px rgba(234, 179, 8, 0); }
  100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
}
`;
document.head.appendChild(styleSheet);

function Particles() {
  const dots = Array.from({ length: 80 });
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {dots.map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: "-20px",
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 3 + 2}px`,
          height: `${Math.random() * 3 + 2}px`,
          background: "rgba(255, 255, 255, 0.8)",
          borderRadius: "50%",
          boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)",
          animation: `floatUp ${Math.random() * 7 + 4}s linear infinite`,
          animationDelay: `-${Math.random() * 12}s`
        }} />
      ))}
    </div>
  );
}

// --- Smooth Intersection Scroll Reveal ---
function ScrollReveal({ children, delay = 0, direction = "up" }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15 });

    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  const getTransform = () => {
    if (isVisible) return "translate(0, 0) scale(1) rotate(0deg)";
    switch (direction) {
      case "up": return "translateY(60px) scale(0.95) rotate(-1deg)";
      case "down": return "translateY(-60px) scale(0.95) rotate(1deg)";
      case "left": return "translateX(60px) scale(0.95) rotate(2deg)";
      case "right": return "translateX(-60px) scale(0.95) rotate(-2deg)";
      default: return "translateY(60px) scale(0.95) rotate(-1deg)";
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? "blur(0px)" : "blur(12px)",
        transform: getTransform(),
        transition: `opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, filter 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        willChange: "opacity, filter, transform"
      }}
    >
      {children}
    </div>
  );
}


function CompoundingGame() {
  const [years, setYears] = useState(1);
  const [monthly, setMonthly] = useState(5000);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setYears(prev => {
          if (prev >= 40) {
            setIsPlaying(false);
            return 40;
          }
          return prev + 1;
        });
      }, 150); // fast forward speed
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const principal = monthly * 12 * years;
  const rate = 0.12 / 12;
  const months = years * 12;
  const total = monthly * ((Math.pow(1 + rate, months) - 1) / rate);
  const interest = total - principal;

  const principalPercent = (principal / total) * 100;
  const interestPercent = (interest / total) * 100;

  const formatLarge = (num) => {
    if (num >= 10000000) return "₹" + (num / 10000000).toFixed(2) + " Cr";
    if (num >= 100000) return "₹" + (num / 100000).toFixed(2) + " L";
    return "₹" + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <div style={{ background: "rgba(10, 10, 14, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "60px", maxWidth: "900px", margin: "0 auto", backdropFilter: "blur(20px)" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h3 style={{ fontSize: "14px", color: "#b84a00", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "16px", fontWeight: "700" }}>Interactive Simulation</h3>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "42px", fontWeight: "500", marginBottom: "16px" }}>The Avalanche Effect</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "500px", margin: "0 auto" }}>
          See how an insignificant monthly habit scales over time. Hold the fast-forward button to traverse 40 years of market compounding.
        </p>
      </div>

      <div style={{ display: "flex", gap: "60px", alignItems: "flex-end" }}>
        
        {/* Controls */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "30px", paddingBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Monthly Investment</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>{formatLarge(monthly)}</span>
            </div>
            <input 
              type="range" min="1000" max="50000" step="1000" 
              value={monthly} onChange={(e) => { setMonthly(Number(e.target.value)); setYears(1); setIsPlaying(false); }}
              style={{ width: "100%", accentColor: "#b84a00" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Timeline (Years)</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>{years} Years</span>
            </div>
            <input 
              type="range" min="1" max="40" step="1" 
              value={years} onChange={(e) => { setYears(Number(e.target.value)); setIsPlaying(false); }}
              style={{ width: "100%", accentColor: "#b84a00" }}
            />
          </div>

          <button 
            onMouseDown={() => setIsPlaying(true)} 
            onMouseUp={() => setIsPlaying(false)}
            onMouseLeave={() => setIsPlaying(false)}
            onTouchStart={() => setIsPlaying(true)}
            onTouchEnd={() => setIsPlaying(false)}
            style={{ 
              marginTop: "20px", padding: "20px", background: isPlaying ? "#c62828" : "rgba(255,255,255,0.05)", 
              border: isPlaying ? "1px solid #b84a00" : "1px solid rgba(255,255,255,0.1)", 
              color: "#fff", borderRadius: "12px", fontSize: "14px", fontWeight: "700", 
              textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", 
              transition: "all 0.1s ease", userSelect: "none"
            }}
          >
            {isPlaying ? ">>> Accelerating Time >>>" : "Hold to Fast Forward Time"}
          </button>
        </div>

        {/* Visualizer */}
        <div style={{ flex: 1, display: "flex", gap: "40px", alignItems: "flex-end", height: "350px" }}>
          
          {/* Stacked relative bar */}
          <div style={{ width: "80px", height: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column-reverse", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ height: `${principalPercent}%`, background: "rgba(255,255,255,0.2)", transition: "height 0.1s linear", display: "flex", alignItems: "center", justifyContent: "center" }} />
            <div style={{ height: `${interestPercent}%`, background: "linear-gradient(to top, #c62828, #ef5350)", transition: "height 0.1s linear" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>Total Compounded Value</div>
              <div style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: "700", color: "#ef5350", lineHeight: 1 }}>
                {formatLarge(total)}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
              <div>
                <div style={{ width: "12px", height: "12px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", display: "inline-block", marginRight: "8px" }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Principal: {formatLarge(principal)}</span>
              </div>
              <div>
                <div style={{ width: "12px", height: "12px", background: "#b84a00", borderRadius: "2px", display: "inline-block", marginRight: "8px" }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Interest: {formatLarge(interest)}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px", padding: "16px", background: "rgba(184, 74, 0, 0.1)", border: "1px solid rgba(184, 74, 0, 0.2)", borderRadius: "8px", fontSize: "13px", color: "#ffcdd2", lineHeight: 1.5 }}>
              At Year {years}, your money is making <strong>{formatLarge(total * rate)}</strong> per month in pure interest, which is <strong>{((total * rate)/monthly).toFixed(1)}x</strong> your actual monthly contribution!
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function LandingView({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = isLogin ? "http://localhost:8000/api/login" : "http://localhost:8000/api/signup";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (isLogin) {
        onLoginSuccess(data.access_token, data.user);
      } else {
        setIsLogin(true);
        setError("Account created! Please log in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-dark)", color: "#fff", fontFamily: "var(--font-sans)", overflowX: "hidden" }}>
      <Particles />
      
      {/* Global Plasma Background (Same as App theme) */}
      <div className="plasma-background">
        <div className="wave-container">
          <div className="liquid-wave-red" />
          <div className="liquid-wave-orange" />
          <div className="liquid-wave-yellow" />
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px", position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", fontFamily: "var(--font-sans)", fontWeight: "800", fontSize: "18px", letterSpacing: "3px" }}>
            <Landmark size={24} style={{ color: "#b84a00" }} />
            <span>PROJECT FUTURE</span>
          </div>
        </div>

        {/* Hero Content & Login Modal */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "60px", alignItems: "center", margin: "auto 0" }}>
          
          <ScrollReveal direction="right">
            <div style={{ maxWidth: "700px" }}>
              
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(48px, 6vw, 84px)", fontWeight: "500", lineHeight: 1.05, marginBottom: "30px", letterSpacing: "-1px" }}>
                Command Your<br/>Financial Trajectory
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "18px", lineHeight: 1.7, marginBottom: "40px", maxWidth: "540px" }}>
                A highly secure, data-driven ledger architecture. We compile your disjointed assets, liabilities, and budgets into one unified, real-time compounding engine.
              </p>
              
              <div style={{ display: "flex", gap: "30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ShieldCheck size={20} color="#00e676" />
                  <span style={{ fontSize: "14px", letterSpacing: "1px" }}>Isolated Vaults</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Activity size={20} color="#b84a00" />
                  <span style={{ fontSize: "14px", letterSpacing: "1px" }}>Live Market Sync</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Login Modal */}
          <ScrollReveal direction="left" delay={0.2}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", padding: "50px", borderRadius: "24px", backdropFilter: "blur(20px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
              
              <div style={{ display: "flex", gap: "20px", marginBottom: "40px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
                <button 
                  onClick={() => setIsLogin(true)}
                  style={{ background: "transparent", border: "none", color: isLogin ? "#fff" : "var(--text-secondary)", fontSize: "18px", fontWeight: "700", cursor: "pointer", transition: "0.3s" }}
                >
                  System Login
                </button>
                <button 
                  onClick={() => setIsLogin(false)}
                  style={{ background: "transparent", border: "none", color: !isLogin ? "#fff" : "var(--text-secondary)", fontSize: "18px", fontWeight: "700", cursor: "pointer", transition: "0.3s" }}
                >
                  Initialize Node
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {!isLogin && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Full Identity</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Secure Comms (Phone)</label>
                      <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: "100%", padding: "14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Routing Key (Email)</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ width: "100%", padding: "14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                </div>
                
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Cryptographic Hash (Password)</label>
                  <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: "100%", padding: "14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", outline: "none", fontSize: "14px" }} />
                </div>

                {error && <div style={{ color: error.includes("created") ? "#00e676" : "#f43f5e", fontSize: "13px", padding: "10px", border: `1px solid ${error.includes("created") ? "rgba(0,230,118,0.3)" : "rgba(244,63,94,0.3)"}`, background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>{error}</div>}

                <button type="submit" disabled={isLoading} style={{ width: "100%", padding: "16px", marginTop: "10px", background: "#fff", color: "#000", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", transition: "all 0.3s ease" }}>
                  {isLoading ? "Authenticating..." : isLogin ? "Establish Link" : "Deploy Configuration"}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Feature Sections (Scroll down) */}
      <div style={{ padding: "120px 40px", maxWidth: "1240px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "160px" }}>
        
        {/* Feature 1 */}
        <ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "20px", fontWeight: "700" }}>Omnichannel Aggregation</h3>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "48px", lineHeight: 1.1, marginBottom: "30px", fontWeight: "500" }}>Total Ecosystem<br/>Visibility.</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "18px", lineHeight: 1.7 }}>
                Mount Indian Stocks, Mutual Funds, US Equities, and Real Estate Investment Trusts into a singular dashboard. The system pulls live market data via Yahoo Finance to provide real-time, second-by-second valuation adjustments.
              </p>
            </div>
            <div style={{ height: "400px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-subtle)", position: "relative" }}>
              <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" alt="Dashboard Chart" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(4,4,5,0) 0%, rgba(4,4,5,0.8) 100%)" }} />
            </div>
          </div>
        </ScrollReveal>

        {/* Feature 2 */}
        <ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div style={{ height: "400px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-subtle)", position: "relative" }}>
              <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80" alt="Architecture" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(225deg, rgba(4,4,5,0) 0%, rgba(4,4,5,0.8) 100%)" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "20px", fontWeight: "700" }}>True Amortization Engine</h3>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "48px", lineHeight: 1.1, marginBottom: "30px", fontWeight: "500" }}>Advanced Liability<br/>Mathematics.</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "18px", lineHeight: 1.7 }}>
                Stop guessing your loan balance. Our custom amortization engine automatically calculates daily interest, variable EMI schedules, and one-time prepayments to give you the exact remaining principal on your debts.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Feature 3 */}
        <ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "20px", fontWeight: "700" }}>Automated Intelligence</h3>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "48px", lineHeight: 1.1, marginBottom: "30px", fontWeight: "500" }}>AI Statement<br/>Parsing.</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "18px", lineHeight: 1.7 }}>
                Upload raw Excel bank statements. Our parser cleans the data, uses heuristic memory to learn your custom merchant mappings, and auto-categorizes your expenses to generate a complete financial X-ray.
              </p>
            </div>
            <div style={{ height: "400px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-subtle)", position: "relative" }}>
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" alt="Tech Abstract" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(4,4,5,0) 0%, rgba(4,4,5,0.8) 100%)" }} />
            </div>
          </div>
        </ScrollReveal>

      </div>

      
      {/* Interactive Game Section */}
      <ScrollReveal>
        <div style={{ padding: "0 40px", marginBottom: "160px" }}>
          <CompoundingGame />
        </div>
      </ScrollReveal>

      {/* Footer CTA */}
      <ScrollReveal>
        <div style={{ padding: "120px 40px", textAlign: "center", borderTop: "1px solid var(--border-subtle)", background: "rgba(10, 10, 14, 0.4)", position: "relative", overflow: "hidden" }}>
          
          {/* Intense Yellow Core Light */}
          <div style={{ position: "absolute", bottom: "-30%", left: "50%", transform: "translateX(-50%)", width: "120vw", height: "60vh", background: "radial-gradient(ellipse at bottom, rgba(234, 179, 8, 0.4) 0%, rgba(202, 138, 4, 0.1) 40%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", animation: "lightPulse 4s ease-in-out infinite", zIndex: 0 }} />
          
          {/* Wave Emitting Base line */}
          <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "60vw", height: "4px", background: "rgba(234, 179, 8, 0.8)", filter: "blur(2px)", borderRadius: "100%", animation: "waveEmit 3s infinite", zIndex: 0 }} />

          
          
          <Lock size={48} color="var(--text-secondary)" style={{ margin: "0 auto 30px auto", opacity: 0.5 }} />
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "56px", marginBottom: "24px", fontWeight: "500" }}>Ready to Compound?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "18px", maxWidth: "600px", margin: "0 auto 50px auto" }}>
            Securely encrypt your financial telemetry today. No external databases, no third-party tracking. Just you and your data.
          </p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: "#fff", color: "#000", border: "none", padding: "18px 40px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", borderRadius: "100px", transition: "all 0.3s ease" }}>
            Initialize Node Now
          </button>
        </div>
      </ScrollReveal>

      {/* Actual Footer */}
      <footer style={{ background: "rgba(10, 10, 14, 0.4)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Landmark size={18} style={{ color: "#b84a00" }} />
          <span style={{ fontWeight: "700", letterSpacing: "1px", color: "#fff" }}>PROJECT FUTURE</span>
        </div>
        <div style={{ display: "flex", gap: "30px" }}>
          <span style={{ cursor: "pointer", transition: "0.2s", color: "var(--text-secondary)" }} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "var(--text-secondary)"}>Privacy Protocol</span>
          <span style={{ cursor: "pointer", transition: "0.2s", color: "var(--text-secondary)" }} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "var(--text-secondary)"}>Terms of Node</span>
          <span style={{ cursor: "pointer", transition: "0.2s", color: "var(--text-secondary)" }} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "var(--text-secondary)"}>Contact Admin</span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Aviral Mishra. All rights encrypted.
        </div>
      </footer>
      
    </div>
  );
}
