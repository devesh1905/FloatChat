import os
import numpy as np
import netCDF4 as nc
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

FLOATS = [
    {
        "id": "2903341",
        "name": "Arabian Sea (Goa Offshore)",
        "base_lat": 15.35,
        "base_lon": 72.85,
        "surface_temp": 28.5,
        "deep_temp": 5.2,
        "salinity_base": 36.2,
        "profiles": 12
    },
    {
        "id": "2903342",
        "name": "Bay of Bengal (Chennai Coast)",
        "base_lat": 13.08,
        "base_lon": 80.65,
        "surface_temp": 29.1,
        "deep_temp": 4.8,
        "salinity_base": 34.5,
        "profiles": 12
    },
    {
        "id": "2903343",
        "name": "Bay of Bengal (Vizag Offshore)",
        "base_lat": 17.22,
        "base_lon": 84.45,
        "surface_temp": 28.8,
        "deep_temp": 5.0,
        "salinity_base": 34.8,
        "profiles": 12
    },
    {
        "id": "2903344",
        "name": "Equatorial Indian Ocean",
        "base_lat": 4.50,
        "base_lon": 77.20,
        "surface_temp": 29.8,
        "deep_temp": 4.5,
        "salinity_base": 35.1,
        "profiles": 12
    }
]

# Standard ARGO Depth levels (pressure in dbar ~ depth in meters)
DEPTH_LEVELS = np.array([0, 10, 20, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000], dtype=np.float32)

def generate_float_nc(float_info):
    file_path = os.path.join(DATA_DIR, f"float_{float_info['id']}.nc")
    
    if os.path.exists(file_path):
        os.remove(file_path)

    ds = nc.Dataset(file_path, 'w', format='NETCDF4')
    
    n_prof = float_info['profiles']
    n_levels = len(DEPTH_LEVELS)
    
    ds.createDimension('N_PROF', n_prof)
    ds.createDimension('N_LEVELS', n_levels)
    
    # Global attributes
    ds.title = f"ARGO Float {float_info['id']} Profile Data - {float_info['name']}"
    ds.institution = "INCOIS / ARGO Indian Ocean Program"
    ds.platform_number = float_info['id']
    ds.wmo_inst_type = "836"
    
    # Variables
    v_platform = ds.createVariable('PLATFORM_NUMBER', 'S1', ('N_PROF',))
    v_lat = ds.createVariable('LATITUDE', 'f4', ('N_PROF',))
    v_lat.units = "degree_north"
    
    v_lon = ds.createVariable('LONGITUDE', 'f4', ('N_PROF',))
    v_lon.units = "degree_east"
    
    v_juld = ds.createVariable('JULD', 'f8', ('N_PROF',))
    v_juld.units = "days since 1950-01-01 00:00:00 UTC"
    
    v_pres = ds.createVariable('PRES', 'f4', ('N_PROF', 'N_LEVELS'))
    v_pres.units = "decibar"
    
    v_temp = ds.createVariable('TEMP', 'f4', ('N_PROF', 'N_LEVELS'))
    v_temp.units = "degree_Celsius"
    
    v_psal = ds.createVariable('PSAL', 'f4', ('N_PROF', 'N_LEVELS'))
    v_psal.units = "psu"

    # Fill data
    base_date = datetime(2023, 1, 15)
    ref_date = datetime(1950, 1, 1)

    lats = []
    lons = []
    julds = []
    pres_data = np.zeros((n_prof, n_levels), dtype=np.float32)
    temp_data = np.zeros((n_prof, n_levels), dtype=np.float32)
    psal_data = np.zeros((n_prof, n_levels), dtype=np.float32)

    for p in range(n_prof):
        # Drift slightly over time
        drift_lat = float_info['base_lat'] + (p * 0.08) + np.random.normal(0, 0.02)
        drift_lon = float_info['base_lon'] + (p * 0.11) + np.random.normal(0, 0.02)
        prof_date = base_date + timedelta(days=p * 30) # 1 profile per month
        
        juld_val = (prof_date - ref_date).total_seconds() / 86400.0
        
        lats.append(drift_lat)
        lons.append(drift_lon)
        julds.append(juld_val)
        
        # Thermocline decay curve for temperature
        for l in range(n_levels):
            d = DEPTH_LEVELS[l]
            pres_data[p, l] = d
            
            # Thermocline decay equation
            decay = np.exp(-d / 180.0)
            t_val = float_info['deep_temp'] + (float_info['surface_temp'] - float_info['deep_temp']) * decay
            t_val += np.random.normal(0, 0.15) # Noise
            temp_data[p, l] = round(float(t_val), 2)
            
            # Halocline salinity profile
            s_val = float_info['salinity_base'] + (0.8 * (1.0 - decay)) + np.random.normal(0, 0.05)
            psal_data[p, l] = round(float(s_val), 2)

    v_lat[:] = np.array(lats, dtype=np.float32)
    v_lon[:] = np.array(lons, dtype=np.float32)
    v_juld[:] = np.array(julds, dtype=np.float64)
    v_pres[:] = pres_data
    v_temp[:] = temp_data
    v_psal[:] = psal_data
    
    ds.close()
    print(f"Generated ARGO NetCDF dataset: {file_path} ({n_prof} profiles, {n_levels} depth levels)")

def main():
    print("Generating ARGO NetCDF files for FloatChat...")
    for fl in FLOATS:
        generate_float_nc(fl)
    print("All NetCDF ARGO profile files created successfully!")

if __name__ == "__main__":
    main()
