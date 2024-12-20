import json
import os
from urllib.parse import urlparse

def should_keep_url(url):
    """Determine if a URL should be kept in the results."""
    if not url:
        return False
        
    try:
        parsed = urlparse(url)
        
        # List of patterns to exclude
        exclude_patterns = [
            '.pdf',
            '.doc',
            '.docx',
            '.csv',
            'github.com',
            'reddit.com',
            'justdial.com',
            'linkedin.com/jobs',
            '/careers',
            '/job'
        ]
        
        # Check if URL contains any exclude patterns
        url_lower = url.lower()
        if any(pattern in url_lower for pattern in exclude_patterns):
            return False
            
        return True
    except Exception:
        return False

def clean_json_file(input_file):
    """Clean a single JSON file."""
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            print(f"Warning: {input_file} does not contain a JSON array")
            return
            
        # Filter out entries with unwanted URLs
        cleaned_data = []
        removed_count = 0
        
        for entry in data:
            url = entry.get('url')
            if should_keep_url(url):
                cleaned_data.append(entry)
            else:
                removed_count += 1
                
        # Create output filename
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}_cleaned.json"
        
        # Save cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
            
        print(f"Processed {input_file}:")
        print(f"- Original entries: {len(data)}")
        print(f"- Removed entries: {removed_count}")
        print(f"- Remaining entries: {len(cleaned_data)}")
        print(f"- Saved to: {output_file}\n")
        
    except Exception as e:
        print(f"Error processing {input_file}: {str(e)}\n")

def main():
    # Get all JSON files in current directory
    json_files = [f for f in os.listdir('.') if f.endswith('.json') and not f.endswith('_cleaned.json')]
    
    if not json_files:
        print("No JSON files found in current directory")
        return
        
    print(f"Found {len(json_files)} JSON files to process\n")
    
    # Process each file
    for json_file in json_files:
        clean_json_file(json_file)

if __name__ == "__main__":
    main()