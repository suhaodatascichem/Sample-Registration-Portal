import csv
import io
from datetime import datetime, timezone
from typing import List, Optional, Any
from app.models import Sample, SubmissionBatch, Customer

GERMAN_HEADERS_22 = [
    "Nr.", "ProbenID Labor", "ProbenID AG", "Sorte", "Sortiment", "Serie",
    "Land ", "B-Land", "Ort", "Ansaatjahr", "Erntejahr", "NJ", 
    "Standort-Hinweis", "Sedimentationswert (ml)", "Korn-Härte (--)", 
    "Fallzahl Korn (s)", "Notiz", "Beschreibung", "Material", "Testplan", 
    "MAC", "Lab Customer"
]

ENGLISH_HEADERS_22 = [
    "No", "SampleID Lab", "SampleID AG", "Type", "Assortment", "Series",
    "Country", "Federal state", "City", "Year of sowing", "Harvest year", "NJ", 
    "Location remarks", "Sedimentation value (ml)", "Grain hardness (--)", 
    "Falling number grain (s)", "Note", "Description", "Material", "Test plan", 
    "MAC", "Lab Customer"
]

def _format_num(val: Optional[Any]) -> str:
    if val is None:
        return ""
    try:
        f_val = float(val)
        if f_val.is_integer():
            return str(int(f_val))
        return str(f_val)
    except (ValueError, TypeError):
        return str(val)

def resolve_test_plan(sample: Sample) -> str:
    """Dynamically resolves Testplan based on material type (Feed vs Raw Material) and requested tests.
    Rules:
    1. feed with requesting total AA --> complete feed wet chem total AA
    2. feed with requesting total AA + supp.AA --> complete feed wet chem
    3. raw material with requesting NIR --> raw material NIR
    4. raw material with requesting total AA --> raw material wet chem
    5. raw material with requesting total AA + NIR --> raw material wet chem + NIR
    """
    if sample.test_plan and sample.test_plan not in ["Raw Materials NIR R Cereals", "RAW_MATERIAL", ""]:
        return sample.test_plan

    mat_code = (sample.material_code or "").upper()
    
    # Classify material category: Feed vs Raw Material
    is_feed = mat_code in ["BROILER", "PIG", "FISH", "RUMINANT", "PET"] or any(k in mat_code.lower() for k in ["feed", "mash", "pellet", "starter", "grower", "finisher"])
    
    has_total_aa = bool(getattr(sample, "test_total_aa", False))
    has_supp_aa = bool(getattr(sample, "test_supp_aa", False))
    has_nir = bool(getattr(sample, "test_nir", False))

    if is_feed:
        if has_total_aa and has_supp_aa and has_nir:
            return "complete feed wet chem + NIR"
        elif has_total_aa and has_supp_aa:
            return "complete feed wet chem"
        elif has_total_aa and has_nir:
            return "complete feed wet chem total AA + NIR"
        elif has_total_aa:
            return "complete feed wet chem total AA"
        elif has_nir:
            return "complete feed NIR"
        else:
            return "complete feed wet chem"
    else:  # Raw Material (Soybean meal, Corn, Wheat, Canola, Grains, etc.)
        if has_total_aa and has_nir:
            return "raw material wet chem + NIR"
        elif has_total_aa:
            return "raw material wet chem"
        elif has_nir:
            return "raw material NIR"
        else:
            return "raw material NIR"

def resolve_material(sample: Sample) -> str:
    """Returns customer-recognized material code."""
    mat = (sample.material_code or "").strip()
    if mat and mat not in ["RAW_MATERIAL", "OTHER", "RMWHEA01"]:
        return mat
    if sample.variety:
        return "WHEAT"
    if sample.sample_description and sample.sample_description != "Sample":
        return sample.sample_description
    return mat or "RAW_MATERIAL"

