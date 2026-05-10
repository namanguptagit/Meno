from urllib.parse import urlparse, parse_qs
import re

def parse_zoom_url(url: str):
    """
    Extracts meeting ID and password from a Zoom URL.
    Returns: {"meeting_id": "...", "meeting_pwd": "..."}
    """
    # If it's just numbers
    if re.match(r'^\d+$', url):
        return {"meeting_id": url, "meeting_pwd": ""}

    parsed_url = urlparse(url)
    path = parsed_url.path
    
    # Extract meeting ID from path (e.g., /j/123456789)
    meeting_id = ""
    match = re.search(r'/j/(\d+)', path)
    if match:
        meeting_id = match.group(1)
        
    # Extract password from query params
    query = parse_qs(parsed_url.query)
    pwd = query.get('pwd', [''])[0]
    
    return {"meeting_id": meeting_id, "meeting_pwd": pwd}
