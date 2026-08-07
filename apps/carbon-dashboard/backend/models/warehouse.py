from sqlalchemy import Column, Integer, String, Float
from database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)

    warehouse_name = Column(String, nullable=False)

    city = Column(String)

    state = Column(String)

    country = Column(String)

    latitude = Column(Float)

    longitude = Column(Float)

    capacity = Column(Integer)

    current_utilization = Column(Integer)

    electricity_usage = Column(Float)

    renewable_energy_percent = Column(Float)

    carbon_score = Column(Float)

    manager = Column(String)

    status = Column(String)