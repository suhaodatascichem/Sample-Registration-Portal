import csv
import io
from datetime import datetime, timezone
from typing import List
from app.models import Sample, SubmissionBatch, Customer

class ExportService:
    @staticmethod
    def generate_lims_csv(batch: SubmissionBatch, customer: Customer, samples: List[Sample]) -> str:
        output = io.StringIO()
        writer = csv.writer(output, delimiter=",")
        
        # Write headers
        writer.writerow([
            "SampleID",
            "BatchID",
            "MacNo",
            "CustomerName",
            "MaterialCode",
            "SampleDescription",
            "Tests",
            "ContactPerson",
            "SubmittedAt"
        ])
        
        # Format the submitted timestamp to ISO-8601 UTC
        submitted_at_dt = batch.created_at
        if submitted_at_dt.tzinfo is None:
            submitted_at_dt = submitted_at_dt.replace(tzinfo=timezone.utc)
        submitted_at_iso = submitted_at_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Write sample rows
        for sample in samples:
            # Map active tests to LIMS test array
            tests_list = []
            if sample.test_total_aa:
                tests_list.append("TOTAL_AA")
            if sample.test_supp_aa:
                tests_list.append("SUPP_AA")
            if sample.test_nir:
                tests_list.append("NIR")
            if sample.test_trp:
                tests_list.append("TRP")
            if sample.test_gaa:
                tests_list.append("GAA")
            
            tests_str = "|".join(tests_list)
            
            writer.writerow([
                str(sample.id),
                str(batch.id),
                sample.mac_no or batch.customer_mac_no or "",
                customer.name,
                sample.material_code,
                sample.sample_description,
                tests_str,
                sample.contact_person or "Sheila",
                submitted_at_iso
            ])
            
        return output.getvalue()
