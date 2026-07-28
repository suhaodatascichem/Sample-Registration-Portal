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
    mac_no: Optional[str] = Field(default=None)
    material_code: str  # Enum: BROILER, PIG, FISH, RUMINANT, PET, OTHER
    sample_description: str
    test_total_aa: bool = Field(default=False)
    test_supp_aa: bool = Field(default=False)
    test_nir: bool = Field(default=False)
    test_trp: bool = Field(default=False)
    test_gaa: bool = Field(default=False)
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
