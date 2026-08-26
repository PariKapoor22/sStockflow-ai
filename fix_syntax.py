import re

with open('apps/stockflow-web/src/app/features/disaster-monitor/disaster-monitor-workspace.component.ts', 'r') as f:
    content = f.read()

render_method_text = """
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

# Remove the broken block
content = content.replace(render_method_text, '')

# Add it before private hazardPopup
content = content.replace('  private hazardPopup', render_method_text + '\n  private hazardPopup')

with open('apps/stockflow-web/src/app/features/disaster-monitor/disaster-monitor-workspace.component.ts', 'w') as f:
    f.write(content)
