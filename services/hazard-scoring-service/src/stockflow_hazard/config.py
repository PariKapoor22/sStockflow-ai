import os

class Settings:
    TENANT_ID: str = os.getenv("TENANT_ID", "TEN-ACME-PHARMA")
    DEFAULT_VALIDITY_HOURS: int = 6

settings = Settings()
