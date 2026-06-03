import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_FILE = os.path.join(DATA_DIR, "portfolio.json")
TX_FILE = os.path.join(DATA_DIR, "transactions.json")
RULES_FILE = os.path.join(DATA_DIR, "custom_rules.json")

DEFAULT_DB = {
    "bank_balances": [],
    "stocks_etfs": [],
    "mutual_funds": [],
    "reits": [],
    "government_bonds": [],
    "us_stocks": []
}

def init_db():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DB, f, indent=4)
    if not os.path.exists(TX_FILE):
        with open(TX_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=4)
    if not os.path.exists(RULES_FILE):
        with open(RULES_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=4)

def load_db() -> dict:
    init_db()
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading DB: {e}")
        return DEFAULT_DB

def save_db(data: dict):
    init_db()
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error saving DB: {e}")
        raise e

def load_transactions() -> dict:
    init_db()
    try:
        with open(TX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading TX: {e}")
        return {}

def save_transactions(data: dict):
    init_db()
    try:
        with open(TX_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error saving TX: {e}")
        raise e

def load_custom_rules() -> dict:
    init_db()
    try:
        with open(RULES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading custom rules: {e}")
        return {}

def save_custom_rules(data: dict):
    init_db()
    try:
        with open(RULES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error saving custom rules: {e}")
        raise e
