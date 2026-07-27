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
    assert normalize_material_code("unknown item") == "OTHER"
    assert normalize_material_code("") == "OTHER"
    assert normalize_material_code(None) == "OTHER"

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
    lines = csv_str.strip().split("\r\n")
    
    # Check headers
    assert lines[0] == "SampleID,BatchID,CustomerName,MaterialCode,SampleDescription,Tests,SubmittedAt"
    
    # Check rows
    row1 = lines[1].split(",")
    assert row1[1] == str(batch_id)
    assert row1[2] == "Test Customer"
    assert row1[3] == "BROILER"
    assert row1[4] == "Sample 1"
    assert row1[5] == "TOTAL_AA|NIR"
    assert row1[6] == "2026-07-27T13:00:00Z"
    
    row2 = lines[2].split(",")
    assert row2[3] == "PIG"
    assert row2[5] == "SUPP_AA|GAA"
