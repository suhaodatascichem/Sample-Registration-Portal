import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column, JSON

class Customer(SQLModel, table=True):
    __tablename__ = "customers"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    batches: List["SubmissionBatch"] = Relationship(back_populates="customer")

class SubmissionBatch(SQLModel, table=True):
    __tablename__ = "submission_batches"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    batch_number: Optional[int] = Field(default=None, index=True)
    customer_id: uuid.UUID = Field(foreign_key="customers.id", index=True)
    customer_mac_no: Optional[str] = Field(default=None)
    submitter_name: Optional[str] = Field(default=None)
    status: str = Field(default="pending")  # pending, submitted
    manifest_qr_code: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    customer: Customer = Relationship(back_populates="batches")
    samples: List["Sample"] = Relationship(back_populates="batch", cascade_delete=True)

class Sample(SQLModel, table=True):
    __tablename__ = "samples"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    batch_id: uuid.UUID = Field(foreign_key="submission_batches.id", index=True)
    
    # System & Auto-Generated Identifiers
    lab_sample_id: Optional[str] = Field(default=None, index=True)   # ProbenID Labor / SampleID Lab (e.g. GK2506941)
    ag_sample_id: Optional[str] = Field(default=None, index=True)    # ProbenID AG / SampleID AG (Barcode ID)
    mac_no: Optional[str] = Field(default=None)
    
    # Customer Input Business Fields
    variety: Optional[str] = Field(default=None)                      # Sorte / Type
    assortment_code: Optional[str] = Field(default=None)             # Sortiment / Assortment
    series: Optional[str] = Field(default=None)                      # Serie / Series
    country: Optional[str] = Field(default="Deutschland")             # Land / Country
    state_region: Optional[str] = Field(default=None)                # B-Land / Federal state
    location_city: Optional[str] = Field(default=None)               # Ort / City
    sowing_year: Optional[int] = Field(default=None)                  # Ansaatjahr / Year of sowing
    harvest_year: Optional[int] = Field(default=None)                 # Erntejahr / Harvest year
    harvest_year_code: Optional[str] = Field(default=None)            # NJ / NJ
    location_remark: Optional[str] = Field(default=None)              # Standort-Hinweis / Location remarks
    customer_notes: Optional[str] = Field(default=None)               # Notiz / Note
    
    # Lab / Measured Quality Metrics (Optional from Customer)
    sedimentation_value_ml: Optional[float] = Field(default=None)     # Sedimentationswert (ml)
    grain_hardness: Optional[float] = Field(default=None)             # Korn-Härte (--)
    falling_number_sec: Optional[float] = Field(default=None)         # Fallzahl Korn (s)
    
    # System / LIMS Presets
    material_code: str = Field(default="RAW_MATERIAL")                 # Material (e.g. BROILER, SOYBEAN_MEAL, WHEAT, CORN)
    test_plan: Optional[str] = Field(default=None)                      # Dynamic Testplan / Test plan
    mac_code: Optional[str] = Field(default="11550")                   # MAC / MAC
    lab_customer_id: Optional[str] = Field(default="61063")           # Lab Customer
    
    # Test flags
    sample_description: str = Field(default="Sample")
    test_total_aa: bool = Field(default=False)
    test_supp_aa: bool = Field(default=False)
    test_nir: bool = Field(default=False)
    test_trp: bool = Field(default=False)
    test_gaa: bool = Field(default=False)
    test_tdf: bool = Field(default=False)
    contact_person: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    batch: SubmissionBatch = Relationship(back_populates="samples")

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    batch_id: uuid.UUID = Field(foreign_key="submission_batches.id", index=True)
    action: str  # created, updated, submitted, exported
    user_name: str = Field(default="system")
    details: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
