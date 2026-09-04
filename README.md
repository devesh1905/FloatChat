# 🌊 FloatChat — ARGO Ocean Data Natural Language 3D Visualizer

FloatChat is a minimal working prototype that enables natural language querying of ARGO ocean float datasets (NetCDF format) with interactive 3D globe visualization and 2D thermocline depth profile analytics.

---

## 🎯 Features & Scope

1. **Natural Language Query Engine**:
   - Ask plain-English questions like:
     - *"show temperature readings near Chennai coast below 200m in 2023"*
     - *"show salinity in Arabian sea near Goa in 2023"*
     - *"show deep ocean temperature below 500m in Bay of Bengal"*
   - Uses an LLM (Gemini API) to parse query parameters into structured JSON filters (`lat/lon bounds`, `depth range`, `variable: temperature/salinity`, `year`), with a built-in **offline regex fallback parser** for instant local execution.

2. **Real ARGO NetCDF Processing (FastAPI + xarray)**:
   - Ingests standard NetCDF (`.nc`) profile files generated for 4 key floats across the Indian Ocean (Arabian Sea near Goa, Bay of Bengal near Chennai, Vizag offshore, and Equatorial Indian Ocean).
   - Dynamically filters spatial coordinates, depth levels (0m to 1000m), and dates using `xarray`.

3. **Interactive 3D Ocean Globe (Next.js + React Three Fiber)**:
   - Interactive 3D Earth sphere centered on the Indian Ocean sector with atmospheric glow.
   - Plots ARGO float coordinates as glowing 3D beacon markers color-coded by temperature or salinity.

4. **2D Depth Profile Analytics (Recharts)**:
   - Inverted Y-axis line chart displaying thermocline drop curves (0m surface down to 1000m deep water).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: v18+ (tested on Node v24)
- **npm**

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd "d:/Downloads/Orion SIST/floatchat/backend"
   ```

2. (Optional) Set your Gemini API key if available:
   ```bash
   # PowerShell
   $env:GEMINI_API_KEY="your-gemini-api-key"
   ```
   *(If omitted, FloatChat automatically uses its built-in offline NLP parser).*

3. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - API Healthcheck: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

---

### Step 2: Start the Frontend (Next.js)

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd "d:/Downloads/Orion SIST/floatchat/frontend"
   ```

2. Run the Next.js development server:
   ```bash
   cmd /c npm run dev
   # or
   npm run dev
   ```

3. Open your browser at **`http://localhost:3000`**.

---

## 📁 Project Structure

```
floatchat/
├── backend/
│   ├── data/                 # 4 ARGO NetCDF files (.nc)
│   ├── generate_argo_data.py # NetCDF generator script
│   ├── argo_service.py       # xarray NetCDF dataset filter service
│   ├── nlp_parser.py         # Gemini API + regex fallback parser
│   ├── main.py               # FastAPI server application
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   │   └── components/
│   │       ├── Globe3D.tsx    # React Three Fiber 3D Globe with ARGO float markers
│   │       ├── DepthChart.tsx # Recharts 2D Depth Thermocline line plot
│   │       ├── QueryInput.tsx # Natural language prompt bar & quick query chips
│   │       └── FloatTable.tsx # ARGO float sampling dataset table
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Ocean dark mode styling
│   └── next.config.mjs
└── README.md
```

---

## 🔬 Sample Queries to Try in the UI

- `show temperature readings near Chennai coast below 200m in 2023`
- `show salinity in Arabian sea near Goa in 2023`
- `show deep ocean temperature below 500m in Bay of Bengal`
- `show surface water profiles near Equatorial Indian Ocean`
