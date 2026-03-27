/**
 * Performs a simple centroid split of a GeoJSON feature/geometry
 * into 3 vertical slice polygons based on its bounding box.
 */
function splitPolygonIntoThreeZones(geoPolygon) {
  // Extract coordinates
  let coords = [];
  if (geoPolygon.type === 'Feature') {
    coords = geoPolygon.geometry.coordinates[0];
  } else if (geoPolygon.type === 'Polygon') {
    coords = geoPolygon.coordinates[0];
  } else {
    throw new Error('Unsupported geometry type for split');
  }

  // Find bounding box
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const span = maxLng - minLng;
  const split1 = minLng + span / 3;
  const split2 = minLng + (2 * span) / 3;

  // Create 3 polygon slices (western, central, eastern)
  const zone1 = createRect(minLng, minLat, split1, maxLat);
  const zone2 = createRect(split1, minLat, split2, maxLat);
  const zone3 = createRect(split2, minLat, maxLng, maxLat);

  return [zone1, zone2, zone3];
}

function createRect(minLng, minLat, maxLng, maxLat) {
  return {
    type: "Polygon",
    coordinates: [[
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat]
    ]]
  };
}

module.exports = { splitPolygonIntoThreeZones };
