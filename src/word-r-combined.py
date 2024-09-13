import pypandoc
from docx import Document
import os
import re
import csv
from bs4 import BeautifulSoup

# Base URL for linking to the images on GitHub Pages
IMAGE_BASE_URL = 'https://adriansstudia.github.io/UB2024-APP/images'

def extract_images(input_docx, image_dir='images'):
    doc = Document(input_docx)
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)

    image_files = []
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            image_data = rel.target_part.blob
            image_ext = rel.target_part.content_type.split('/')[1]
            image_name = f'image_{len(image_files) + 1}.{image_ext}'
            image_path = os.path.join(image_dir, image_name)
            
            # Save the image to the local directory
            with open(image_path, 'wb') as img_file:
                img_file.write(image_data)
            
            # Append the image reference and the URL for the CSV
            image_url = f'{IMAGE_BASE_URL}/{image_name}'
            image_files.append((rel.target_ref, image_url))
    
    return image_files

def convert_docx_to_html(input_docx):
    output_html = 'temp_output.html'
    pypandoc.convert_file(input_docx, 'html', outputfile=output_html, extra_args=['--from=docx', '--to=html'])
    return output_html

def extract_images_and_text(cell, image_files):
    html_content = str(cell)
    for ref, image_url in image_files:
        if ref in html_content:
            # Replace the image reference with the URL for the CSV file
            html_content = html_content.replace(ref, image_url)
    
    # If the content includes an image, return it as HTML, otherwise plain text
    if '<img' in html_content:
        return html_content
    else:
        return cell.get_text()

def adjust_table_cells(html_file, image_files):
    with open(html_file, 'r', encoding='utf-8') as file:
        html_content = file.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    tables = soup.find_all('table')
    
    table_adjusted = []
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            adjusted_row = []
            for cell in cells:
                cell_html = extract_images_and_text(cell, image_files)
                adjusted_row.append(cell_html)
            table_adjusted.append(adjusted_row)
    
    return table_adjusted

def create_docx_from_adjusted_table(table_html, output_docx):
    doc = Document()
    
    if not table_html:
        print("No table HTML found.")
        return
    
    # Create a table in the docx file
    num_rows = len(table_html) + 1  # +1 for the heading row
    num_cols = max(len(row) for row in table_html) if table_html else 6  # Assuming 6 columns if no table found
    tbl = doc.add_table(rows=num_rows, cols=num_cols)
    
    # Add heading row
    headings = ["number", "kategoria", "zestaw", "question", "answer", "rating"]
    heading_row = tbl.rows[0]
    for i, heading in enumerate(headings):
        heading_row.cells[i].text = heading
    
    # Add the rest of the rows
    for i, row_html in enumerate(table_html):
        for j, cell_content in enumerate(row_html):
            cell = tbl.cell(i + 1, j)  # Shift rows by 1 to account for heading row
            if cell_content.startswith('<'):
                # Insert HTML content (i.e., images)
                cell.paragraphs[0].add_run(cell_content)
            else:
                cell.text = cell_content
    
    doc.save(output_docx)

def save_table_as_csv(docx_file, csv_file, delimiter=';'):
    doc = Document(docx_file)
    table = doc.tables[0]  # Assuming only one table in the document

    with open(csv_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, delimiter=delimiter)
        
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells]
            writer.writerow(row_data)

def process_docx(input_docx, temp_output_docx, final_output_docx, csv_file):
    # Extract images and replace with URL in the CSV
    image_files = extract_images(input_docx)
    
    # Convert DOCX to HTML
    html_file = convert_docx_to_html(input_docx)
    
    # Adjust the table cells and add image links
    table_adjusted = adjust_table_cells(html_file, image_files)
    
    # Create the DOCX from adjusted table content
    create_docx_from_adjusted_table(table_adjusted, temp_output_docx)
    
    # Save the rearranged table as CSV
    save_table_as_csv(temp_output_docx, csv_file)
    
    # Clean up temporary HTML file
    os.remove(html_file)

if __name__ == "__main__":
    input_docx = 'input.docx'
    temp_output_docx = 'temp_output.docx'
    csv_file = 'output.csv'
    process_docx(input_docx, temp_output_docx, temp_output_docx, csv_file)
