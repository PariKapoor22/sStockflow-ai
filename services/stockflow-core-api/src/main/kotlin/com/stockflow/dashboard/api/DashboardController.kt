package com.stockflow.dashboard.api

import com.stockflow.dashboard.application.DashboardOverviewService
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/dashboard")
class DashboardController(
    private val dashboardOverviewService: DashboardOverviewService
) {
    @GetMapping("/overview", produces = [MediaType.APPLICATION_JSON_VALUE])
    fun overview(): ResponseEntity<String> =
        ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(dashboardOverviewService.getOverviewJson())
}
