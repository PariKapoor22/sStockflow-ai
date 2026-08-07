from sqlalchemy import Column, Integer, String, Float
from database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)

    warehouse = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    product_name = Column(String, nullable=False)

    available_quantity = Column(Integer, default=0)
    safety_stock = Column(Integer, default=0)
    forecast_7_days = Column(Integer, default=0)
    expiry_date = Column(String, nullable=True)

    days_cover = Column(Float, default=0)
    risk = Column(String, default="Low")
