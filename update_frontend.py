import re

with open('apps/stockflow-web/src/app/features/disaster-monitor/disaster-monitor-workspace.component.ts', 'r') as f:
    content = f.read()

# Replace hardcoded incidents with empty array
content = re.sub(r'readonly incidents: HazardIncident\[\] = \[.*?\];', 'incidents: HazardIncident[] = [];', content, flags=re.DOTALL)

# Add fetch methods inside the class
fetch_methods = """
  async loadLiveFeeds(): Promise<void> {
    try {
      const [floodRes, landslideRes, eqRes] = await Promise.all([
        fetch('/api/proxy/flood').then(r => r.json()).catch(() => []),
        fetch('/api/proxy/landslide').then(r => r.json()).catch(() => []),
        fetch('/api/proxy/earthquake').then(r => r.json()).catch(() => [])
      ]);

      const newIncidents: HazardIncident[] = [];
      let idCounter = 1;

      // Process Floods
      if (Array.isArray(floodRes)) {
        floodRes.forEach(f => {
          if (!f.latitude || !f.longitude) return;
          newIncidents.push({
            id: `FLD-${String(idCounter++).padStart(3, '0')}`,
            title: `Flood at ${f.station || f.district}`,
            location: `${f.district}, ${f.state}`,
            severity: f.severity === 'severe' ? 'severe' : (f.level === 'above_danger' ? 'warning' : 'monitoring'),
            type: 'flood',
            timestamp: f.date || 'Recent',
            coordinates: [f.latitude, f.longitude],
            detail: this.formatFloodPopup(f)
          });
        });
      }

      // Process Landslides
      if (Array.isArray(landslideRes)) {
        landslideRes.forEach(l => {
          if (!l.lat || !l.lon) return;
          newIncidents.push({
            id: `LND-${String(idCounter++).padStart(3, '0')}`,
            title: `Landslide at ${l.location || l.district}`,
            location: `${l.district}, ${l.state}`,
            severity: 'severe',
            type: 'landslide',
            timestamp: `${l.month_} ${l.date_?.split('/')[2] || ''}`,
            coordinates: [l.lat, l.lon],
            detail: this.formatLandslidePopup(l)
          });
        });
      }

      // Process Earthquakes
      if (Array.isArray(eqRes)) {
        eqRes.forEach(e => {
          if (!e.latitude || !e.longitude) return;
          newIncidents.push({
            id: `EQ-${String(idCounter++).padStart(3, '0')}`,
            title: `Earthquake M${e.mag}`,
            location: e.place || e.region,
            severity: e.mag >= 5 ? 'severe' : (e.mag >= 3.5 ? 'warning' : 'monitoring'),
            type: 'earthquake',
            timestamp: e.occurenceTime?.split('T')[0] || 'Recent',
            coordinates: [e.latitude, e.longitude],
            detail: this.formatEarthquakePopup(e)
          });
        });
      }

      this.incidents = newIncidents;
      this.renderIncidentMarkers();
    } catch (e) {
      console.error('Error loading live feeds', e);
    }
  }

  private formatEarthquakePopup(e: any): string {
    const dateStr = e.occurenceTime ? e.occurenceTime.split('T')[0] : 'N/A';
    const timeStr = e.occurenceTime ? e.occurenceTime.split('T')[1]?.replace('+00:00', '') : 'N/A';
    return `<div class="real-disaster-popup">
Earthquake<br>
Place:${e.place || e.region}<br>
Latitude:${e.latitude}<br>
Longitude:${e.longitude}<br>
Magnitude:${e.mag}<br>
Date:${dateStr}<br>
Time:${timeStr}<br>
Source: ${e.locSrc || 'ncs'}<br>
<a href="${e.eventUrl}" target="_blank">More Details</a>
</div>`;
  }

  private formatFloodPopup(f: any): string {
    return `<div class="real-disaster-popup">
Flood Event<br>
Station:${f.station}<br>
District:${f.district}, ${f.state}<br>
Latitude:${f.latitude}<br>
Longitude:${f.longitude}<br>
Water Level:${f.water_level}m<br>
Danger Level:${f.danger_level}m<br>
Status:${f.level}<br>
Date:${f.date}
</div>`;
  }

  private formatLandslidePopup(l: any): string {
    return `<div class="real-disaster-popup">
Landslide Event<br>
Location:${l.location}<br>
District:${l.district}, ${l.state}<br>
Latitude:${l.lat}<br>
Longitude:${l.lon}<br>
Type:${l.slide_type}<br>
Trigger:${l.trigg_mech}<br>
Impact:${l.impact}<br>
Date:${l.date_}
</div>`;
  }
"""

content = content.replace('ngAfterViewInit(): void {', fetch_methods + '\n  ngAfterViewInit(): void {')
content = content.replace('this.initMap();', 'this.initMap();\n    this.loadLiveFeeds();')

# Now remove the old incident rendering from addHazardLayers
# It starts with "// Incident markers (always on)" and goes up to "this.layerGroups.set('incidents', incidentGroup);"
# I'll just write a new renderIncidentMarkers method and remove the old block
render_method = """
  private renderIncidentMarkers(): void {
    if (!this.map) return;
    
    // Clear old incidents layer if it exists
    if (this.layerGroups.has('incidents')) {
      this.layerGroups.get('incidents')?.clearLayers();
      this.layerGroups.get('incidents')?.remove();
    }
    
    const incidentGroup = L.layerGroup();
    this.incidents.forEach(incident => {
      const pulseClass = incident.severity === 'severe' ? 'incident-marker severe' : incident.severity === 'warning' ? 'incident-marker warning' : 'incident-marker monitoring';
      
      // Use the pre-formatted detail directly as the popup content for the exact look
      L.marker(incident.coordinates, {
        icon: L.divIcon({
          className: '',
          html: `<span class="${pulseClass}">${this.severityIcon(incident.type)}</span>`,
          iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
        })
      }).bindPopup(incident.detail).addTo(incidentGroup);
    });
    this.layerGroups.set('incidents', incidentGroup);
    incidentGroup.addTo(this.map);
    
    // Auto-update stats based on live data
    this.severityCounts.severe = this.incidents.filter(i => i.severity === 'severe').length;
    this.severityCounts.warning = this.incidents.filter(i => i.severity === 'warning').length;
    this.severityCounts.monitoring = this.incidents.filter(i => i.severity === 'monitoring').length;
  }
"""

# replace the block in addHazardLayers
old_incident_block = re.search(r'// Incident markers \(always on\).*?incidentGroup\.addTo\(this\.map\);', content, flags=re.DOTALL).group(0)
content = content.replace(old_incident_block, render_method)

with open('apps/stockflow-web/src/app/features/disaster-monitor/disaster-monitor-workspace.component.ts', 'w') as f:
    f.write(content)

print("Updated component successfully.")
