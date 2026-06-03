import React from "react";
import { ShieldAlert } from "lucide-react";

export default function InsurancesView() {
  return (
    <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", background: "rgba(10, 10, 14, 0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <ShieldAlert size={64} style={{ color: "var(--text-secondary)", marginBottom: "24px", opacity: 0.5 }} />
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", fontWeight: "500", color: "#fff", marginBottom: "16px" }}>Insurances Module</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "400px", textAlign: "center", lineHeight: "1.6" }}>
        This module is currently under development. Soon, you will be able to track your life, health, and property insurance policies here to ensure comprehensive coverage.
      </p>
    </div>
  );
}
