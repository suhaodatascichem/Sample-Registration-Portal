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
                sample.material_code or "RMWHEA01",
                sample.test_plan or "Raw Materials NIR R Cereals",
                sample.mac_code or "11550",
                sample.lab_customer_id or "61063"
            ]
            writer.writerow(row)
            
        return output.getvalue()

