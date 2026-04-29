import pandas as pd
import json

file_path = "Trama_Fluxo Digital.xlsx"
xls = pd.ExcelFile(file_path)

data_summary = {}

for sheet_name in xls.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    data_summary[sheet_name] = {
        "columns": list(df.columns),
        "sample": df.head(3).to_dict(orient="records")
    }

with open("data_summary.json", "w") as f:
    json.dump(data_summary, f, indent=4, default=str)

print("Data Summary extracted.")
