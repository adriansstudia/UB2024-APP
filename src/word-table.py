import csv
import base64
from io import BytesIO
from docx import Document
from docx.oxml.ns import qn

# Function to convert image to base64
def image_to_base64(image_stream):
    image_stream.seek(0)  # Ensure the stream is at the beginning
    return base64.b64encode(image_stream.read()).decode('utf-8')

# Function to extract images from cell and replace them with HTML img tag
def extract_images_from_cell(cell):
    html_content = cell.text.strip()
    
    # Process the cell for images
    for shape in cell._element.xpath('.//a:blip'):
        # Access the image relationship
        rId = shape.get(qn('r:embed'))
        if rId:
            image_part = cell.part.related_parts[rId]
            image_stream = BytesIO(image_part.blob)
            base64_image = image_to_base64(image_stream)
            image_tag = f'<img src="data:image/png;base64,{base64_image}" style="max-width: 100%;"/>'
            html_content += f' {image_tag}'
    
    return html_content

# Step 1: Load the DOCX file and extract the table data
def extract_table_from_docx(docx_file):
    doc = Document(docx_file)
    table_data = []
    for table in doc.tables:
        for row in table.rows:
            row_data = []
            for idx, cell in enumerate(row.cells):
                if idx == 2:  # Assuming column 3 (0-based index 2) needs HTML formatting
                    cell_content = extract_images_from_cell(cell)
                else:
                    cell_content = cell.text.strip()
                row_data.append(cell_content)
            table_data.append(row_data)
    return table_data

# Step 2: Save table data as CSV with ';' delimiter and add header row
def save_as_csv(table_data, csv_file):
    header = ['number', 'kategoria', 'zestaw', 'question', 'answer', 'rating']
    with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, delimiter=';')
        # Write the header row
        writer.writerow(header)
        # Write the data rows
        for row in table_data:
            writer.writerow(row)

# Step 3: Replace '|' with ';' in the CSV and save to new file
def replace_pipe_in_csv(input_csv, output_csv):
    with open(input_csv, 'r', encoding='utf-8') as infile, open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        reader = infile.read()
        replaced_content = reader.replace('|', '";"')
        outfile.write(replaced_content)

# File paths
input_docx = 'input.docx'
output_csv = 'output_UB.csv'
output_replaced_csv = 'output_UB_replaced.csv'

# Extract table data from DOCX
table_data = extract_table_from_docx(input_docx)

# Save the extracted table data as CSV with header
save_as_csv(table_data, output_csv)

# Replace '|' with ';' and save as a new CSV file
replace_pipe_in_csv(output_csv, output_replaced_csv)

print(f"Files saved: {output_csv}, {output_replaced_csv}")
