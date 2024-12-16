"""
Search module for finding potential client websites using various search engines and APIs.
"""

import requests
from typing import List, Optional
import time
from urllib.parse import quote_plus

class SearchClient:
    def __init__(self, api_key: str):
        """
        Initialize the search client.
        
        Args:
            api_key (str): Google Custom Search API key
        """
        self.api_key = api_key
        self.cx = "YOUR_CUSTOM_SEARCH_ENGINE_ID"  # Need to create this in Google Custom Search Console
        self.base_url = "https://www.googleapis.com/customsearch/v1"
        self.queries = [
            '"{city}" "small business" -jobs',
            '"contact us" "{industry}" "{city}" -jobs',
            'inurl:contact "{industry}" "{city}"',
            '"established * 2020" "{industry}" "{city}" "contact"',
            '"{industry} company" "{city}" "email us"',
            '"powered by wordpress" "{city}" "{industry}"',
            '"© 2020" OR "© 2019" OR "© 2018" "{industry}" "{city}"',
            '"{industry}" "{city}" "book appointment" -squarespace -wix'
        ]

    def _execute_search(self, query: str) -> List[str]:
        """
        Execute a single search query using Google Custom Search API.
        
        Args:
            query (str): Search query string
        
        Returns:
            List[str]: List of URLs from search results
        """
        try:
            params = {
                'key': self.api_key,
                'cx': self.cx,
                'q': query,
                'num': 10  # Number of results per query
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if 'items' not in data:
                return []
                
            urls = [item['link'] for item in data['items']]
            return urls
            
        except requests.exceptions.RequestException as e:
            print(f"Search error: {str(e)}")
            return []
            
    def _filter_urls(self, urls: List[str]) -> List[str]:
        """
        Filter URLs to remove duplicates and unwanted domains.
        
        Args:
            urls (List[str]): List of URLs to filter
        
        Returns:
            List[str]: Filtered list of URLs
        """
        # Remove duplicates while preserving order
        unique_urls = list(dict.fromkeys(urls))
        
        # Filter out unwanted domains
        blocked_domains = {'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'}
        filtered_urls = [
            url for url in unique_urls
            if not any(domain in url.lower() for domain in blocked_domains)
        ]
        
        return filtered_urls

    def search(self, city: str, industry: str, max_results: int = 50) -> List[str]:
        """
        Perform searches for a given city and industry.
        
        Args:
            city (str): Target city name
            industry (str): Target industry
            max_results (int): Maximum number of results to return
        
        Returns:
            List[str]: List of unique URLs matching the search criteria
        """
        all_urls = []
        
        for query_template in self.queries:
            # Format the query
            query = query_template.format(
                city=city,
                industry=industry
            )
            
            # Execute search
            urls = self._execute_search(query)
            all_urls.extend(urls)
            
            # Respect API rate limits
            time.sleep(1)
            
            # Stop if we have enough results
            if len(all_urls) >= max_results:
                break
        
        # Filter and limit results
        filtered_urls = self._filter_urls(all_urls)
        return filtered_urls[:max_results]