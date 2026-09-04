import os
import re
import json
from google import genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def parse_query_with_rule_fallback(query_text: str) -> dict:
    q = query_text.lower()
    
    # 1. Location Bounds & Target Pinpoint
    lat_min, lat_max, lon_min, lon_max = None, None, None, None
    target_lat, target_lon = None, None
    loc_name = "Indian Ocean"
    
    if "chennai" in q:
        lat_min, lat_max = 11.0, 14.5
        lon_min, lon_max = 79.5, 82.5
        target_lat, target_lon = 13.08, 80.27
        loc_name = "Chennai Coast (Bay of Bengal)"
    elif "vizag" in q or "visakhapatnam" in q:
        lat_min, lat_max = 15.0, 19.0
        lon_min, lon_max = 82.5, 87.0
        target_lat, target_lon = 17.68, 83.21
        loc_name = "Vizag Offshore (Bay of Bengal)"
    elif "goa" in q or "arabian" in q or "mumbai" in q:
        lat_min, lat_max = 13.0, 18.5
        lon_min, lon_max = 70.0, 75.0
        target_lat, target_lon = 15.29, 74.12
        loc_name = "Arabian Sea (Goa/Mumbai)"
    elif "equator" in q or "equatorial" in q:
        lat_min, lat_max = 2.0, 8.0
        lon_min, lon_max = 72.0, 80.0
        target_lat, target_lon = 5.0, 76.0
        loc_name = "Equatorial Indian Ocean"
    elif "bay of bengal" in q:
        lat_min, lat_max = 10.0, 20.0
        lon_min, lon_max = 80.0, 92.0
        target_lat, target_lon = 14.5, 86.0
        loc_name = "Bay of Bengal Region"

    # 2. Depth Range
    depth_min, depth_max = 0, 1000
    
    match_below = re.search(r'(?:below|deeper than|under|greater than|>)\s*(\d+)\s*m?', q)
    match_above = re.search(r'(?:above|shallower than|surface|less than|<)\s*(\d+)\s*m?', q)
    match_between = re.search(r'between\s*(\d+)\s*and\s*(\d+)\s*m?', q)
    
    if match_between:
        depth_min = int(match_between.group(1))
        depth_max = int(match_between.group(2))
    elif match_below:
        depth_min = int(match_below.group(1))
        depth_max = 1000
    elif match_above:
        depth_min = 0
        depth_max = int(match_above.group(1))
    elif "surface" in q:
        depth_min = 0
        depth_max = 100

    # 3. Variable
    variable = "salinity" if ("salinity" in q or "psu" in q or "salt" in q) else "temperature"

    # 4. Year / Date
    year = None
    year_match = re.search(r'\b(2022|2023|2024)\b', q)
    if year_match:
        year = int(year_match.group(1))

    return {
        "location": loc_name,
        "lat_min": lat_min,
        "lat_max": lat_max,
        "lon_min": lon_min,
        "lon_max": lon_max,
        "target_lat": target_lat,
        "target_lon": target_lon,
        "depth_min": depth_min,
        "depth_max": depth_max,
        "variable": variable,
        "year": year
    }

def parse_natural_language_query(query_text: str) -> dict:
    """Uses Gemini API if key is set, otherwise falls back seamlessly to rule parser."""
    if not GEMINI_API_KEY:
        return parse_query_with_rule_fallback(query_text)
        
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""
Parse the following natural language query about ARGO ocean float data into JSON filters.
Query: "{query_text}"

Return strictly valid JSON with these keys:
- "location": short string describing the region
- "lat_min": float or null
- "lat_max": float or null
- "lon_min": float or null
- "lon_max": float or null
- "depth_min": float or null
- "depth_max": float or null
- "variable": "temperature" or "salinity"
- "year": integer or null
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        # Clean markdown codeblocks
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini API parse failed ({e}), using fallback parser.")
        return parse_query_with_rule_fallback(query_text)
