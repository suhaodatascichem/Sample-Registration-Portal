import pytest
from pydantic import ValidationError
from app.schemas import SampleBase, normalize_material_code
from app.services.export_service import ExportService
from app.models import Sample, SubmissionBatch, Customer
from datetime import datetime

def test_material_code_normalization():
    assert normalize_material_code("chicken") == "BROILER"
    assert normalize_material_code("piglet") == "PIG"
    assert normalize_material_code("fish feed") == "FISH"
    assert normalize_material_code("dairy cow") == "RUMINANT"
    assert normalize_material_code("cat") == "PET"
    assert normalize_material_code("soybean meal") == "SOYBEAN_MEAL"
    assert normalize_material_code("soybean") == "SOYBEAN_MEAL"
    assert normalize_material_code("corn meal") == "CORN"
    assert normalize_material_code("wheat") == "WHEAT"
    assert normalize_material_code("canola meal") == "CANOLA_MEAL"
    assert normalize_material_code("") == "OTHER"
    assert normalize_material_code(None) == "OTHER"

def test_mock_text_extraction_soybean_meal():
    from app.services.ai_service import AIService
    batch = AIService.extract_structured_data("2 soybean meal samples, descriptions and required tests")
    assert len(batch.samples) == 2
    assert batch.samples[0].material_code == "SOYBEAN_MEAL"
    assert batch.samples[1].material_code == "SOYBEAN_MEAL"
    assert any([
        batch.samples[0].test_total_aa,
        batch.samples[0].test_supp_aa,
        batch.samples[0].test_nir,
        batch.samples[0].test_trp,
        batch.samples[0].test_gaa,
        batch.samples[0].test_tdf
    ])

def test_tdf_extraction():
    from app.services.ai_service import AIService
    batch = AIService.extract_structured_data("3 wheat bran samples, test total dietary fiber (TDF)")
    assert len(batch.samples) == 3
    assert batch.samples[0].test_tdf is True

def test_sample_validation_success():
    # Valid sample with 1 test
    sample = SampleBase(
        material_code="broiler",
        sample_description="Chicken feed grower",
        test_nir=True
    )
    assert sample.material_code == "BROILER"
    assert sample.test_nir is True
    assert sample.test_total_aa is False

def test_sample_validation_fail_no_tests():
    # Missing tests
    with pytest.raises(ValueError, match="At least one test must be requested"):
        SampleBase(
            material_code="pig",
            sample_description="Pig starter feed",
            test_total_aa=False,
            test_nir=False
        )

def test_sample_validation_fail_empty_desc():
    # Empty description
    with pytest.raises(ValueError, match="Sample description cannot be empty"):
        SampleBase(
            material_code="fish",
            sample_description="",
            test_total_aa=True
        )

def test_lims_csv_export_22_columns():
    import uuid
    batch_id = uuid.uuid4()
    cust_id = uuid.uuid4()
    
    customer = Customer(id=cust_id, name="Test Customer")
    batch = SubmissionBatch(
        id=batch_id,
        batch_number=1000,
        customer_id=cust_id,
        status="submitted",
        created_at=datetime(2026, 7, 27, 13, 0, 0)
    )
    
    samples = [
        Sample(
            id=uuid.uuid4(),
            batch_id=batch_id,
            lab_sample_id="GK2506941",
            ag_sample_id="343686001002019016",
            variety="Axioma",
            assortment_code="43686",
            series="102",
            country="Deutschland",
            state_region="Bayern",
            location_city="Greimersdorf",
            sowing_year=2024,
            harvest_year=2025,
            sedimentation_value_ml=75,
            grain_hardness=63,
            falling_number_sec=458,
            material_code="RMWHEA01",
            test_plan="Raw Materials NIR R Cereals",
            mac_code="11550",
            lab_customer_id="61063"
        )
    ]
    
    # Test German Export
    csv_de = ExportService.generate_lims_csv(batch, customer, samples, lang="de")
    lines_de = csv_de.strip().split("\r\n") if "\r\n" in csv_de else csv_de.strip().split("\n")
    assert "Nr.;ProbenID Labor;ProbenID AG;Sorte;Sortiment;Serie;Land ;B-Land;Ort;Ansaatjahr;Erntejahr;NJ;Standort-Hinweis;Sedimentationswert (ml);Korn-Härte (--);Fallzahl Korn (s);Notiz;Beschreibung;Material;Testplan;MAC;Lab Customer" in lines_de[0]
    
    row1_de = lines_de[1].split(";")
    assert row1_de[0] == "1"
    assert row1_de[1] == "GK2506941"
    assert row1_de[2] == "343686001002019016"
    assert row1_de[3] == "Axioma"
    assert "Nr. 1, ProbenID Labor GK2506941, ProbenID AG 343686001002019016, Sorte Axioma" in row1_de[17]

    # Test English Export (matching appendix/translation.png)
    csv_en = ExportService.generate_lims_csv(batch, customer, samples, lang="en")
    lines_en = csv_en.strip().split("\r\n") if "\r\n" in csv_en else csv_en.strip().split("\n")
    assert "No;SampleID Lab;SampleID AG;Type;Assortment;Series;Country;Federal state;City;Year of sowing;Harvest year;NJ;Location remarks;Sedimentation value (ml);Grain hardness (--);Falling number grain (s);Note;Description;Material;Test plan;MAC;Lab Customer" in lines_en[0]
    
    row1_en = lines_en[1].split(";")
    assert row1_en[0] == "1"
    assert row1_en[3] == "Axioma"
    assert "No 1, SampleID Lab GK2506941, SampleID AG 343686001002019016, Type Axioma" in row1_en[17]

