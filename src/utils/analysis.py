"""
Website analysis module for evaluating potential client websites.
"""

import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any
import json
import re
import time
from datetime import datetime

class WebsiteAnalyzer:
    def __init__(self, pagespeed_api_key: str):
        """
        Initialize the website analyzer.
        
        Args:
            pagespeed_api_key (str): Google PageSpeed Insights API key
        """
        self.pagespeed_api_key = pagespeed_api_key
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def _get_pagespeed_score(self, url: str) -> Dict[str, float]:
        """
        Get PageSpeed Insights scores for a URL.
        
        Args:
            url (str): Website URL to analyze
        
        Returns:
            Dict[str, float]: Dictionary containing performance metrics
        """
        try:
            api_url = (
                "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
                f"?url={url}&key={self.pagespeed_api_key}"
                "&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO"
            )
            response = requests.get(api_url)
            response.raise_for_status()
            
            data = response.json()
            metrics = data['lighthouseResult']['categories']
            
            return {
                'performance': metrics['performance']['score'] * 100,
                'accessibility': metrics['accessibility']['score'] * 100,
                'best_practices': metrics['best-practices']['score'] * 100,
                'seo': metrics['seo']['score'] * 100
            }
        except Exception as e:
            print(f"PageSpeed error for {url}: {str(e)}")
            return None

    def _extract_contact_info(self, soup: BeautifulSoup, url: str) -> Dict[str, List[str]]:
        """
        Extract contact information from a webpage.
        
        Args:
            soup (BeautifulSoup): Parsed HTML content
            url (str): Website URL
        
        Returns:
            Dict[str, List[str]]: Dictionary containing extracted contact information
        """
        text = soup.get_text()
        
        # Find email addresses
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = set(re.findall(email_pattern, text))
        
        # Find phone numbers
        phone_pattern = r'\b[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}\b'
        phones = set(re.findall(phone_pattern, text))
        
        # Find social media links
        social_links = []
        social_domains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com']
        for link in soup.find_all('a', href=True):
            href = link['href']
            if any(domain in href.lower() for domain in social_domains):
                social_links.append(href)
        
        return {
            'emails': list(emails),
            'phones': list(phones),
            'social_links': list(set(social_links))
        }

    def _analyze_design_issues(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Analyze website design and identify potential issues.
        
        Args:
            soup (BeautifulSoup): Parsed HTML content
        
        Returns:
            List[Dict[str, Any]]: List of identified issues
        """
        issues = []
        
        # Check viewport meta tag
        if not soup.find('meta', {'name': 'viewport'}):
            issues.append({
                'type': 'mobile_responsive',
                'severity': 'high',
                'description': 'No mobile viewport meta tag found'
            })
        
        # Check for outdated frameworks
        scripts = soup.find_all('script', src=True)
        for script in scripts:
            src = script['src'].lower()
            if 'jquery-1' in src or 'jquery-2' in src:
                issues.append({
                    'type': 'outdated_framework',
                    'severity': 'medium',
                    'description': f'Using outdated jQuery version: {src}'
                })
        
        # Check image optimization
        images = soup.find_all('img')
        for img in images:
            if not img.get('alt'):
                issues.append({
                    'type': 'accessibility',
                    'severity': 'medium',
                    'description': 'Image missing alt text'
                })
            if img.get('src', '').endswith(('.png', '.jpg', '.jpeg')):
                if not img.get('loading') == 'lazy':
                    issues.append({
                        'type': 'performance',
                        'severity': 'low',
                        'description': 'Image missing lazy loading'
                    })

        # Check for CSS frameworks
        links = soup.find_all('link', rel='stylesheet')
        modern_frameworks = False
        for link in links:
            href = link.get('href', '').lower()
            if any(fw in href for fw in ['tailwind', 'bootstrap-5', 'bulma']):
                modern_frameworks = True
                break
        
        if not modern_frameworks:
            issues.append({
                'type': 'modern_frameworks',
                'severity': 'low',
                'description': 'No modern CSS framework detected'
            })
        
        return issues

    def analyze_website(self, url: str) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a website.
        
        Args:
            url (str): Website URL to analyze
        
        Returns:
            Dict[str, Any]: Analysis results
        """
        try:
            # Fetch webpage content
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Gather all analysis data
            result = {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'pagespeed': self._get_pagespeed_score(url),
                'contact_info': self._extract_contact_info(soup, url),
                'design_issues': self._analyze_design_issues(soup),
                'status': 'success'
            }
            
            return result
            
        except Exception as e:
            return {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'status': 'error'
            }

    def analyze_batch(self, urls: List[str], max_workers: int = 5) -> List[Dict[str, Any]]:
        """
        Analyze multiple websites concurrently.
        
        Args:
            urls (List[str]): List of URLs to analyze
            max_workers (int): Maximum number of concurrent workers
        
        Returns:
            List[Dict[str, Any]]: Analysis results for all websites
        """
        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_url = {executor.submit(self.analyze_website, url): url 
                           for url in urls}
            
            for future in future_to_url:
                result = future.result()
                results.append(result)
                # Respect API rate limits
                time.sleep(1)
        
        return results

    def save_results(self, results: List[Dict[str, Any]], filename: str) -> None:
        """
        Save analysis results to a JSON file.
        
        Args:
            results (List[Dict[str, Any]]): Analysis results to save
            filename (str): Output filename
        """
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)