import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from enum import Enum

class MaterialCodeEnum(str, Enum):
    BROILER = "BROILER"
    PIG = "PIG"
    FISH = "FISH"
    RUMINANT = "RUMINANT"
    PET = "PET"
    OTHER = "OTHER"

SYNONYMS_MAP = {
    # BROILER synonyms
    "chicken": "BROILER",
    "chick": "BROILER",
    "broiler": "BROILER",
    "poultry": "BROILER",
    "avian": "BROILER",
    "feather": "BROILER",
    
    # PIG synonyms
    "pig": "PIG",
    "piglet": "PIG",
    "swine": "PIG",
    "hog": "PIG",
    "boar": "PIG",
    "sow": "PIG",
    "pork": "PIG",
    
    # FISH synonyms
    "fish": "FISH",
    "salmon": "FISH",
    "trout": "FISH",
    "shrimp": "FISH",
    "prawn": "FISH",
    "aqua": "FISH",
    "aquaculture": "FISH",
    
    # RUMINANT synonyms
    "cow": "RUMINANT",
    "cattle": "RUMINANT",
    "sheep": "RUMINANT",
    "goat": "RUMINANT",
    "ruminant": "RUMINANT",
    "steer": "RUMINANT",
    "calf": "RUMINANT",
    "heifer": "RUMINANT",
    "bovine": "RUMINANT",
    "dairy": "RUMINANT",
    "lamb": "RUMINANT",
    
    # PET synonyms
    "dog": "PET",
    "cat": "PET",
    "pet": "PET",
    "canine": "PET",
    "feline": "PET",
    "puppy": "PET",
    "kitten": "PET"
}

def normalize_material_code(value: Any) -> str:
    if not isinstance(value, str):
        return "OTHER"
    
    clean_val = value.strip().lower()
    # Check exact match in synonyms
    if clean_val in SYNONYMS_MAP:
        return SYNONYMS_MAP[clean_val]
    
    # Check partial match (e.g. "pig feed" -> PIG, "cow milk" -> RUMINANT)
    for synonym, standard in SYNONYMS_MAP.items():
        if synonym in clean_val:
            return standard
            
    # Try direct enum matching
    try:
        return MaterialCodeEnum(value.upper()).value
    except ValueError:
        return "OTHER"

# Base schemas
class CustomerBase(BaseModel):
    name: str

class CustomerCreate(CustomerBase):
    pass

class CustomerRead(CustomerBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Sample Validation & Schemas
class SampleBase(BaseModel):
    material_code: str
    sample_description: str
    test_total_aa: bool = False
    test_supp_aa: bool = False
    test_nir: bool = False
    test_trp: bool = False
    test_gaa: bool = False

    @field_validator("material_code", mode="before")
    @classmethod
    def validate_and_normalize_material_code(cls, v: Any) -> str:
        return normalize_material_code(v)

    @field_validator("sample_description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Sample description cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def validate_at_least_one_test(self) -> 'SampleBase':
        tests = [
            self.test_total_aa,
            self.test_supp_aa,
            self.test_nir,
            self.test_trp,
            self.test_gaa
        ]
        if not any(tests):
            raise ValueError("At least one test must be requested (total_aa, supp_aa, nir, trp, gaa)")
        return self

class SampleCreate(SampleBase):
    pass

class SampleRead(SampleBase):
    id: uuid.UUID
    batch_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Submission Batch Schemas
class SubmissionBatchBase(BaseModel):
    customer_id: uuid.UUID

class SubmissionBatchCreate(BaseModel):
    customer_name: str
    samples: List[SampleCreate]

class SubmissionBatchRead(SubmissionBatchBase):
    id: uuid.UUID
    status: str
    manifest_qr_code: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SubmissionBatchWithSamples(SubmissionBatchRead):
    customer: CustomerRead
    samples: List[SampleRead]
    model_config = ConfigDict(from_attributes=True)

# AI Extraction schemas
class ExtractedSample(BaseModel):
    customer_name: Optional[str] = Field(None, description="Name of the customer / submitter if mentioned")
    material_code: Optional[str] = Field(None, description="Material/animal type mentioned (e.g. broiler, pig, fish, ruminant, cow, dog, pet, other)")
    sample_description: Optional[str] = Field(None, description="Short text describing the sample")
    test_total_aa: bool = Field(False, description="True if total amino acids, amino acids, total AA, or similar test is requested")
    test_supp_aa: bool = Field(False, description="True if supplemental amino acids, free amino acids, supp AA, or similar is requested")
    test_nir: bool = Field(False, description="True if NIR, near infrared, or spectroscopy is requested")
    test_trp: bool = Field(False, description="True if tryptophan, Trp, or amino acid tryptophan is requested")
    test_gaa: bool = Field(False, description="True if GAA, guanidinoacetic acid, or similar is requested")

class ExtractedBatch(BaseModel):
    customer_name: Optional[str] = Field(None, description="Common customer / submitter name for the batch")
    samples: List[ExtractedSample] = Field(default_factory=list)

class TextInput(BaseModel):
    text: str

class AuditLogRead(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    action: str
    user_name: str
    details: Dict[str, Any]
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
