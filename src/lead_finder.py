import os
from dotenv import load_dotenv
from utils.search import SearchClient
from utils.analysis import WebsiteAnalyzer
import argparse

# Load environment variables
load_dotenv(dotenv_path='.env', override=True)

def main():
    # Initialize components
    parser = argparse.ArgumentParser(description='Find potential web development clients')
    parser.add_argument('--city', default='Jaipur', help='City to search in (default: Jaipur)')
    args = parser.parse_args()

    search_client = SearchClient(
        api_key=os.getenv('SEARCH_API_KEY'),
        cx=os.getenv('SEARCH_ENGINE_ID')
    )
    
    analyzer = WebsiteAnalyzer(
        pagespeed_api_key=os.getenv('PAGESPEED_API_KEY')
    )
    
    industries = [
        "manufacturing company",
        "real estate agency",
        "dental practice",
        "law firm",
        "beauty salon",
        "fitness center"
    ]
    
    for industry in industries:
        # Generate and perform searches
        urls = search_client.search(city=args.city, industry=industry)
        
        # Analyze each website
        results = analyzer.analyze_batch(urls)
        
        # Save results
        analyzer.save_results(results, f"results_{industry.replace(' ', '_')}.json")

if __name__ == "__main__":
    main()