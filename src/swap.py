import csv

def reorder_columns_in_csv(input_csv, output_csv, desired_order):
    with open(input_csv, mode='r', newline='', encoding='utf-8') as infile, \
         open(output_csv, mode='w', newline='', encoding='utf-8') as outfile:
        reader = csv.reader(infile, delimiter=';')
        writer = csv.writer(outfile, delimiter=';')

        # Read the header and determine the new order
        header = next(reader)
        header_index = {name: idx for idx, name in enumerate(header)}
        reordered_header = [name for name in desired_order if name in header]
        writer.writerow(reordered_header)

        print("Reordered Header:", reordered_header)  # Debug print

        # Process and reorder rows
        row_count = 0
        for row in reader:
            if len(row) < len(header):  # Skip rows with fewer columns than header
                print(f"Skipping row with unexpected length: {row}")  # Debug print
                continue
            reordered_row = [row[header_index[name]] for name in desired_order if name in header_index]
            writer.writerow(reordered_row)
            row_count += 1

        print(f"Total rows processed: {row_count}")  # Debug print

# File paths
input_swapped_csv = 'output_UB_replaced.csv'
output_reordered_csv = 'output_UB_reordered.csv'

# Desired column order
desired_order = ['number', 'question', 'kategoria', 'zestaw', 'rating', 'answer']

# Reorder columns and save to new CSV file
reorder_columns_in_csv(input_swapped_csv, output_reordered_csv, desired_order)

print(f"Columns reordered and saved new file: {output_reordered_csv}")
