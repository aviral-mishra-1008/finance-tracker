import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

DEFAULT_DB = {
    "bank_balances": [],
    "stocks_etfs": [],
    "mutual_funds": [],
    "reits": [],
    "government_bonds": [],
    "us_stocks": []
}

def init_system():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=4)

def load_users() -> list:
    init_system()
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_users(data: list):
    init_system()
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def get_user_dir(username: str) -> str:
    user_dir = os.path.join(DATA_DIR, username)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
        # Create default empty files
        with open(os.path.join(user_dir, "portfolio.json"), "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DB, f, indent=4)
        with open(os.path.join(user_dir, "transactions.json"), "w", encoding="utf-8") as f:
            json.dump({}, f, indent=4)
        with open(os.path.join(user_dir, "custom_rules.json"), "w", encoding="utf-8") as f:
            json.dump({}, f, indent=4)
    return user_dir

def load_db(username: str) -> dict:
    user_dir = get_user_dir(username)
    try:
        with open(os.path.join(user_dir, "portfolio.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return DEFAULT_DB

def save_db(username: str, data: dict):
    user_dir = get_user_dir(username)
    with open(os.path.join(user_dir, "portfolio.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def load_transactions(username: str) -> dict:
    user_dir = get_user_dir(username)
    try:
        with open(os.path.join(user_dir, "transactions.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_transactions(username: str, data: dict):
    user_dir = get_user_dir(username)
    with open(os.path.join(user_dir, "transactions.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def load_custom_rules(username: str) -> dict:
    user_dir = get_user_dir(username)
    try:
        with open(os.path.join(user_dir, "custom_rules.json"), "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_custom_rules(username: str, data: dict):
    user_dir = get_user_dir(username)
    with open(os.path.join(user_dir, "custom_rules.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
