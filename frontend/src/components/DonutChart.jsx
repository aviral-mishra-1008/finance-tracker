import React, { useEffect, useRef } from "react";

export default function DonutChart({ data, total }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Scale canvas for high-DPI displays
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 10;
    const innerRadius = outerRadius - 18;

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (total === 0 || data.length === 0) {
      // Draw empty placeholder ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.stroke();
      return;
    }

    let startAngle = -Math.PI / 2;

    // Draw slices
    data.forEach((slice) => {
      const sliceAngle = (slice.value / total) * 2 * Math.PI;
      if (sliceAngle === 0) return;

      // Draw slice arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = slice.color;
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.lineCap = "round";
      ctx.stroke();

      // Add a subtle outer glow using shadow
      ctx.shadowColor = slice.color;
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      startAngle += sliceAngle;
    });

  }, [data, total]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        style={{ width: "250px", height: "250px", display: "block" }}
      />
      <div className="chart-center-text">
        <div className="chart-center-title">Net Worth</div>
        <div className="chart-center-val">
          ₹{(total >= 10000000 
            ? (total / 10000000).toFixed(2) + " Cr" 
            : total >= 100000 
            ? (total / 100000).toFixed(2) + " L" 
            : total.toLocaleString("en-IN"))}
        </div>
      </div>
    </div>
  );
}
