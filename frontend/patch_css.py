import sys

with open("a:/Finance Tracker/frontend/src/index.css", "r", encoding="utf-8") as f:
    content = f.read()

# Add networth styles at the bottom
new_styles = """
/* Dashboard Networth Banner */
.networth-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
}

.networth-label {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.networth-value {
  font-family: var(--font-serif);
  font-size: 56px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

.networth-change {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 24px;
}

.networth-change.positive {
  color: var(--text-green);
}

.networth-change.negative {
  color: #f43f5e;
}
"""

if ".networth-change" not in content:
    with open("a:/Finance Tracker/frontend/src/index.css", "a", encoding="utf-8") as f:
        f.write("\n" + new_styles)
        print("Added networth styles")
else:
    print("Styles already exist")
