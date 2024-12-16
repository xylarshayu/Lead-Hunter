# Lead Finder

Automated tool for finding potential web development clients by analyzing websites with outdated UI/UX and poor performance metrics.

## Setup

1. Create and activate virtual environment:
```bash
python -m venv emvLeadHunter
source emvLeadHunter/bin/activate  # On Unix/MacOS
# OR
.\emvLeadHunter\Scripts\activate  # On Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
- Copy `.env.template` to `.env`
- Add your API keys to `.env`

## Usage

```bash
python src/lead_finder.py
```

## Features

- Automated search queries for potential clients
- Website performance analysis using PageSpeed Insights
- Contact information extraction
- UI/UX issues detection
- Multi-threaded processing for better performance