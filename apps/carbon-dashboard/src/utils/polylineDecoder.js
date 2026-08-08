export function convertCoordinates(route){

return route.geometry.coordinates.map(point=>[
point[1],
point[0]
]);

}