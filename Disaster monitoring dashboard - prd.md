Here is a highly structured Product Requirements Document (PRD) designed specifically to be fed into Google Antigravity. It is written in a way that gives the AI clear instructions on how to hook into your existing codebase, handle the OGC web services, and style the output.

You can copy and paste everything between the lines directly into Antigravity.

# PRD: NeSDR Disaster Monitoring Dashboard Integration

## 1. Project Context & Objective

**Objective:** Integrate a real-time Disaster Monitoring Dashboard into an existing web application. The dashboard will visualize geospatial data (floods, landslides, blocked roads) across the North Eastern Region (NER) by consuming OGC web services (WMS/WFS) from the North Eastern Spatial Data Repository (NeSDR - nesdr.gov.in). **Target Environment:** Existing web application (React/Next.js frontend). **Primary User:** Command center dispatchers and logistics managers who need rapid, scannable insights into regional accessibility.

## 2. Technical Architecture & Stack

- **Geospatial Engine:** `Leaflet.js` or `MapLibre GL JS` optimized for rendering OGC standard map layers.
    
- **Backend Proxy (Crucial):** Create a lightweight proxy utility route within the existing backend (Node.js/Express or Python/FastAPI). This is required to bypass browser CORS restrictions when fetching external endpoints from `nesdr.gov.in`.
    
- **State Management:** React hooks for managing active map layers, bounding boxes, and active hazard payloads.
    

## 3. Core Functional Requirements

### 3.1. NeSDR Service Proxy (Backend)

- Create a proxy endpoint `GET /api/proxy/nesdr/wms` that forwards client requests to the NeSDR WMS tile servers and pipes the image response back to the client.
    
- Create a proxy endpoint `GET /api/proxy/nesdr/wfs` to fetch raw GeoJSON vector data for hazard markers and region boundaries.
    
- Implement basic server-side caching (e.g., Redis or in-memory) for the WFS data to reduce redundant calls to the NeSDR servers.
    

### 3.2. Interactive Spatial UI (Frontend)

- **Base Map:** Implement a lightweight, dark-basemap canvas centered on the NER coordinates `[26.2006, 92.9376]`.
    
- **Raster Overlays (WMS):** Add layer toggle controls allowing the user to overlay dynamic NeSDR raster layers (e.g., flood inundation zones, road networks) on top of the base map.
    
- **Vector Markers (WFS):** Parse the NeSDR WFS GeoJSON feeds and plot interactive hazard markers. Ensure markers display popup tooltips with incident severity and timestamps on hover/click.
    

## 4. UI/UX & Design System Guidelines

- **Visual Style:** Strictly adhere to a minimalist, dark-themed, and cinematic visual design language.
    
- **Color Palette:** Utilize deep blacks (e.g., `#0A0A0A`) for the background, dark muted grays for side panels, and high-contrast, cinematic neon accents for critical data (e.g., glowing crimson for severe alerts, electric amber for warnings).
    
- **Layout:** Uncluttered and data-forward. The map should span the majority of the viewport, with a floating, translucent glass-morphic side panel for layer toggles and active incident feeds.
    
- **Scannability:** Prioritize immediate readability. Avoid heavy borders; use subtle drop shadows and typography weight to establish hierarchy.
    

## 5. Antigravity Execution Steps (Agent Instructions)

1. **Step 1:** Analyze the existing backend routing structure and generate the CORS-compliant proxy routes for the NeSDR WMS and WFS endpoints.
    
2. **Step 2:** Generate the React component for the Leaflet/MapLibre map, ensuring the base map tiles are set to a dark theme.
    
3. **Step 3:** Wire the proxy endpoints to the frontend map component, adding layer control toggles for at least two mock NeSDR layers (e.g., `NER_Landslide`, `NER_Flood`).
    
4. **Step 4:** Apply the cinematic, dark-themed CSS/Tailwind styling to the map container, layer controls, and tooltips.
    


