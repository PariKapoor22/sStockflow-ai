from typing import Any, Literal
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversationId: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=4000)
    currentWorkspace: str | None = None
    selectedWarehouseId: str | None = None
    selectedSkuId: str | None = None


class Evidence(BaseModel):
    source: str
    asOf: str
    freshness: str
    correlationId: str


class ChatResponse(BaseModel):
    answer: str
    answerType: Literal["GROUNDED_EXPLANATION", "NO_DATA", "ERROR"]
    confidence: str = "UNKNOWN"
    toolsUsed: list[str] = []
    evidence: list[Evidence] = []
    suggestedActions: list[dict[str, Any]] = []
    warnings: list[str] = []
