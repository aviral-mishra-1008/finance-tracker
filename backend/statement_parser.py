import pandas as pd
import io
import re
import msoffcrypto

# --- Mnemonics (Stage 1) ---
MNEMONICS = {
    "HOU": "Housing & Utilities",
    "FOD": "Food & Dining",
    "TRN": "Transportation",
    "SHP": "Shopping",
    "HLT": "Health & Fitness",
    "BIL": "Bills",
    "EMI": "Loan EMI",
    "INS": "Insurance Premiums",
    "FAM": "Family Transfer",
    "INV": "Investment",
    "MSC": "Miscellaneous"
}

# --- Generic Keyword Mapping (Stage 3) ---
CATEGORY_MAPPINGS = {
    "Housing & Utilities": ["rent", "electricity", "water", "gas", "uppcl"],
    "Food & Dining": ["zomato", "swiggy", "blinkit", "zepto", "instamart", "restaurant", "cafe"],
    "Transportation": ["uber", "ola", "irctc", "metro", "petrol", "fuel"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "reliance", "d-mart"],
    "Health & Fitness": ["pharmacy", "apollo", "hospital", "gym", "cultfit"],
    "Bills": ["airtel", "jio", "vi", "broadband", "recharge", "paytmqr"],
    "Loan EMI": ["emi", "loan", "bajaj finance"],
    "Insurance Premiums": ["lic", "insurance", "hdfc ergo", "policybazaar"],
    "Family Transfer": ["transfer to family", "aviral"],
    "Investment": ["zerodha", "groww", "upstox", "mutual fund", "sip"],
}

def extract_effective_name(details_str):
    """
    Attempts to extract a clean merchant/payee name from messy Indian bank descriptions.
    """
    if not isinstance(details_str, str):
        return ""
    
    # 1. UPI Format: UPI/DR/1234567890/NAME/BANK/REF...
    if "UPI/DR/" in details_str or "UPI/CR/" in details_str:
        parts = details_str.split('/')
        if len(parts) > 3:
            return parts[3].strip()
            
    # 2. SBI specific: WDL TFR ... OF Mr. NAME AT ...
    match = re.search(r'OF (Mr\.|Mrs\.|Ms\.)?\s*(.*?)\s+AT\b', details_str, re.IGNORECASE)
    if match:
        return match.group(2).strip()

    # Fallback to the whole string if no regex matched
    return details_str.strip()

def auto_categorize(details_str, custom_rules=None):
    """
    Multistage parser to assign a category based on rules.
    Returns: (category, effective_name)
    """
    if custom_rules is None:
        custom_rules = {}
        
    details_str = str(details_str)
    details_lower = details_str.lower()
    effective_name = extract_effective_name(details_str)
    effective_name_lower = effective_name.lower()
    
    # --- Rule 0: Exclude NEFT/RTGS by default as Transfers ---
    if "neft" in details_lower or "rtgs" in details_lower:
        return ("Transfers", effective_name)
        
    # --- Stage 1: Mnemonics ---
    for mnemonic, category in MNEMONICS.items():
        # Look for the mnemonic as a discrete word or separated by hyphen/slash
        # e.g., " -HOU", "/HOU", " HOU "
        if re.search(rf'\b{mnemonic.lower()}\b', details_lower) or f"-{mnemonic.lower()}" in details_lower:
            return (category, effective_name)
            
    # --- Stage 2: Custom Learned Rules ---
    for merchant, category in custom_rules.items():
        if merchant in effective_name_lower:
            return (category, effective_name)
            
    # --- Stage 3: Generic Keywords ---
    for category, keywords in CATEGORY_MAPPINGS.items():
        for keyword in keywords:
            if keyword in details_lower:
                return (category, effective_name)
                
    return ("Uncategorized", effective_name)

def parse_bank_statement(file_bytes, password=None, custom_rules=None):
    """
    Parses a raw Excel statement, ignores the metadata rows, and extracts actual debits.
    """
    print("DEBUG [PARSER]: Starting parse_bank_statement")
    
    try:
        if password and str(password).strip():
            print("DEBUG [PARSER]: Password provided. Attempting to decrypt...")
            office_file = msoffcrypto.OfficeFile(io.BytesIO(file_bytes))
            office_file.load_key(password=str(password).strip())
            decrypted = io.BytesIO()
            office_file.decrypt(decrypted)
            file_to_read = decrypted.getvalue()
            print("DEBUG [PARSER]: Decryption successful.")
        else:
            file_to_read = file_bytes

        print("DEBUG [PARSER]: Reading excel into pandas DataFrame...")
        try:
            df_raw = pd.read_excel(io.BytesIO(file_to_read), header=None)
        except Exception as excel_err:
            print(f"DEBUG [PARSER]: read_excel failed: {excel_err}. Trying read_html...")
            html_tables = pd.read_html(io.BytesIO(file_to_read), header=None)
            df_raw = html_tables[0]
            
        # Find the actual Header Row
        header_row_index = 0
        found_header = False
        for idx, row in df_raw.iterrows():
            row_values = [str(val).strip().lower() for val in row.values]
            if 'date' in row_values and 'details' in row_values and ('debit' in row_values or 'withdrawal' in row_values):
                header_row_index = idx
                found_header = True
                break
                
        if not found_header:
            print("DEBUG [PARSER]: Could not find a row containing 'date', 'details', and 'debit/withdrawal'.")
            return []
            
        df_clean = df_raw.iloc[header_row_index+1:].copy()
        df_clean.columns = [str(c).strip() for c in df_raw.iloc[header_row_index].values]
        
        debit_col = [col for col in df_clean.columns if 'debit' in str(col).lower() or 'withdrawal' in str(col).lower()][0]
        details_col = [col for col in df_clean.columns if 'details' in str(col).lower() or 'narration' in str(col).lower()][0]
        date_col = [col for col in df_clean.columns if 'date' in str(col).lower()][0]
        
        df_expenses = df_clean[df_clean[debit_col].notna()]
        df_expenses[debit_col] = pd.to_numeric(df_expenses[debit_col], errors='coerce')
        df_expenses = df_expenses[df_expenses[debit_col] > 0]
        
        parsed_transactions = []
        for idx, row in df_expenses.iterrows():
            amount = float(row[debit_col])
            description = str(row[details_col])
            date_str = str(row[date_col])
            
            if hasattr(row[date_col], 'strftime'):
                date_str = row[date_col].strftime('%Y-%m-%d')
            else:
                date_str = date_str.split(' ')[0]
            
            category, eff_name = auto_categorize(description, custom_rules)
            
            parsed_transactions.append({
                "date": date_str,
                "amount": amount,
                "description": description,
                "effective_name": eff_name,
                "category": category
            })
            
        return parsed_transactions

    except Exception as e:
        print(f"DEBUG [PARSER]: Error parsing statement: {e}")
        import traceback
        traceback.print_exc()
        return []
