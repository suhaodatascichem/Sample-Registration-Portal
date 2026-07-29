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
        batch.samples[0].test_gaa
    ])

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

def test_lims_csv_export():
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
            material_code="BROILER",
            sample_description="Sample 1",
            test_total_aa=True,
            test_nir=True
        ),
        Sample(
            id=uuid.uuid4(),
            batch_id=batch_id,
            material_code="PIG",
            sample_description="Sample 2",
            test_supp_aa=True,
            test_gaa=True
        )
    ]
    
    csv_str = ExportService.generate_lims_csv(batch, customer, samples)
    lines = csv_str.strip().split("\r\n") if "\r\n" in csv_str else csv_str.strip().split("\n")
    
    # Check headers
    assert lines[0] == "SampleID,BatchID,MacNo,CustomerName,MaterialCode,SampleDescription,Tests,ContactPerson,SubmittedAt"
    
    # Check rows
    row1 = lines[1].split(",")
    assert row1[1] == "1000"
    assert row1[3] == "Test Customer"
    assert row1[4] == "BROILER"
    assert row1[5] == "Sample 1"
    assert row1[6] == "TOTAL_AA|NIR"
    assert row1[8] == "2026-07-27T13:00:00Z"
    
    row2 = lines[2].split(",")
    assert row2[4] == "PIG"
    assert row2[6] == "SUPP_AA|GAA"
