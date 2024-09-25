from bs4 import BeautifulSoup

def update_html_levels(soup):
    # Modify Level 3 - § par(sth)
    for par in soup.find_all('div', id=lambda x: x and 'par(' in x):
        # Get the paragraph id
        par_id = par.get('id')
        if 'ust' in par_id:  # Proceed only if the paragraph has ust in id
            # Extract relevant info for par, ust, pkt, lit levels
            par_num = par_id.split('par(')[1].split(')')[0]
            ust_num = par_id.split('ust(')[1].split(')')[0] if 'ust(' in par_id else None
            pkt_num = par_id.split('pkt(')[1].split(')')[0] if 'pkt(' in par_id else None
            lit_num = par_id.split('lit(')[1].split(')')[0] if 'lit(' in par_id else None

            # Update content based on levels
            par_div = par.find('div', class_='a_lb')
            if par_div:
                updated_text = f'§ {par_num}.'
                if ust_num:
                    updated_text += f' {ust_num}.'
                if pkt_num:
                    updated_text += f' {pkt_num})'
                if lit_num:
                    updated_text += f' {lit_num})'
                par_div.string = updated_text
    return soup

def process_html(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as file:
        contents = file.read()
    
    # Parse the HTML content
    soup = BeautifulSoup(contents, 'html.parser')
    
    # Update the HTML levels
    updated_soup = update_html_levels(soup)
    
    # Write the updated HTML to the output file
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(str(updated_soup))

# File paths
input_file = 'inputAP.html'
output_file = 'outputAP.html'

# Process the HTML file
process_html(input_file, output_file)

print(f"Processed HTML saved to {output_file}")
