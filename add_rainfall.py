import re

with open('apps/stockflow-web/src/app/features/disaster-monitor/disaster-monitor-workspace.component.ts', 'r') as f:
    content = f.read()

# 1. Update HazardIncident type
content = content.replace(
    "type: 'flood' | 'landslide' | 'road-block' | 'earthquake';",
    "type: 'flood' | 'landslide' | 'road-block' | 'earthquake' | 'rainfall';"
)

# 2. Add layer toggle
layer_toggle = """    { id: 'earthquake', label: 'Seismic Activity', description: 'Recent tremor epicenters', enabled: false, color: '#a855f7', type: 'vector' },
    { id: 'rainfall', label: 'Rainfall Monitoring', description: 'Heavy precipitation alerts', enabled: true, color: '#3b82f6', type: 'raster' }"""
content = content.replace("    { id: 'earthquake', label: 'Seismic Activity', description: 'Recent tremor epicenters', enabled: false, color: '#a855f7', type: 'vector' },", layer_toggle)

# 3. Add to loadLiveFeeds
rainfall_mock = """
      // Mock Rainfall Data
      newIncidents.push({
        id: `RNF-${String(idCounter++).padStart(3, '0')}`,
        title: `Heavy Rainfall Alert`,
        location: `Cherrapunji, Meghalaya`,
        severity: 'warning',
        type: 'rainfall',
        timestamp: 'Just now',
        coordinates: [25.27, 91.73],
        detail: `<div class="real-disaster-popup">Rainfall Event<br>Location: Cherrapunji<br>Precipitation: 145mm/hr<br>Status: Warning</div>`
      });
      newIncidents.push({
        id: `RNF-${String(idCounter++).padStart(3, '0')}`,
        title: `Severe Downpour`,
        location: `Pasighat, Arunachal Pradesh`,
        severity: 'severe',
        type: 'rainfall',
        timestamp: '1 hour ago',
        coordinates: [28.06, 95.32],
        detail: `<div class="real-disaster-popup">Rainfall Event<br>Location: Pasighat<br>Precipitation: 210mm/hr<br>Status: Critical</div>`
      });

      this.incidents = newIncidents;"""
content = content.replace("      this.incidents = newIncidents;", rainfall_mock)

# 4. Update severityIcon
icon_case = """      case 'earthquake': return '📳';
      case 'rainfall': return '🌧️';"""
content = content.replace("      case 'earthquake': return '📳';", icon_case)

# 5. Add rainfall map layer to addHazardLayers
rainfall_layer = """
    // Seismic activity (off by default)
    const seismicGroup = L.layerGroup();
    const tremors = [
      { name: 'Manipur–Myanmar border tremor', point: [25.05, 94.45] as L.LatLngTuple, magnitude: 'M3.2', depth: '12 km' },
      { name: 'Nagaland minor tremor', point: [26.15, 94.56] as L.LatLngTuple, magnitude: 'M2.8', depth: '15 km' },
    ];
    tremors.forEach(tremor => {
      L.circleMarker(tremor.point, {
        radius: 10, color: '#a855f7', weight: 2,
        fillColor: '#a855f7', fillOpacity: 0.25
      }).bindPopup(`<div class="disaster-popup"><strong>${tremor.name}</strong><br>Magnitude: ${tremor.magnitude}<br>Depth: ${tremor.depth}</div>`).addTo(seismicGroup);
    });
    this.layerGroups.set('earthquake', seismicGroup);

    // Rainfall Monitoring
    const rainfallGroup = L.layerGroup();
    const rainfallZones = [
      { name: 'Meghalaya Plateau Heavy Rain', center: [25.27, 91.73] as L.LatLngTuple, radius: 35000, status: 'Warning - 145mm/hr' },
      { name: 'Siang Valley Downpour', center: [28.06, 95.32] as L.LatLngTuple, radius: 40000, status: 'Severe - 210mm/hr' },
    ];
    rainfallZones.forEach(zone => {
      L.circle(zone.center, {
        radius: zone.radius, color: '#3b82f6', weight: 2,
        fillColor: '#3b82f6', fillOpacity: 0.2, dashArray: '5 5'
      }).bindPopup(this.hazardPopup(zone.name, 'Rainfall', zone.status)).addTo(rainfallGroup);
    });
    this.layerGroups.set('rainfall', rainfallGroup);
    rainfallGroup.addTo(this.map);
"""

# replace seismicGroup block with the combined seismicGroup + rainfallGroup block
old_seismic_block = """    // Seismic activity (off by default)
    const seismicGroup = L.layerGroup();
    const tremors = [
      { name: 'Manipur–Myanmar border tremor', point: [25.05, 94.45] as L.LatLngTuple, magnitude: 'M3.2', depth: '12 km' },
      { name: 'Nagaland minor tremor', point: [26.15, 94.56] as L.LatLngTuple, magnitude: 'M2.8', depth: '15 km' },
    ];
    tremors.forEach(tremor => {
      L.circleMarker(tremor.point, {
        radius: 10, color: '#a855f7', weight: 2,
        fillColor: '#a855f7', fillOpacity: 0.25
      }).bindPopup(`<div class="disaster-popup"><strong>${tremor.name}</strong><br>Magnitude: ${tremor.magnitude}<br>Depth: ${tremor.depth}</div>`).addTo(seismicGroup);
    });
    this.layerGroups.set('earthquake', seismicGroup);"""
content = content.replace(old_seismic_block, rainfall_layer)

with open('apps/stockflow-web/src/app/features/disaster-monitor/disaster-monitor-workspace.component.ts', 'w') as f:
    f.write(content)
