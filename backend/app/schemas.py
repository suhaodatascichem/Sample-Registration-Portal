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
    SOYBEAN_MEAL = "SOYBEAN_MEAL"
    CORN = "CORN"
    WHEAT = "WHEAT"
    PREMIX = "PREMIX"
    RAW_MATERIAL = "RAW_MATERIAL"
    CANOLA_MEAL = "CANOLA_MEAL"
    PALM_KERNEL_MEAL = "PALM_KERNEL_MEAL"
    RICE_BRAN = "RICE_BRAN"
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
    "kitten": "PET",

    # SOYBEAN_MEAL synonyms
    "soybean meal": "SOYBEAN_MEAL",
    "soybean": "SOYBEAN_MEAL",
    "soy meal": "SOYBEAN_MEAL",
    "sbm": "SOYBEAN_MEAL",
    "soy": "SOYBEAN_MEAL",

    # CORN synonyms
    "corn": "CORN",
    "maize": "CORN",
    "corn meal": "CORN",
    "corn gluten": "CORN",
    "cgm": "CORN",

    # WHEAT synonyms
    "wheat": "WHEAT",
    "wheat bran": "WHEAT",
    "wheat midds": "WHEAT",

    # PREMIX synonyms
    "premix": "PREMIX",
    "vitamin": "PREMIX",
    "mineral premix": "PREMIX",
    "additive": "PREMIX",

    # RAW_MATERIAL synonyms
    "raw material": "RAW_MATERIAL",
    "ingredient": "RAW_MATERIAL",
    "feedstuff": "RAW_MATERIAL",

    # CANOLA_MEAL synonyms
    "canola": "CANOLA_MEAL",
    "canola meal": "CANOLA_MEAL",

    # PALM_KERNEL_MEAL synonyms
    "palm kernel": "PALM_KERNEL_MEAL",
    "palm kernel meal": "PALM_KERNEL_MEAL",
    "pkm": "PALM_KERNEL_MEAL",

    # RICE_BRAN synonyms
    "rice bran": "RICE_BRAN",
}

def normalize_material_code(value: Any) -> str:
    if not value or not isinstance(value, str):
        return "OTHER"
    
    clean_val = value.strip().lower()
    if not clean_val:
        return "OTHER"

    # Check exact match in synonyms
    if clean_val in SYNONYMS_MAP:
        return SYNONYMS_MAP[clean_val]
    
    # Check partial match (e.g. "soybean meal sample" -> SOYBEAN_MEAL, "pig feed" -> PIG)
    for synonym, standard in SYNONYMS_MAP.items():
        if synonym in clean_val:
            return standard
            
    # Try direct enum matching or clean uppercase formatting
    formatted_enum = clean_val.upper().replace(" ", "_")
    try:
        return MaterialCodeEnum(formatted_enum).value
    except ValueError:
        # Return cleaned uppercase representation for custom raw materials/types
        return formatted_enum

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
    # System & Auto-Generated Identifiers
    lab_sample_id: Optional[str] = None
    ag_sample_id: Optional[str] = None
    mac_no: Optional[str] = None
    
    # Customer Input Business Fields
    variety: Optional[str] = None                      # Sorte / Type
    assortment_code: Optional[str] = None             # Sortiment / Assortment
    series: Optional[str] = None                      # Serie / Series
    country: Optional[str] = "Germany"                 # Land / Country
    state_region: Optional[str] = None                # B-Land / Federal state
    location_city: Optional[str] = None               # Ort / City
    sowing_year: Optional[int] = None                  # Ansaatjahr / Year of sowing
    harvest_year: Optional[int] = None                 # Erntejahr / Harvest year
    harvest_year_code: Optional[str] = None            # NJ / NJ
    location_remark: Optional[str] = None              # Standort-Hinweis / Location remarks
    customer_notes: Optional[str] = None               # Notiz / Note
    
    # Lab / Measured Quality Metrics
    sedimentation_value_ml: Optional[float] = None     # Sedimentationswert (ml)
    grain_hardness: Optional[float] = None             # Korn-Härte (--)
    falling_number_sec: Optional[float] = None         # Fallzahl Korn (s)
    
    # System / LIMS Presets
    material_code: str = "RAW_MATERIAL"
    test_plan: Optional[str] = None
    mac_code: Optional[str] = "11550"
    lab_customer_id: Optional[str] = "61063"
    
    # Test flags & descriptions
    sample_description: str = "Sample"
    test_total_aa: bool = False
    test_supp_aa: bool = False
    test_nir: bool = False
    test_trp: bool = False
    test_gaa: bool = False
    test_tdf: bool = False
    contact_person: Optional[str] = None

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
            self.test_gaa,
            self.test_tdf
        ]
        # If variety or test_plan or grain quality metric is provided, auto-enable test_nir if no test flag is selected
        if not any(tests):
            if self.variety or self.sedimentation_value_ml is not None or self.grain_hardness is not None or self.falling_number_sec is not None:
                self.test_nir = True
            else:
                raise ValueError("At least one test must be requested (total_aa, supp_aa, nir, trp, gaa, tdf)")
        return self

