package com.stockflow

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class StockFlowApplication

fun main(args: Array<String>) {
    runApplication<StockFlowApplication>(*args)
}