class ExportService:
    @staticmethod
    def build_derived_description(sample: Sample, seq_nr: int, lang: str = "de") -> str:
        """Dynamically computes the derived description string from non-null sample metadata."""
        if lang == "en":
            parts = [
                f"No {seq_nr}",
                f"SampleID Lab {sample.lab_sample_id or ''}",
                f"SampleID AG {sample.ag_sample_id or ''}",
                f"Type {sample.variety or ''}"
            ]
            if sample.assortment_code:
                parts.append(f"Assortment {sample.assortment_code}")
            if sample.series:
                parts.append(f"Series {sample.series}")
            if sample.country:
                parts.append(f"Country {sample.country}")
            if sample.state_region:
                parts.append(f"Federal state {sample.state_region}")
            if sample.location_city:
                parts.append(f"City {sample.location_city}")
            if sample.sowing_year:
                parts.append(f"Year of sowing {sample.sowing_year}")
            if sample.harvest_year:
                parts.append(f"Harvest year {sample.harvest_year}")
            if sample.sedimentation_value_ml is not None:
                parts.append(f"Sedimentation value (ml) {_format_num(sample.sedimentation_value_ml)}")
            if sample.grain_hardness is not None:
                parts.append(f"Grain hardness (--) {_format_num(sample.grain_hardness)}")
            if sample.falling_number_sec is not None:
                parts.append(f"Falling number grain (s) {_format_num(sample.falling_number_sec)}")
        else: # Default German format matching Greimersdorf Weizen.CSV
            parts = [
                f"Nr. {seq_nr}",
                f"ProbenID Labor {sample.lab_sample_id or ''}",
                f"ProbenID AG {sample.ag_sample_id or ''}",
                f"Sorte {sample.variety or ''}"
            ]
            if sample.assortment_code:
                parts.append(f"Sortiment {sample.assortment_code}")
            if sample.series:
                parts.append(f"Serie {sample.series}")
            if sample.country:
                parts.append(f"Land  {sample.country}")
            if sample.state_region:
                parts.append(f"B-Land {sample.state_region}")
            if sample.location_city:
                parts.append(f"Ort {sample.location_city}")
            if sample.sowing_year:
                parts.append(f"Ansaatjahr {sample.sowing_year}")
            if sample.harvest_year:
                parts.append(f"Erntejahr {sample.harvest_year}")
            if sample.sedimentation_value_ml is not None:
                parts.append(f"Sedimentationswert (ml) {_format_num(sample.sedimentation_value_ml)}")
            if sample.grain_hardness is not None:
                parts.append(f"Korn-Härte (--) {_format_num(sample.grain_hardness)}")
            if sample.falling_number_sec is not None:
                parts.append(f"Fallzahl Korn (s) {_format_num(sample.falling_number_sec)}")
                
        return ", ".join(parts)

    @staticmethod
    def generate_lims_csv(batch: SubmissionBatch, customer: Customer, samples: List[Sample], lang: str = "de") -> str:
        """Generates 22-column semicolon-separated CSV matching Greimersdorf Weizen.CSV template."""
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        
        # Write headers
        headers = ENGLISH_HEADERS_22 if lang == "en" else GERMAN_HEADERS_22
        writer.writerow(headers)
        
        # Write sample rows
        for index, sample in enumerate(samples, start=1):
            derived_desc = ExportService.build_derived_description(sample, index, lang=lang)
            
            sed_val = _format_num(sample.sedimentation_value_ml)
            hardness_val = _format_num(sample.grain_hardness)
            fn_val = _format_num(sample.falling_number_sec)

            material_val = resolve_material(sample)
            test_plan_val = resolve_test_plan(sample)

            row = [
                str(index),
                sample.lab_sample_id or f"GK25069{40 + index}",
                sample.ag_sample_id or f"343686{index:03d}002019016",
                sample.variety or sample.sample_description or "",
                sample.assortment_code or "",
                sample.series or "",
                sample.country or "Deutschland",
                sample.state_region or "",
                sample.location_city or "",
                str(sample.sowing_year) if sample.sowing_year else "",
                str(sample.harvest_year) if sample.harvest_year else "",
                sample.harvest_year_code or "",
                sample.location_remark or "",
                sed_val,
                hardness_val,
                fn_val,
                sample.customer_notes or "",
                derived_desc,
                material_val,
                test_plan_val,
                sample.mac_code or "11550",
                sample.lab_customer_id or "61063"
            ]
            writer.writerow(row)
            
        return output.getvalue()

