from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
required=[
 'apps/stockflow-web/package.json',
 'apps/stockflow-web/angular.json',
 'apps/stockflow-web/src/main.ts',
 'apps/stockflow-web/src/app/features/dashboard/dashboard.component.ts',
 'apps/stockflow-web/src/assets/mock/dashboard-overview.json',
 'services/stockflow-core-api/pom.xml',
 'services/stockflow-core-api/src/main/kotlin/com/stockflow/StockFlowApplication.kt',
 'services/forecasting-service/src/stockflow_forecasting/main.py',
 'services/optimisation-service/src/stockflow_optimisation/main.py',
 'mcp/stockflow_mcp/data_server.py',
 'mcp/stockflow_mcp/intelligence_server.py',
 'mcp/stockflow_mcp/action_server.py',
 'data/generator_config.yaml',
 'contracts/dashboard-api.openapi.yaml'
]
missing=[p for p in required if not (root/p).exists()]
json.loads((root/'apps/stockflow-web/src/assets/mock/dashboard-overview.json').read_text(encoding='utf-8'))
print(json.dumps({'valid':not missing,'missing':missing,'checked':len(required)},indent=2))
if missing: raise SystemExit(1)
