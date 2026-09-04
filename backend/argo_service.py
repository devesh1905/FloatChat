import os
import glob
import xarray as xr
import numpy as np
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

class ArgoDataService:
    def __init__(self):
        self.datasets = {}
        self.load_all_datasets()
        
    def load_all_datasets(self):
        nc_files = glob.glob(os.path.join(DATA_DIR, "float_*.nc"))
        for f in nc_files:
            float_id = os.path.basename(f).replace("float_", "").replace(".nc", "")
            try:
                ds = xr.open_dataset(f)
                self.datasets[float_id] = ds
                print(f"Loaded Float {float_id} with {len(ds.N_PROF)} profiles.")
            except Exception as e:
                print(f"Error loading {f}: {e}")

    def query_points(self, filters):
        """
        filters dict structure:
        {
           "lat_min": float or None,
           "lat_max": float or None,
           "lon_min": float or None,
           "lon_max": float or None,
           "depth_min": float or None,
           "depth_max": float or None,
           "variable": "temperature" or "salinity",
           "year": int or None
        }
        """
        results = []
        depth_profiles = {}
        
        lat_min = filters.get("lat_min", -90) or -90
        lat_max = filters.get("lat_max", 90) or 90
        lon_min = filters.get("lon_min", -180) or -180
        lon_max = filters.get("lon_max", 180) or 180
        depth_min = filters.get("depth_min", 0) or 0
        depth_max = filters.get("depth_max", 2000) or 2000
        variable = (filters.get("variable") or "temperature").lower()
        target_year = filters.get("year")
        
        ref_date = datetime(1950, 1, 1)

        for float_id, ds in self.datasets.items():
            lats = ds["LATITUDE"].values
            lons = ds["LONGITUDE"].values
            julds = ds["JULD"].values
            pres = ds["PRES"].values  # shape (N_PROF, N_LEVELS)
            temps = ds["TEMP"].values # shape (N_PROF, N_LEVELS)
            psals = ds["PSAL"].values # shape (N_PROF, N_LEVELS)
            
            n_prof, n_levels = pres.shape
            
            for p in range(n_prof):
                lat = float(lats[p])
                lon = float(lons[p])
                juld = float(julds[p])
                try:
                    prof_date = ref_date + timedelta(days=float(juld))
                except Exception:
                    prof_date = datetime(2023, 1, 15) + timedelta(days=p*30)
                
                # Check spatial bounds
                if not (lat_min <= lat <= lat_max and lon_min <= lon <= lon_max):
                    continue
                    
                # Check year filter
                if target_year and prof_date.year != int(target_year):
                    continue
                    
                prof_points = []
                for l in range(n_levels):
                    dp = float(pres[p, l])
                    if depth_min <= dp <= depth_max:
                        t_val = float(temps[p, l])
                        s_val = float(psals[p, l])
                        val = t_val if variable == "temperature" else s_val
                        
                        pt = {
                            "float_id": float_id,
                            "profile_index": p,
                            "lat": round(lat, 3),
                            "lon": round(lon, 3),
                            "depth": round(dp, 1),
                            "temp": round(t_val, 2),
                            "salinity": round(s_val, 2),
                            "value": round(val, 2),
                            "variable": variable,
                            "timestamp": prof_date.strftime("%Y-%m-%d")
                        }
                        results.append(pt)
                        prof_points.append(pt)
                
                if prof_points:
                    if float_id not in depth_profiles:
                        depth_profiles[float_id] = []
                    depth_profiles[float_id].append({
                        "profile_date": prof_date.strftime("%Y-%m-%d"),
                        "lat": round(lat, 3),
                        "lon": round(lon, 3),
                        "points": prof_points
                    })
                    
        return results, depth_profiles

argo_service = ArgoDataService()
