import csv
from docx import Document

def convert_docx_table_to_csv(input_docx, output_csv):
    # Load the .docx file
    doc = Document(input_docx)
    
    # Open the output CSV file
    with open(output_csv, mode='w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        
        # Iterate through tables in the document
        for table in doc.tables:
            for row in table.rows:
                # Extract text from each cell in the row
                row_data = [cell.text.strip() for cell in row.cells]
                writer.writerow(row_data)
            break  # Remove this line if you want to process all tables

if __name__ == "__main__":
    convert_docx_table_to_csv('outputW.docx', 'outputW.csv')
