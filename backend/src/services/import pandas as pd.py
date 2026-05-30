import pandas as pd
from sqlalchemy import create_engine, text
import os
import sys

EXCEL_FILE  =    # Path to your Excel file
SHEET_NAME  = 0             # 0 = first sheet, or e.g. "Sheet1"
TABLE_NAME  = "AttendancePucnchLocation"    # Destination MySQL table name
IF_EXISTS   = "replace"     # "replace" | "append" | "fail"
CHUNK_SIZE  = 500           # Rows per insert batch


DB_HOST     = "localhost"
DB_PORT     = 3306
DB_NAME     = "burgerFarm"
DB_USER     = "root"
DB_PASSWORD = "2Harshita2004"

DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ─────────────────────────────────────────────
# OPTIONAL — force certain columns to stay as strings
# ─────────────────────────────────────────────

DTYPE_OVERRIDES = {
    # "zip_code": str,
    # "phone": str,
    # "employee_id": str,
}


# ─────────────────────────────────────────────

UPLOAD_ALL_SHEETS = False



def read_excel(path, sheet, dtypes):
    print(f"  Reading '{path}' (sheet: {sheet}) ...")
    if not os.path.exists(path):
        print(f"ERROR: File not found — {path}")
        sys.exit(1)
    df = pd.read_excel(path, sheet_name=sheet, dtype=dtypes if dtypes else None)
    print(f"  Found {len(df):,} rows x {len(df.columns)} columns")
    return df


def clean_dataframe(df):
    # Strip whitespace from column names
    df.columns = [str(c).strip() for c in df.columns]
    # Replace spaces in column names with underscores (MySQL friendly)
    df.columns = [c.replace(" ", "_") for c in df.columns]
    # Drop fully empty rows
    df.dropna(how="all", inplace=True)
    return df


def upload(df, engine, table, if_exists, chunk_size):
    print(f"  Uploading to table '{table}' (if_exists='{if_exists}') ...")
    df.to_sql(
        name=table,
        con=engine,
        if_exists=if_exists,
        index=False,
        chunksize=chunk_size,
        method="multi",
    )
    print(f"  ✓ {len(df):,} rows uploaded to '{table}'")


def verify(engine, table):
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT COUNT(*) FROM `{table}`"))
        count = result.scalar()
    print(f"  ✓ Verified: {count:,} rows now in '{table}'")


def main():
    print("\n=== Excel → MySQL Uploader ===\n")

    print(f"Connecting to MySQL ({DB_HOST}:{DB_PORT}/{DB_NAME}) ...")
    engine = create_engine(DB_URL)
    try:
        with engine.connect():
            pass
        print("  ✓ Connected\n")
    except Exception as e:
        print(f"ERROR: Could not connect — {e}")
        print("\nTroubleshooting:")
        print("  1. Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD")
        print("  2. Make sure MySQL server is running")
        print("  3. For MySQL 8+, run:")
        print("     ALTER USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pass';")
        print("     FLUSH PRIVILEGES;")
        sys.exit(1)

    if UPLOAD_ALL_SHEETS:
        sheets = pd.read_excel(EXCEL_FILE, sheet_name=None)
        for sheet_name, df in sheets.items():
            print(f"── Sheet: '{sheet_name}' ──")
            df = clean_dataframe(df)
            upload(df, engine, table=sheet_name, if_exists=IF_EXISTS, chunk_size=CHUNK_SIZE)
            verify(engine, sheet_name)
            print()
    else:
        df = read_excel(EXCEL_FILE, SHEET_NAME, DTYPE_OVERRIDES)
        df = clean_dataframe(df)
        upload(df, engine, TABLE_NAME, IF_EXISTS, CHUNK_SIZE)
        verify(engine, TABLE_NAME)

    print("\nDone!\n")


if __name__ == "__main__":
    main()