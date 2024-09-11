import csv
from docx import Document

def save_table_as_csv(docx_file, csv_file):
    doc = Document(docx_file)
    table = doc.tables[0]  # Assumes the first table is the one to be saved

    with open(csv_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        
        # Write the header row
        headers = [cell.text for cell in table.rows[0].cells]
        writer.writerow(headers)
        
        # Write the data rows
        for row in table.rows[1:]:
            data = [cell.text for cell in row.cells]
            writer.writerow(data)

if __name__ == "__main__":
    docx_file = 'rearranged_output.docx'
    csv_file = 'output.csv'
    save_table_as_csv(docx_file, csv_file)
