package com.stockflow.district

import tools.jackson.databind.JsonNode

data class DistrictFeatureCollection(
    val type: String = "FeatureCollection",
    val features: List<DistrictFeature>
)

data class DistrictFeature(
    val type: String = "Feature",
    val geometry: JsonNode,
    val properties: DistrictProperties
)

data class DistrictProperties(
    val districtId: String,
    val name: String,
    val status: String,
    val provenance: DistrictProvenance
)

data class DistrictProvenance(
    val source: String,
    val extractedAt: String,
    val validUntil: String,
    val confidenceScore: Double,
    val classification: String
)
