from sqlalchemy import Column, Integer, String, Float
from database import Base


class Fleet(Base):
    __tablename__ = "fleet"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_name = Column(String)
    vehicle_number = Column(String, unique=True)

    vehicle_type = Column(String)

    fuel_type = Column(String)

    capacity = Column(Float)

    mileage = Column(Float)

    emission_factor = Column(Float)

    driver_name = Column(String)

    status = Column(String)