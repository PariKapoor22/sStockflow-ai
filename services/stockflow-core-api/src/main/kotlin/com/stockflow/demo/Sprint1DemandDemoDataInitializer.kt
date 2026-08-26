package com.stockflow.demo

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.SqlParameterValue
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.nio.charset.StandardCharsets
import java.sql.Date
import java.sql.Timestamp
import java.sql.Types
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID
import kotlin.math.PI
import kotlin.math.roundToLong
import kotlin.math.sin

@Component
@Profile("sprint1")
@ConditionalOnProperty(
    prefix = "stockflow.demo-demand",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = true
)
class Sprint1DemandDemoDataInitializer(
    private val jdbc: JdbcTemplate
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    override fun run(args: ApplicationArguments) {
        val tenantId = "TEN-ACME-PHARMA"
        val existingRows = jdbc.queryForObject(
            "SELECT COUNT(*) FROM sales_history WHERE tenant_id = ?",
            Long::class.java,
            tenantId
        ) ?: 0L
        if (existingRows > 0) {
            logger.info("Sprint1 demand demo seed skipped because {} sales rows already exist", existingRows)
            return
        }

        val asOfDate = LocalDate.now().minusDays(1)
        seedCatalog(tenantId)
        seedRetailers(tenantId)
        seedInventory(tenantId, asOfDate)
        val salesRows = seedSalesHistory(tenantId, asOfDate, historyDays = 180)
        logger.info(
            "Seeded {} mock demand rows through {} for StatsForecast and the Demand Forecast workspace",
            salesRows,
            asOfDate
        )
    }

    private fun seedCatalog(tenantId: String) {
        val products = listOf(
            ProductSeed("PRD-AMOX", "Amoxicillin", "ANTIBIOTIC", "HIGH", false),
            ProductSeed("PRD-ORS", "Oral Rehydration Salts", "MEDICINE", "HIGH", false),
            ProductSeed("PRD-CET", "Cetirizine", "MEDICINE", "MEDIUM", false),
            ProductSeed("PRD-INS", "Insulin Glargine", "BIOLOGIC", "CRITICAL", true)
        )
        jdbc.batchUpdate(
            """MERGE INTO product (
                product_id, tenant_id, product_name, vertical, category, active,
                criticality, shelf_life_controlled, cold_chain_required, updated_at
            ) KEY(product_id) VALUES (?, ?, ?, 'PHARMA', ?, TRUE, ?, TRUE, ?, CURRENT_TIMESTAMP)""".trimIndent(),
            products.map { arrayOf<Any>(it.id, tenantId, it.name, it.category, it.criticality, it.coldChain) }
        )

        val skus = demoSkus.filter { it.productId != "PRD-PARA" }
        jdbc.batchUpdate(
            """MERGE INTO sku (
                sku_id, tenant_id, product_id, sku_name, base_uom, unit_cost,
                selling_price, currency, minimum_safety_stock, reorder_multiple,
                default_shelf_life_days, fefo_required, demand_profile, active,
                brand, pack_size, updated_at
            ) KEY(sku_id) VALUES (?, ?, ?, ?, 'UNIT', ?, ?, 'INR', ?, ?, ?, TRUE, ?, TRUE, ?, ?, CURRENT_TIMESTAMP)""".trimIndent(),
            skus.map {
                arrayOf<Any>(
                    it.id, tenantId, it.productId, it.name, it.unitCost, it.sellingPrice,
                    it.safetyStock, it.reorderMultiple, it.shelfLifeDays, it.demandProfile,
                    it.brand, it.packSize
                )
            }
        )
    }

    private fun seedRetailers(tenantId: String) {
        jdbc.batchUpdate(
            """MERGE INTO retailer (
                retailer_id, tenant_id, retailer_name, retailer_type, warehouse_id,
                city, region, credit_days, active, updated_at
            ) KEY(retailer_id) VALUES (?, ?, ?, 'HOSPITAL_NETWORK', ?, ?, 'SOUTH', 30, TRUE, CURRENT_TIMESTAMP)""".trimIndent(),
            demoWarehouses.map {
                arrayOf<Any>(it.retailerId, tenantId, it.retailerName, it.id, it.city)
            }
        )
    }

    private fun seedInventory(tenantId: String, snapshotDate: LocalDate) {
        val rows = demoWarehouses.flatMapIndexed { warehouseIndex, warehouse ->
            demoSkus.mapIndexed { skuIndex, sku ->
                val naturalKey = "$tenantId|$snapshotDate|${warehouse.id}|${sku.id}|DEMO"
                arrayOf<Any>(
                    stableUuid(naturalKey), Date.valueOf(snapshotDate), tenantId, warehouse.id, sku.id,
                    "DEMO-${warehouseIndex + 1}-${skuIndex + 1}",
                    Date.valueOf(snapshotDate.minusDays(120)),
                    Date.valueOf(snapshotDate.plusDays((sku.shelfLifeDays / 2).toLong())),
                    1800L + skuIndex * 420L + warehouseIndex * 175L,
                    80L + skuIndex * 10L,
                    0L,
                    sku.unitCost,
                    "INR",
                    if (sku.id == "SKU-INS-GLA-100") "COLD_2_8_C" else "AMBIENT",
                    Timestamp.valueOf(LocalDateTime.now().minusDays((warehouseIndex + skuIndex + 1).toLong()))
                )
            }
        }
        jdbc.batchUpdate(
            """MERGE INTO batch_inventory (
                batch_inventory_id, snapshot_date, tenant_id, warehouse_id, sku_id,
                batch_number, manufacture_date, expiry_date, available_quantity,
                reserved_quantity, blocked_quantity, unit_cost, currency,
                storage_condition_code, last_movement_at, updated_at
            ) KEY(batch_inventory_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""".trimIndent(),
            rows
        )
    }

    private fun seedSalesHistory(tenantId: String, asOfDate: LocalDate, historyDays: Int): Int {
        val startDate = asOfDate.minusDays(historyDays.toLong() - 1)
        val rows = mutableListOf<Array<Any>>()
        repeat(historyDays) { dayIndex ->
            val salesDate = startDate.plusDays(dayIndex.toLong())
            demoWarehouses.forEachIndexed { warehouseIndex, warehouse ->
                demoSkus.forEachIndexed { skuIndex, sku ->
                    val naturalKey = "$tenantId|$salesDate|${warehouse.id}|${warehouse.retailerId}|${sku.id}"
                    val ordered = demandQuantity(dayIndex, salesDate.dayOfWeek, warehouseIndex, skuIndex, sku)
                    val stockout = (dayIndex + warehouseIndex * 7 + skuIndex * 11) % 53 == 0
                    val lost = if (stockout) (ordered * 0.12).roundToLong().coerceAtLeast(1) else 0L
                    val fulfilled = (ordered - lost).coerceAtLeast(0)
                    val returned = if ((dayIndex + skuIndex) % 37 == 0) (fulfilled * 0.015).roundToLong() else 0L
                    rows += arrayOf<Any>(
                        stableUuid(naturalKey), Date.valueOf(salesDate), tenantId, warehouse.id,
                        warehouse.retailerId, sku.id, ordered, fulfilled, fulfilled, returned, lost,
                        sku.sellingPrice,
                        SqlParameterValue(
                            Types.VARCHAR,
                            if (dayIndex % 45 in 0..5) "DEMO-CAMPAIGN" else null
                        ),
                        stockout
                    )
                }
            }
        }
        val sql = """MERGE INTO sales_history (
            sales_history_id, sales_date, tenant_id, warehouse_id, retailer_id, sku_id,
            ordered_quantity, fulfilled_quantity, sales_quantity, return_quantity,
            lost_sales_quantity, unit_selling_price, promotion_id, stockout_flag, updated_at
        ) KEY(sales_history_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""".trimIndent()
        rows.chunked(500).forEach { jdbc.batchUpdate(sql, it) }
        return rows.size
    }

    private fun demandQuantity(
        dayIndex: Int,
        dayOfWeek: DayOfWeek,
        warehouseIndex: Int,
        skuIndex: Int,
        sku: SkuSeed
    ): Long {
        val warehouseFactor = listOf(1.00, 0.86, 0.74)[warehouseIndex]
        val weekdayFactor = when (dayOfWeek) {
            DayOfWeek.SATURDAY -> 0.90
            DayOfWeek.SUNDAY -> 0.76
            else -> 1.0
        }
        val weeklySeasonality = 1.0 + 0.11 * sin(2.0 * PI * dayIndex / 7.0 + skuIndex)
        val monthlySeasonality = 1.0 + 0.05 * sin(2.0 * PI * dayIndex / 30.0)
        val trend = dayIndex * sku.dailyTrend
        val campaignLift = if (dayIndex % 45 in 0..5) 1.16 else 1.0
        val monsoonLift = if (sku.id == "SKU-ORS-21" && dayIndex >= 135) 1.28 else 1.0
        val intermittentFactor = if (sku.id == "SKU-INS-GLA-100" && dayIndex % 11 == 0) 0.42 else 1.0
        return (sku.baseDemand * warehouseFactor * weekdayFactor * weeklySeasonality * monthlySeasonality *
            campaignLift * monsoonLift * intermittentFactor + trend).roundToLong().coerceAtLeast(1)
    }

    private fun stableUuid(value: String): UUID =
        UUID.nameUUIDFromBytes(value.toByteArray(StandardCharsets.UTF_8))

    private data class ProductSeed(
        val id: String,
        val name: String,
        val category: String,
        val criticality: String,
        val coldChain: Boolean
    )

    private data class WarehouseSeed(
        val id: String,
        val city: String,
        val retailerId: String,
        val retailerName: String
    )

    private data class SkuSeed(
        val id: String,
        val productId: String,
        val name: String,
        val unitCost: BigDecimal,
        val sellingPrice: BigDecimal,
        val safetyStock: Long,
        val reorderMultiple: Long,
        val shelfLifeDays: Int,
        val demandProfile: String,
        val brand: String,
        val packSize: String,
        val baseDemand: Double,
        val dailyTrend: Double
    )

    private companion object {
        val demoWarehouses = listOf(
            WarehouseSeed("WH-CHENNAI", "Chennai", "RET-DEMO-CHENNAI", "Chennai Care Network"),
            WarehouseSeed("WH-BENGALURU", "Bengaluru", "RET-DEMO-BENGALURU", "Bengaluru Health Network"),
            WarehouseSeed("WH-HYDERABAD", "Hyderabad", "RET-DEMO-HYDERABAD", "Hyderabad Medical Network")
        )

        val demoSkus = listOf(
            SkuSeed("SKU-PARA-650", "PRD-PARA", "Paracetamol 650mg Tablet", money("18.50"), money("25.00"), 500, 100, 730, "STABLE", "StockFlow Generics", "10 tablets", 118.0, 0.08),
            SkuSeed("SKU-AMOX-500", "PRD-AMOX", "Amoxicillin 500mg Capsule", money("62.00"), money("89.00"), 350, 50, 540, "ERRATIC", "MediCore", "10 capsules", 72.0, 0.04),
            SkuSeed("SKU-ORS-21", "PRD-ORS", "ORS Sachet 21g", money("13.00"), money("20.00"), 600, 100, 365, "SEASONAL", "HydraLife", "1 sachet", 55.0, 0.06),
            SkuSeed("SKU-CET-10", "PRD-CET", "Cetirizine 10mg Tablet", money("9.50"), money("15.00"), 300, 100, 730, "STABLE", "AllerFree", "10 tablets", 44.0, 0.03),
            SkuSeed("SKU-INS-GLA-100", "PRD-INS", "Insulin Glargine 100 IU/ml", money("515.00"), money("675.00"), 120, 20, 730, "INTERMITTENT", "GlucoSafe", "3ml cartridge", 22.0, 0.01)
        )

        fun money(value: String): BigDecimal = BigDecimal(value).setScale(4, RoundingMode.HALF_UP)
    }
}
