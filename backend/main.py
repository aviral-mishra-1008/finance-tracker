import uuid
import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import load_db, save_db, load_transactions, save_transactions, load_custom_rules, save_custom_rules, load_users, save_users
from auth import get_current_user, get_password_hash, create_access_token, verify_password
from fastapi import Depends
from statement_parser import parse_bank_statement
from price_fetcher import (
    fetch_yahoo_finance_price,
    fetch_mutual_fund_nav,
    get_usd_to_inr_rate,
    calculate_bond_accruals,
    fetch_epf_interest_rate
)

app = FastAPI(title="Project Future Finance API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC REQUEST MODELS -----------------

class BankBalanceModel(BaseModel):
    name: str
    balance: float
    currency: str = "INR"

class StockETFModel(BaseModel):
    ticker: str
    name: Optional[str] = ""
    quantity: float
    avg_buy_price: float
    sector: str = "Broad Market"
    asset_type: str = "Indian Stock"

class MutualFundModel(BaseModel):
    name: Optional[str] = ""
    units: float
    avg_buy_nav: float
    scheme_code: str
    sector: str = "Equity"

class REITModel(BaseModel):
    ticker: str
    name: Optional[str] = ""
    quantity: float
    avg_buy_price: float
    dividend_yield_pct: Optional[float] = 0.0
    total_dividends_received: Optional[float] = 0.0
    sector: str = "Real Estate"
    buy_date: Optional[str] = None

class GovernmentBondModel(BaseModel):
    name: str
    principal: float
    interest_rate: float
    purchase_date: str
    maturity_date: str
    interest_payout_frequency: str = "semi-annual"

class USStockModel(BaseModel):
    ticker: str
    name: Optional[str] = ""
    quantity: float
    avg_buy_price: float
    sector: str = "Technology"
    currency: str = "USD"

class EMIEntryModel(BaseModel):
    start_date: str
    emi: float
    interest_rate: Optional[float] = None

class OneTimePaymentModel(BaseModel):
    date: str
    amount: float

class LoanModel(BaseModel):
    name: str
    principal: float
    annual_interest_rate: float
    emi_schedule: List[EMIEntryModel] = []
    one_time_payments: List[OneTimePaymentModel] = []

class EmergencyFundEntryModel(BaseModel):
    date: str
    amount: float
    description: Optional[str] = ""

class ExpenseItemModel(BaseModel):
    category: str
    amount: float
    description: Optional[str] = ""

class BudgetMonthModel(BaseModel):
    month_id: str
    inhand_salary: float
    expenses: List[ExpenseItemModel] = []

class ContributionHistoryModel(BaseModel):
    effective_month: str
    amount: float

class RetirementAccountModel(BaseModel):
    account_type: str # "EPF" or "NPS"
    current_balance: float
    base_balance: Optional[float] = None
    base_month: Optional[str] = None
    monthly_contribution: Optional[float] = 0.0
    expected_annual_return: float
    start_date: Optional[str] = None # YYYY-MM
    last_calculated_month: Optional[str] = None
    contribution_history: List[ContributionHistoryModel] = []

# ----------------- ETF CLASSIFICATION HELPER -----------------

def format_reit_ticker(ticker: str) -> str:
    if not ticker: return ticker
    if ticker.endswith(".NS") and not ticker.endswith("-RR.NS"):
        base = ticker.replace(".NS", "")
        if not base.endswith("-RR"): return f"{base}-RR.NS"
    elif ticker.endswith(".BO") and not ticker.endswith("-RR.BO"):
        base = ticker.replace(".BO", "")
        if not base.endswith("-RR"): return f"{base}-RR.BO"
    return ticker

def classify_etf(ticker: str, sector: str) -> str:
    t = ticker.upper()
    if "GOLD" in t or "GOLDBEES" in t:
        return "Commodity (Gold)"
    elif "SILVER" in t or "SILVERBEES" in t:
        return "Commodity (Silver)"
    elif "PSU" in t or "BANK" in t or "FIN" in t:
        return "Sectoral (Financials)"
    elif "PHARMA" in t or "HEALTH" in t:
        return "Sectoral (Pharma)"
    elif "IT" in t or "TECH" in t:
        return "Sectoral (Tech)"
    elif "AUTO" in t:
        return "Sectoral (Auto)"
    elif "DEF" in t or "DEFENCE" in t:
        return "Thematic (Defense)"
    elif "INFRA" in t:
        return "Thematic (Infra)"
    
    if sector and sector not in ["Broad Market", "Sectoral", "Thematic"]:
        return sector
    return "Broad Market"

# ----------------- PORTFOLIO COMPILER ENGINE -----------------

def calculate_portfolio_details(db_data: dict, current_user: dict) -> dict:
    usd_inr = get_usd_to_inr_rate()
    
    response = {
        "summary": {
            "total_net_worth": 0.0,
            "bank_balance_total": 0.0,
            "stocks_etfs_total": 0.0,
            "mutual_funds_total": 0.0,
            "reits_total": 0.0,
            "government_bonds_total": 0.0,
            "us_stocks_total": 0.0,
            "loans_total": 0.0,
            "emergency_funds_total": 0.0,
            "total_pnl": 0.0,
            "usd_inr_rate": usd_inr
        },
        "bank_balances": [],
        "stocks_etfs": [],
        "mutual_funds": [],
        "reits": [],
        "government_bonds": [],
        "us_stocks": [],
        "loans": [],
        "emergency_funds": [],
        "pf_nps": [],
        "budgets": [],
        "insurances": [],
        "cas_analyzer": [],
        "history": []
    }

    # 1. Bank Balances
    for bank in db_data.get("bank_balances", []):
        rate = usd_inr if bank.get("currency") == "USD" else 1.0
        val_inr = bank["balance"] * rate
        response["bank_balances"].append({
            **bank,
            "value_inr": round(val_inr, 2)
        })
        response["summary"]["bank_balance_total"] += val_inr

    # 2. Indian Stocks & ETFs
    for item in db_data.get("stocks_etfs", []):
        cached_price = item.get("cached_price") or item["avg_buy_price"]
        prev_close = item.get("cached_prev_close") or cached_price
        
        cost = item["quantity"] * item["avg_buy_price"]
        curr_val = item["quantity"] * cached_price
        pnl = curr_val - cost
        pnl_pct = (pnl / cost * 100) if cost > 0 else 0.0
        daily_change = item["quantity"] * (cached_price - prev_close)
        daily_change_pct = ((cached_price - prev_close) / prev_close * 100) if prev_close > 0 else 0.0

        classification = item.get("sector", "Broad Market")
        if item.get("asset_type") == "Indian ETF":
            classification = classify_etf(item["ticker"], item.get("sector", ""))

        response["stocks_etfs"].append({
            **item,
            "classification": classification,
            "current_price": round(cached_price, 2),
            "prev_close": round(prev_close, 2),
            "cost_inr": round(cost, 2),
            "value_inr": round(curr_val, 2),
            "pnl_inr": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "daily_change_inr": round(daily_change, 2),
            "daily_change_pct": round(daily_change_pct, 2)
        })
        response["summary"]["stocks_etfs_total"] += curr_val
        response["summary"]["total_pnl"] += pnl

    # 3. Mutual Funds
    for item in db_data.get("mutual_funds", []):
        cached_nav = item.get("cached_nav") or item["avg_buy_nav"]
        prev_nav = item.get("cached_prev_nav") or cached_nav
        
        cost = item["units"] * item["avg_buy_nav"]
        curr_val = item["units"] * cached_nav
        pnl = curr_val - cost
        pnl_pct = (pnl / cost * 100) if cost > 0 else 0.0
        daily_change = item["units"] * (cached_nav - prev_nav)
        daily_change_pct = ((cached_nav - prev_nav) / prev_nav * 100) if prev_nav > 0 else 0.0

        response["mutual_funds"].append({
            **item,
            "current_nav": round(cached_nav, 2),
            "prev_nav": round(prev_nav, 2),
            "cost_inr": round(cost, 2),
            "value_inr": round(curr_val, 2),
            "pnl_inr": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "daily_change_inr": round(daily_change, 2),
            "daily_change_pct": round(daily_change_pct, 2)
        })
        response["summary"]["mutual_funds_total"] += curr_val
        response["summary"]["total_pnl"] += pnl

    # 4. REITs Dual-Nature tracking Engine (Appreciation + Yield)
    for item in db_data.get("reits", []):
        cached_price = item.get("cached_price") or item["avg_buy_price"]
        prev_close = item.get("cached_prev_close") or cached_price
        
        cost = item["quantity"] * item["avg_buy_price"]
        curr_val = item["quantity"] * cached_price
        pnl = curr_val - cost
        
        # Calculate prorated dividend yield
        dividends = 0.0
        if "dividend_yield_pct" in item and item["dividend_yield_pct"]:
            rate = float(item["dividend_yield_pct"])
            buy_date_str = item.get("buy_date")
            if buy_date_str:
                try:
                    buy_date = datetime.strptime(buy_date_str, "%Y-%m-%d")
                    days_held = (datetime.now() - buy_date).days
                    # Avoid negative days if they put future date
                    if days_held < 0: days_held = 0
                    years_held = days_held / 365.25
                    dividends = cost * (rate / 100) * years_held
                except Exception:
                    dividends = 0.0
            else:
                # If no buy_date, default to 0 as per user request
                dividends = 0.0
        else:
            # Fallback for old items missing yield (0 as well if no buy date, but they had total_dividends_received so keep that static value for pure legacy)
            dividends = float(item.get("total_dividends_received", 0.0))
            
        total_return = pnl + dividends
        total_return_pct = (total_return / cost * 100) if cost > 0 else 0.0
        daily_change = item["quantity"] * (cached_price - prev_close)
        daily_change_pct = ((cached_price - prev_close) / prev_close * 100) if prev_close > 0 else 0.0

        response["reits"].append({
            **item,
            "current_price": round(cached_price, 2),
            "prev_close": round(prev_close, 2),
            "cost_inr": round(cost, 2),
            "value_inr": round(curr_val, 2),
            "pnl_inr": round(pnl, 2),
            "total_dividends_received": round(dividends, 2),
            "total_return_inr": round(total_return, 2),
            "total_return_pct": round(total_return_pct, 2),
            "daily_change_inr": round(daily_change, 2),
            "daily_change_pct": round(daily_change_pct, 2)
        })
        response["summary"]["reits_total"] += curr_val
        response["summary"]["total_pnl"] += total_return

    # 5. Government Bonds
    for item in db_data.get("government_bonds", []):
        principal = item["principal"]
        interest_rate = item["interest_rate"]
        purchase_date_str = item["purchase_date"]
        
        accrual = calculate_bond_accruals(principal, interest_rate, purchase_date_str)
        
        response["government_bonds"].append({
            **item,
            "interest_earned": accrual["interest_earned"],
            "value_inr": accrual["current_value"],
            "cost_inr": principal,
            "pnl_inr": accrual["interest_earned"],
            "pnl_pct": round((accrual["interest_earned"] / principal * 100), 2) if principal > 0 else 0.0
        })
        response["summary"]["government_bonds_total"] += accrual["current_value"]
        response["summary"]["total_pnl"] += accrual["interest_earned"]

    # 6. US Stocks
    for item in db_data.get("us_stocks", []):
        cached_price = item.get("cached_price") or item["avg_buy_price"]
        prev_close = item.get("cached_prev_close") or cached_price
        
        cost_usd = item["quantity"] * item["avg_buy_price"]
        curr_val_usd = item["quantity"] * cached_price
        pnl_usd = curr_val_usd - cost_usd
        
        cost_inr = cost_usd * usd_inr
        curr_val_inr = curr_val_usd * usd_inr
        pnl_inr = curr_val_inr - cost_inr
        pnl_pct = (pnl_usd / cost_usd * 100) if cost_usd > 0 else 0.0
        
        daily_change_usd = item["quantity"] * (cached_price - prev_close)
        daily_change_inr = daily_change_usd * usd_inr
        daily_change_pct = ((cached_price - prev_close) / prev_close * 100) if prev_close > 0 else 0.0

        response["us_stocks"].append({
            **item,
            "current_price_usd": round(cached_price, 2),
            "prev_close_usd": round(prev_close, 2),
            "cost_usd": round(cost_usd, 2),
            "value_usd": round(curr_val_usd, 2),
            "pnl_usd": round(pnl_usd, 2),
            "cost_inr": round(cost_inr, 2),
            "value_inr": round(curr_val_inr, 2),
            "pnl_inr": round(pnl_inr, 2),
            "pnl_pct": round(pnl_pct, 2),
            "daily_change_inr": round(daily_change_inr, 2),
            "daily_change_pct": round(daily_change_pct, 2)
        })
        response["summary"]["us_stocks_total"] += curr_val_inr
        response["summary"]["total_pnl"] += pnl_inr

    # 7. Loans & Credits - True Amortization Engine
    for item in db_data.get("loans", []):
        original_principal = float(item.get("principal", 0))
        base_rate = float(item.get("annual_interest_rate", 0))
        
        emi_schedule = item.get("emi_schedule", [])
        try:
            emi_schedule = sorted(emi_schedule, key=lambda x: datetime.strptime(x["start_date"], "%Y-%m-%d"))
        except Exception:
            pass
            
        pmt_schedule = item.get("one_time_payments", [])
        
        # Determine simulation start date
        start_dates = []
        if emi_schedule:
            try:
                start_dates.append(datetime.strptime(emi_schedule[0]["start_date"], "%Y-%m-%d"))
            except Exception:
                pass
        for p in pmt_schedule:
            try:
                start_dates.append(datetime.strptime(p["date"], "%Y-%m-%d"))
            except Exception:
                pass
                
        total_paid = 0.0
        current_principal = original_principal
        
        if start_dates:
            current_date = min(start_dates).replace(day=1)
            end_date = datetime.now()
            
            while current_date <= end_date and current_principal > 0:
                # Find active schedule for this month
                active_emi = 0.0
                active_rate = base_rate
                for entry in emi_schedule:
                    try:
                        entry_date = datetime.strptime(entry["start_date"], "%Y-%m-%d")
                        if entry_date.replace(day=1) <= current_date:
                            active_emi = float(entry.get("emi", 0))
                            if entry.get("interest_rate") is not None and entry.get("interest_rate") != "":
                                active_rate = float(entry.get("interest_rate"))
                    except Exception:
                        continue
                
                # Apply Monthly Interest
                monthly_interest = current_principal * (active_rate / 100) / 12
                current_principal += monthly_interest
                
                # Apply EMI
                if active_emi > 0:
                    if current_principal < active_emi:
                        total_paid += current_principal
                        current_principal = 0.0
                    else:
                        current_principal -= active_emi
                        total_paid += active_emi
                
                # Apply one-time payments for this month
                for pmt in pmt_schedule:
                    try:
                        pmt_date = datetime.strptime(pmt["date"], "%Y-%m-%d")
                        if pmt_date.year == current_date.year and pmt_date.month == current_date.month:
                            amt = float(pmt.get("amount", 0))
                            if current_principal < amt:
                                total_paid += current_principal
                                current_principal = 0.0
                            else:
                                current_principal -= amt
                                total_paid += amt
                    except Exception:
                        pass
                
                if current_principal <= 0:
                    current_principal = 0.0
                    break
                    
                # Advance 1 month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
                    
        response["loans"].append({
            **item,
            "total_paid": round(total_paid, 2),
            "remaining_principal": round(current_principal, 2),
            "value_inr": round(current_principal, 2)
        })
        response["summary"]["loans_total"] += current_principal

    # 8. Emergency Funds
    emergency_funds_total = 0.0
    for item in db_data.get("emergency_funds", []):
        amt = float(item.get("amount", 0))
        emergency_funds_total += amt
        response["emergency_funds"].append({
            **item,
            "value_inr": amt
        })
    response["summary"]["emergency_funds_total"] = round(emergency_funds_total, 2)

    # 9. PF & NPS
    pf_nps_total = 0
    pf_nps_total_pnl = 0
    response["pf_nps"] = []
    current_month_str = datetime.now().strftime("%Y-%m")
    
    for db_acct in db_data.get("pf_nps", []):
        # 1. Migration if missing base fields
        if "base_month" not in db_acct:
            db_acct["base_month"] = db_acct.get("last_calculated_month") or db_acct.get("start_date") or current_month_str
        if "base_balance" not in db_acct:
            db_acct["base_balance"] = float(db_acct.get("current_balance", 0))
            
        history = db_acct.get("contribution_history", [])
        if not history:
            old_cont = float(db_acct.get("monthly_contribution", 0))
            if old_cont > 0:
                history.append({"effective_month": db_acct["base_month"], "amount": old_cont})
                db_acct["contribution_history"] = history
        
        # 2. Create a detached copy for response
        acct = db_acct.copy()
        
        base_month = acct["base_month"]
        base_balance = acct["base_balance"]
        
        annual_return = float(acct.get("expected_annual_return", 0))
        monthly_rate = (annual_return / 100) / 12
        
        # 3. Project from base_month to current_month_str
        current_bal = base_balance
        total_invested = base_balance
        
        try:
            lc_dt = datetime.strptime(base_month, "%Y-%m")
            cur_dt = datetime.strptime(current_month_str, "%Y-%m")
            
            while lc_dt < cur_dt:
                # advance 1 month
                if lc_dt.month == 12:
                    lc_dt = lc_dt.replace(year=lc_dt.year + 1, month=1)
                else:
                    lc_dt = lc_dt.replace(month=lc_dt.month + 1)
                
                iter_month_str = lc_dt.strftime("%Y-%m")
                
                # Apply Interest
                current_bal += current_bal * monthly_rate
                
                # Find Active Contribution
                active_cont = 0
                for h in sorted(history, key=lambda x: x["effective_month"]):
                    if h["effective_month"] <= iter_month_str:
                        active_cont = float(h["amount"])
                        
                current_bal += active_cont
                total_invested += active_cont
                
            acct["current_balance"] = round(current_bal, 2)
            
        except Exception as e:
            print("Error parsing dates for PF/NPS baseline projection:", e)
            acct["current_balance"] = round(base_balance, 2)
            
        # Find Active Contribution for display
        active_cont_display = float(db_acct.get("monthly_contribution", 0))
        if history:
            for h in sorted(history, key=lambda x: x["effective_month"]):
                if h["effective_month"] <= current_month_str:
                    active_cont_display = float(h["amount"])
        acct["monthly_contribution"] = active_cont_display
        acct["total_invested"] = round(total_invested, 2)
        acct["pnl_inr"] = round(acct["current_balance"] - total_invested, 2)

        response["pf_nps"].append(acct)
        pf_nps_total += acct["current_balance"]
        pf_nps_total_pnl += acct["pnl_inr"]
        
    response["summary"]["pf_nps_total"] = round(pf_nps_total, 2)

    # 10. Budgets, Insurances, CAS Analyzer (Passthrough, no net-worth impact yet)
    response["budgets"] = db_data.get("budgets", [])
    response["insurances"] = db_data.get("insurances", [])
    response["cas_analyzer"] = db_data.get("cas_analyzer", [])

    # Aggregations
    total_net_worth = round(
        response["summary"]["bank_balance_total"] +
        response["summary"]["stocks_etfs_total"] +
        response["summary"]["mutual_funds_total"] +
        response["summary"]["reits_total"] +
        response["summary"]["government_bonds_total"] +
        response["summary"]["us_stocks_total"] +
        response["summary"]["emergency_funds_total"] +
        response["summary"]["pf_nps_total"] -
        response["summary"]["loans_total"],
        2
    )
    
    response["summary"]["total_pnl"] += pf_nps_total_pnl
    
    response["summary"]["total_net_worth"] = total_net_worth
    response["summary"]["bank_balance_total"] = round(response["summary"]["bank_balance_total"], 2)
    response["summary"]["stocks_etfs_total"] = round(response["summary"]["stocks_etfs_total"], 2)
    response["summary"]["mutual_funds_total"] = round(response["summary"]["mutual_funds_total"], 2)
    response["summary"]["reits_total"] = round(response["summary"]["reits_total"], 2)
    response["summary"]["government_bonds_total"] = round(response["summary"]["government_bonds_total"], 2)
    response["summary"]["us_stocks_total"] = round(response["summary"]["us_stocks_total"], 2)
    response["summary"]["loans_total"] = round(response["summary"]["loans_total"], 2)
    response["summary"]["total_pnl"] = round(response["summary"]["total_pnl"], 2)
    
    # Snapshot Timeline Automation
    history = db_data.get("history", [])
    today = datetime.now().strftime("%Y-%m-%d")
    
    exists = False
    for entry in history:
        if entry.get("date") == today:
            entry["net_worth"] = total_net_worth
            exists = True
            break
    if not exists:
        history.append({"date": today, "net_worth": total_net_worth})
        
    db_data["history"] = history
    save_db(current_user["name"], db_data)
    
    response["history"] = history
    return response

# ----------------- REST ROUTER ENDPOINTS -----------------

class SignupModel(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class LoginModel(BaseModel):
    email: str
    password: str

@app.on_event("startup")
def startup_event():
    users = load_users()
    if not any(u["email"] == "aviralmishra10@gmail.com" for u in users):
        users.append({
            "name": "Aviral",
            "email": "aviralmishra10@gmail.com",
            "phone": "9999999999",
            "password": get_password_hash("Headquarters@123")
        })
        save_users(users)

@app.post("/api/signup")
def signup(data: SignupModel):
    users = load_users()
    if any(u["email"] == data.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users.append({
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": get_password_hash(data.password)
    })
    save_users(users)
    return {"message": "User created successfully"}

@app.post("/api/login")
def login(data: LoginModel):
    users = load_users()
    user = next((u for u in users if u["email"] == data.email), None)
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["email"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer", "user": {"name": user["name"], "email": user["email"]}}


@app.get("/api/portfolio")
def get_portfolio(current_user: dict = Depends(get_current_user)):
    db_data = load_db(current_user["name"])
    return calculate_portfolio_details(db_data, current_user)

@app.get("/api/epf-rate")
def get_epf_rate(current_user: dict = Depends(get_current_user)):
    return {"epf_rate": fetch_epf_interest_rate()}

@app.post("/api/portfolio/refresh")
def refresh_portfolio(current_user: dict = Depends(get_current_user)):
    db_data = load_db(current_user["name"])
    
    for category in ["stocks_etfs", "reits", "us_stocks"]:
        for item in db_data.get(category, []):
            ticker = item.get("ticker")
            if ticker:
                # AUTO-CORRECT EXTENSION: If it's an Indian asset and lacks an exchange suffix, append .NS
                if category in ["stocks_etfs", "reits"] and "." not in ticker:
                    ticker = f"{ticker}.NS"
                if category == "reits":
                    ticker = format_reit_ticker(ticker)
                item["ticker"] = ticker  # Commits the correction back to your JSON database file
                
                res = fetch_yahoo_finance_price(ticker)
                if res["price"] is not None:
                    item["cached_price"] = res["price"]
                    item["cached_prev_close"] = res["prev_close"]
                    if res["name"] and not item.get("name"):
                        item["name"] = res["name"]

    for item in db_data.get("mutual_funds", []):
        if item.get("scheme_code"):
            res = fetch_mutual_fund_nav(item["scheme_code"])
            if res["nav"] is not None:
                item["cached_nav"] = res["nav"]
                item["cached_prev_nav"] = res["prev_nav"]
                if res["name"]:
                    item["name"] = res["name"]

    current_year = datetime.now().year
    if db_data.get("epf_last_fetched_year") != current_year:
        epf_rate = fetch_epf_interest_rate()
        if epf_rate:
            for acct in db_data.get("pf_nps", []):
                if acct.get("account_type") == "EPF":
                    acct["expected_annual_return"] = epf_rate
            db_data["epf_last_fetched_year"] = current_year

    save_db(current_user["name"], db_data)
    return calculate_portfolio_details(db_data, current_user)

@app.post("/api/portfolio/{category}")
def add_portfolio_item(category: str, item: dict, current_user: dict = Depends(get_current_user)):
    db_data = load_db(current_user["name"])
    valid_categories = ["bank_balances", "stocks_etfs", "mutual_funds", "reits", "government_bonds", "us_stocks", "loans", "emergency_funds", "pf_nps", "budgets", "insurances", "cas_analyzer"]
    if category not in db_data:
        if category in valid_categories:
            db_data[category] = []
        else:
            raise HTTPException(status_code=400, detail="Invalid portfolio category")
    
    item["id"] = f"{category}_{uuid.uuid4().hex[:8]}"
    
    ticker = item.get("ticker")
    if category in ["stocks_etfs", "reits", "us_stocks"] and ticker:
        # AUTO-CORRECT EXTENSION: Handle bare tickers on creation
        if category in ["stocks_etfs", "reits"] and "." not in ticker:
            ticker = f"{ticker}.NS"
        if category == "reits":
            ticker = format_reit_ticker(ticker)
        item["ticker"] = ticker

        res = fetch_yahoo_finance_price(ticker)
        item["cached_price"] = res["price"] or item["avg_buy_price"]
        item["cached_prev_close"] = res["prev_close"] or item["cached_price"]
        if res["name"] and not item.get("name"):
            item["name"] = res["name"]
            
    elif category == "mutual_funds" and item.get("scheme_code"):
        res = fetch_mutual_fund_nav(item["scheme_code"])
        item["cached_nav"] = res["nav"] or item["avg_buy_nav"]
        item["cached_prev_nav"] = res["prev_nav"] or item["cached_nav"]
        if res["name"]:
            item["name"] = res["name"]

    if category == "pf_nps":
        new_cont = item.get("new_monthly_contribution")
        eff_month = item.get("effective_month")
        start = item.get("start_date") or datetime.now().strftime("%Y-%m")
        
        if not item.get("contribution_history"):
            item["contribution_history"] = []
            
        if new_cont is not None and eff_month:
            found = False
            for h in item["contribution_history"]:
                if h["effective_month"] == eff_month:
                    h["amount"] = float(new_cont)
                    found = True
                    break
            if not found:
                item["contribution_history"].append({"effective_month": eff_month, "amount": float(new_cont)})
            item.pop("new_monthly_contribution", None)
            item.pop("effective_month", None)
        elif item.get("monthly_contribution"):
            item["contribution_history"].append({"effective_month": start, "amount": float(item["monthly_contribution"])})
            
        # NEW LOGIC
        item["base_month"] = start
        item["base_balance"] = item.get("manual_balance_override", item.get("current_balance", 0))
        item.pop("manual_balance_override", None)
        item.pop("last_calculated_month", None)

    db_data[category].append(item)
    save_db(current_user["name"], db_data)
    return calculate_portfolio_details(db_data, current_user)

@app.put("/api/portfolio/{category}/{item_id}")
def update_portfolio_item(category: str, item_id: str, updated_item: dict, current_user: dict = Depends(get_current_user)):
    db_data = load_db(current_user["name"])
    valid_categories = ["bank_balances", "stocks_etfs", "mutual_funds", "reits", "government_bonds", "us_stocks", "loans", "emergency_funds", "pf_nps", "budgets", "insurances", "cas_analyzer"]
    if category not in db_data:
        if category in valid_categories:
            db_data[category] = []
        else:
            raise HTTPException(status_code=400, detail="Invalid portfolio category")
    
    items = db_data[category]
    index = -1
    for idx, item in enumerate(items):
        if item.get("id") == item_id:
            index = idx
            break
            
    if index == -1:
        raise HTTPException(status_code=404, detail="Item not found")
        
    updated_item["id"] = item_id
    for cache_key in ["cached_price", "cached_prev_close", "cached_nav", "cached_prev_nav", "name"]:
        if cache_key in items[index] and cache_key not in updated_item:
            updated_item[cache_key] = items[index][cache_key]

    if category in ["stocks_etfs", "reits", "us_stocks"] and updated_item.get("ticker") != items[index].get("ticker"):
        ticker = updated_item["ticker"]
        if category == "reits":
            ticker = format_reit_ticker(ticker)
            updated_item["ticker"] = ticker
        res = fetch_yahoo_finance_price(ticker)
        updated_item["cached_price"] = res["price"] or updated_item["avg_buy_price"]
        updated_item["cached_prev_close"] = res["prev_close"] or updated_item["cached_price"]
        if res["name"]:
            updated_item["name"] = res["name"]
        
    elif category == "mutual_funds" and updated_item.get("scheme_code") != items[index].get("scheme_code"):
        res = fetch_mutual_fund_nav(updated_item["scheme_code"])
        updated_item["cached_nav"] = res["nav"] or updated_item["avg_buy_nav"]
        updated_item["cached_prev_nav"] = res["prev_nav"] or updated_item["cached_nav"]
        if res["name"]:
            updated_item["name"] = res["name"]

    if category == "pf_nps":
        old_item = items[index]
        history = old_item.get("contribution_history", [])
        
        # If frontend sends new_monthly_contribution and effective_month
        new_cont = updated_item.get("new_monthly_contribution")
        eff_month = updated_item.get("effective_month")
        
        if new_cont is not None and eff_month:
            found = False
            for h in history:
                if h["effective_month"] == eff_month:
                    h["amount"] = float(new_cont)
                    found = True
                    break
            if not found:
                history.append({"effective_month": eff_month, "amount": float(new_cont)})
            
        updated_item.pop("new_monthly_contribution", None)
        updated_item.pop("effective_month", None)
            
        updated_item["contribution_history"] = history
        
        if "base_month" not in updated_item:
            updated_item["base_month"] = old_item.get("base_month")
        if "base_balance" not in updated_item:
            updated_item["base_balance"] = old_item.get("base_balance")
            
        # MANUAL OVERRIDE
        override_balance = updated_item.get("manual_balance_override")
        if override_balance is not None:
            updated_item["base_balance"] = float(override_balance)
            updated_item["base_month"] = datetime.now().strftime("%Y-%m")
            updated_item.pop("manual_balance_override", None)
            
        # Clean up legacy
        updated_item.pop("last_calculated_month", None)

    db_data[category][index] = updated_item
    save_db(current_user["name"], db_data)
    return calculate_portfolio_details(db_data, current_user)

@app.delete("/api/portfolio/{category}/{item_id}")
def delete_portfolio_item(category: str, item_id: str, current_user: dict = Depends(get_current_user)):
    db_data = load_db(current_user["name"])
    valid_categories = ["bank_balances", "stocks_etfs", "mutual_funds", "reits", "government_bonds", "us_stocks", "loans", "emergency_funds", "pf_nps", "budgets", "insurances", "cas_analyzer"]
    if category not in db_data:
        if category in valid_categories:
            db_data[category] = []
        else:
            raise HTTPException(status_code=400, detail="Invalid portfolio category")
    
    db_data[category] = [item for item in db_data[category] if item.get("id") != item_id]
    save_db(current_user["name"], db_data)
    return calculate_portfolio_details(db_data, current_user)

# ----------------- EXPENSE ANALYZER ENDPOINTS -----------------

@app.post("/api/upload-statement")
async def upload_statement(
    file: UploadFile = File(...), 
    password: str = Form(None), 
    month_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    print(f"DEBUG: Received file upload: {file.filename} for month {month_id}")
    contents = await file.read()
    print(f"DEBUG: Read {len(contents)} bytes from file.")
    
    # Load custom rules
    custom_rules = load_custom_rules(current_user["name"])
    
    # Run the parser
    transactions = parse_bank_statement(contents, password, custom_rules)
    
    if not transactions:
        print("DEBUG: Parser returned 0 transactions.")
        raise HTTPException(status_code=400, detail="Could not parse transactions from the provided file.")
        
    print(f"DEBUG: Parsed {len(transactions)} successfully. Saving to transactions.json...")
    
    # Save to transactions.json
    tx_data = load_transactions(current_user["name"])
    
    if month_id not in tx_data:
        tx_data[month_id] = []
        
    tx_data[month_id] = transactions
    save_transactions(current_user["name"], tx_data)
    print("DEBUG: Saved successfully.")
    
    return {"message": f"Successfully parsed {len(transactions)} transactions.", "transactions": transactions}

@app.get("/api/transactions/{month_id}")
def get_transactions(month_id: str, current_user: dict = Depends(get_current_user)):
    tx_data = load_transactions(current_user["name"])
    return tx_data.get(month_id, [])

@app.get("/api/custom-rules")
def get_custom_rules(current_user: dict = Depends(get_current_user)):
    return load_custom_rules(current_user["name"])

class CustomRuleModel(BaseModel):
    merchant_name: str
    category: str

@app.post("/api/custom-rules")
def add_custom_rule(rule: CustomRuleModel, current_user: dict = Depends(get_current_user)):
    rules = load_custom_rules(current_user["name"])
    rules[rule.merchant_name.lower()] = rule.category
    save_custom_rules(current_user["name"], rules)
    return rules