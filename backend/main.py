import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from nlp_parser import parse_natural_language_query
from argo_service import argo_service

app = FastAPI(
    title="FloatChat API - ARGO Ocean Data NLP Visualizer",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "FloatChat Backend API",
        "loaded_floats": list(argo_service.datasets.keys())
    }

@app.get("/api/floats")
def get_floats():
    summary = []
    for fid, ds in argo_service.datasets.items():
        lats = ds["LATITUDE"].values
        lons = ds["LONGITUDE"].values
        summary.append({
            "float_id": fid,
            "profiles_count": len(ds.N_PROF),
            "lat_min": round(float(lats.min()), 3),
            "lat_max": round(float(lats.max()), 3),
            "lon_min": round(float(lons.min()), 3),
            "lon_max": round(float(lons.max()), 3),
        })
    return {"floats": summary}

@app.post("/api/query")
def process_query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    # 1. Parse query
    filters = parse_natural_language_query(req.query)
    
    # 2. Query NetCDF service
    points, depth_profiles = argo_service.query_points(filters)
    
    # 3. Format summary message
    num_pts = len(points)
    num_floats = len(set(pt['float_id'] for pt in points)) if num_pts > 0 else 0
    var_label = filters.get("variable", "temperature").capitalize()
    loc_label = filters.get("location", "Indian Ocean")
    d_min = filters.get("depth_min", 0)
    d_max = filters.get("depth_max", 1000)
    
    summary = f"Found {num_pts} profile readings across {num_floats} ARGO float(s) near {loc_label} between {d_min}m and {d_max}m depth."

    return {
        "query": req.query,
        "parsed_filters": filters,
        "summary": summary,
        "total_points": num_pts,
        "total_floats": num_floats,
        "points": points,
        "depth_profiles": depth_profiles
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