class SampleCreate(SampleBase):
    pass

class SampleRead(SampleBase):
    id: uuid.UUID
    batch_id: uuid.UUID
    description: Optional[str] = None  # Derived Beschreibung / Description field
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Submission Batch Schemas
class SubmissionBatchBase(BaseModel):
    customer_id: uuid.UUID
    customer_mac_no: Optional[str] = None
    submitter_name: Optional[str] = None
    batch_number: Optional[int] = None

class SubmissionBatchCreate(BaseModel):
    customer_name: str
    customer_mac_no: Optional[str] = None
    submitter_name: Optional[str] = None
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
    mac_no: Optional[str] = Field(None, description="Customer machine / Mac number if mentioned")
    customer_name: Optional[str] = Field(None, description="Name of the customer / submitter if mentioned")
    variety: Optional[str] = Field(None, description="Crop variety / cultivar / Sorte (e.g. Axioma, Informer, KWS Emerick)")
    assortment_code: Optional[str] = Field(None, description="Sortiment / Assortment code if mentioned")
    series: Optional[str] = Field(None, description="Serie / Series code if mentioned")
    country: Optional[str] = Field(None, description="Land / Country of origin")
    state_region: Optional[str] = Field(None, description="B-Land / Federal state or region")
    location_city: Optional[str] = Field(None, description="Ort / City / Location name")
    sowing_year: Optional[int] = Field(None, description="Ansaatjahr / Year of sowing")
    harvest_year: Optional[int] = Field(None, description="Erntejahr / Year of harvest")
    harvest_year_code: Optional[str] = Field(None, description="NJ / Seasonal code")
    location_remark: Optional[str] = Field(None, description="Standort-Hinweis / Site remark")
    customer_notes: Optional[str] = Field(None, description="Notiz / General notes")
    sedimentation_value_ml: Optional[float] = Field(None, description="Sedimentationswert (ml)")
    grain_hardness: Optional[float] = Field(None, description="Korn-Härte (--)")
    falling_number_sec: Optional[float] = Field(None, description="Fallzahl Korn (s)")
    material_code: Optional[str] = Field(None, description="Material/animal type mentioned (e.g. WHEAT, BROILER, PIG, FISH, RUMINANT, PET, RMWHEA01)")
    sample_description: Optional[str] = Field(None, description="Short text describing the sample")
    test_total_aa: bool = Field(False, description="True if total amino acids test is requested")
    test_supp_aa: bool = Field(False, description="True if supplemental amino acids test is requested")
    test_nir: bool = Field(False, description="True if NIR, near infrared, or spectroscopy is requested")
    test_trp: bool = Field(False, description="True if tryptophan test is requested")
    test_gaa: bool = Field(False, description="True if GAA test is requested")
    test_tdf: bool = Field(False, description="True if TDF, total dietary fiber test is requested")
    contact_person: Optional[str] = Field(None, description="Lab contact person handling the sample (e.g. Sheila)")

class ExtractedBatch(BaseModel):
    customer_name: Optional[str] = Field(None, description="Common customer / submitter name for the batch")
    customer_mac_no: Optional[str] = Field(None, description="Customer Mac number for the batch")
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
