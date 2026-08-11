import uuid
import json
import re
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlmodel import Session, select, func
from typing import List
from app.database import get_session
from app.models import Customer, SubmissionBatch, Sample, AuditLog
from app.schemas import (
    SubmissionBatchCreate,
    SubmissionBatchWithSamples,
    SampleCreate,
    SampleRead,
    SampleBase
)
from app.services.export_service import ExportService

router = APIRouter()

@router.post("/", response_model=SubmissionBatchWithSamples, status_code=status.HTTP_201_CREATED)
def create_batch(batch_in: SubmissionBatchCreate, db: Session = Depends(get_session)):
    # 1. Resolve or auto-create customer
    customer_name = batch_in.customer_name.strip()
    if not customer_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer name cannot be empty"
        )
    
    statement = select(Customer).where(Customer.name == customer_name)
    customer = db.exec(statement).first()
    if not customer:
        customer = Customer(name=customer_name)
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # 2. Determine sequential batch number starting at 1000
    max_num = db.exec(select(func.max(SubmissionBatch.batch_number))).first()
    next_batch_num = 1000 if (max_num is None or max_num < 1000) else max_num + 1

    # 3. Create the submission batch (starts as draft 'pending' status)
    batch = SubmissionBatch(
        batch_number=next_batch_num,
        customer_id=customer.id, 
        customer_mac_no=batch_in.customer_mac_no,
        submitter_name=batch_in.submitter_name,
        status="pending"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # 3. Create the samples
    db_samples = []
    for idx, s in enumerate(batch_in.samples, start=1):
        db_sample = Sample(
            batch_id=batch.id,
            lab_sample_id=s.lab_sample_id or f"GK25069{40 + idx}",
            ag_sample_id=s.ag_sample_id or f"343686{idx:03d}002019016",
            variety=s.variety,
            assortment_code=s.assortment_code,
            series=s.series,
            country=s.country or "Deutschland",
            state_region=s.state_region,
            location_city=s.location_city,
            sowing_year=s.sowing_year,
            harvest_year=s.harvest_year,
            harvest_year_code=s.harvest_year_code,
            location_remark=s.location_remark,
            customer_notes=s.customer_notes,
            sedimentation_value_ml=s.sedimentation_value_ml,
            grain_hardness=s.grain_hardness,
            falling_number_sec=s.falling_number_sec,
            material_code=s.material_code,
            test_plan=s.test_plan or "Raw Materials NIR R Cereals",
            mac_code=s.mac_code or "11550",
            lab_customer_id=s.lab_customer_id or "61063",
            mac_no=s.mac_no,
            sample_description=s.sample_description or s.variety or "Sample",
            test_total_aa=s.test_total_aa,
            test_supp_aa=s.test_supp_aa,
            test_nir=s.test_nir,
            test_trp=s.test_trp,
            test_gaa=s.test_gaa,
            test_tdf=s.test_tdf,
            contact_person=s.contact_person
        )
        db.add(db_sample)
        db_samples.append(db_sample)
    
    db.commit()
    
    # 4. Log to Audit log
    audit = AuditLog(
        batch_id=batch.id,
        action="created",
        user_name="system",
        details={"sample_count": len(db_samples), "customer": customer.name}
    )
    db.add(audit)
    db.commit()

    # Refresh batch to load relationships
    db.refresh(batch)
    return batch

@router.get("/{batch_id}", response_model=SubmissionBatchWithSamples)
def read_batch(batch_id: uuid.UUID, db: Session = Depends(get_session)):
    batch = db.get(SubmissionBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission batch not found")
    return batch

@router.put("/{batch_id}", response_model=SubmissionBatchWithSamples)
def update_batch(batch_id: uuid.UUID, batch_in: SubmissionBatchCreate, db: Session = Depends(get_session)):
    batch = db.get(SubmissionBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission batch not found")
    
    if batch.status == "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a batch that has already been submitted to LIMS"
        )
        
    # 1. Update customer name if it changed
    customer_name = batch_in.customer_name.strip()
    statement = select(Customer).where(Customer.name == customer_name)
    customer = db.exec(statement).first()
    if not customer:
        customer = Customer(name=customer_name)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    
    batch.customer_id = customer.id
    batch.customer_mac_no = batch_in.customer_mac_no
    batch.submitter_name = batch_in.submitter_name
    db.add(batch)

    # 2. Delete old samples
    delete_statement = select(Sample).where(Sample.batch_id == batch.id)
    old_samples = db.exec(delete_statement).all()
    for s in old_samples:
        db.delete(s)
    
    # 3. Create new samples
    db_samples = []
    for s in batch_in.samples:
        db_sample = Sample(
            batch_id=batch.id,
            mac_no=s.mac_no,
            material_code=s.material_code,
            sample_description=s.sample_description,
            test_total_aa=s.test_total_aa,
            test_supp_aa=s.test_supp_aa,
            test_nir=s.test_nir,
            test_trp=s.test_trp,
            test_gaa=s.test_gaa,
            contact_person=s.contact_person
        )
        db.add(db_sample)
        db_samples.append(db_sample)
        
    db.commit()
    
    # 4. Log to Audit log
    audit = AuditLog(
        batch_id=batch.id,
        action="updated",
        user_name="system",
        details={"sample_count": len(db_samples), "customer": customer.name}
    )
    db.add(audit)
    db.commit()
    
    db.refresh(batch)
    return batch

@router.post("/{batch_id}/submit", response_model=SubmissionBatchWithSamples)
def submit_batch(batch_id: uuid.UUID, db: Session = Depends(get_session)):
    batch = db.get(SubmissionBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission batch not found")
        
    if batch.status == "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch has already been submitted"
        )
        
    # Enforce mandatory validation rules before final submission
    customer = db.get(Customer, batch.customer_id)
    if not customer or not customer.name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Submission requires a valid customer name"
        )
        
    if not batch.samples:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Submission batch cannot be empty. Please add at least 1 sample."
        )
        
    validation_errors = []
    for idx, sample in enumerate(batch.samples):
        try:
            # We run it through SampleBase validation (material_code check, description check, tests check)
            SampleBase(
                material_code=sample.material_code,
                sample_description=sample.sample_description,
                test_total_aa=sample.test_total_aa,
                test_supp_aa=sample.test_supp_aa,
                test_nir=sample.test_nir,
                test_trp=sample.test_trp,
                test_gaa=sample.test_gaa
            )
        except ValueError as val_err:
            validation_errors.append({
                "row_index": idx,
                "description": sample.sample_description,
                "errors": [str(e.get("msg") if isinstance(e, dict) else e) for e in val_err.errors()] if hasattr(val_err, "errors") else [str(val_err)]
            })

    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Validation failed for some samples.", "errors": validation_errors}
        )

    # All validations passed!
    # Update status and generate a printable QR manifest code containing manifest JSON payload
    batch.status = "submitted"
    
    # Manifest QR code stores the web link URL path for instant scanning & opening in browser
    batch.manifest_qr_code = f"/manifest/{batch.id}"
    db.add(batch)
    
    # Audit log
    audit = AuditLog(
        batch_id=batch.id,
        action="submitted",
        user_name="system",
        details={"samples_validated": len(batch.samples)}
    )
    db.add(audit)
    db.commit()
    db.refresh(batch)
    return batch

@router.get("/{batch_id}/export")
def export_batch_csv(batch_id: uuid.UUID, lang: str = "de", db: Session = Depends(get_session)):
    batch = db.get(SubmissionBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission batch not found")
        
    customer = db.get(Customer, batch.customer_id)
    
    csv_content = ExportService.generate_lims_csv(batch, customer, batch.samples, lang=lang)
    
    # Log the export action
    audit = AuditLog(
        batch_id=batch.id,
        action="exported",
        user_name="system",
        details={"export_format": "LIMS_CSV_22_COLUMNS", "language": lang}
    )
    db.add(audit)
    db.commit()
    
    # Format filename: DDMMYYYY + Customer Name + Number of Samples
    # Format date: DDMMYYYY
    date_str = batch.created_at.strftime("%d%m%Y")
    # Clean customer name (remove non-alphanumeric except underscores)
    raw_customer = customer.name if customer else "Customer"
    clean_customer = re.sub(r'[^a-zA-Z0-9]+', '', raw_customer) or "Customer"
    sample_count = len(batch.samples) if batch.samples else 0
    
    filename = f"{date_str}_{clean_customer}_{sample_count}samples_{lang}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
