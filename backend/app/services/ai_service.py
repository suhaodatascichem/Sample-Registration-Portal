import os
import base64
import logging
from typing import Optional, List
from google import genai
from google.genai import types
from app.config import settings
from app.schemas import ExtractedBatch, ExtractedSample

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def _get_client() -> Optional[genai.Client]:
        # Try to read Google Gemini key from config or environment variables
        api_key = (
            settings.gemini_api_key or 
            settings.google_api_key or 
            os.environ.get("GEMINI_API_KEY") or 
            os.environ.get("GOOGLE_API_KEY") or
            settings.openai_api_key or
            os.environ.get("OPENAI_API_KEY")
        )
        if not api_key:
            logger.warning("GEMINI_API_KEY / GOOGLE_API_KEY is not configured. Running in Mock Mode.")
            return None
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize Google GenAI client: {e}")
            return None

    @classmethod
    def transcribe_audio(cls, audio_file_path: str) -> str:
        client = cls._get_client()
        if not client:
            return "This is a mock transcription: Please register broiler chicken feed samples for Smith Farm. We need Total Amino Acids and NIR tests."

        try:
            with open(audio_file_path, "rb") as audio_file:
                audio_bytes = audio_file.read()

            ext = os.path.splitext(audio_file_path)[1].lower()
            mime_type = "audio/webm"
            if ext in [".wav", ".mp3", ".m4a", ".ogg"]:
                mime_type = f"audio/{ext.replace('.', '')}"

            audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
            transcription_prompt = (
                "Listen to this audio recording (which may be spoken in any language, e.g. English, Bahasa Indonesia, Chinese, Spanish, Vietnamese, Thai, Malay, etc.). "
                "Transcribe and translate/format it into clean, tidy, structured English sample intake notes suitable for a laboratory sample intake log. "
                "Organize customer names, sample descriptions, material types (e.g. soybean meal, broiler feed, corn, wheat), sample counts, and requested tests (e.g. Total AA, NIR, Supp AA, Trp, GAA) into clear, readable sentences."
            )
            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=[audio_part, transcription_prompt]
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[audio_part, transcription_prompt]
                )
            return response.text or ""
        except Exception as e:
            logger.warning(f"Gemini audio transcription failed ({e}). Falling back to offline mock transcript.")
            return "Customer: Japfa Indonesia\nRequest: 2 soybean meal samples\nTests: Total Amino Acids and NIR tests"

    @classmethod
    def extract_structured_data(cls, text: str) -> ExtractedBatch:
        client = cls._get_client()
        if not client:
            return cls._get_mock_batch_from_text(text)

        try:
            system_prompt = (
                "You are an expert laboratory sample intake AI assistant.\n"
                "Your job is to parse text notes, emails, or voice transcripts and extract lab samples into a structured JSON schema.\n"
                "Guidelines:\n"
                "1. RANGE & COUNT EXPANSION: If the text specifies multiple samples by count or ID range (e.g. '4 broiler grower samples... descriptions 1001 to 1004', '2 soybean meal samples'), expand them into individual sample items.\n"
                "2. CUSTOMER / SUBMITTER: Extract company name and/or contact person (e.g., 'Japfa Indonesia (Sheila)').\n"
                "3. MATERIAL CODES: Standardize and map material types to BROILER, PIG, FISH, RUMINANT, PET, SOYBEAN_MEAL, CORN, WHEAT, PREMIX, RAW_MATERIAL, or standard UPPERCASE material code (e.g. CANOLA_MEAL).\n"
                "4. TEST FLAGS: Identify requested tests and set boolean flags:\n"
                "   - test_total_aa (Total Amino Acids, total AA)\n"
                "   - test_supp_aa (Supplemental Amino Acids, free AA, supp AA)\n"
                "   - test_nir (NIR, near infrared)\n"
                "   - test_trp (Tryptophan, Trp)\n"
                "   - test_gaa (GAA, guanidinoacetic acid)\n"
                "   - test_tdf (Total Dietary Fiber, TDF, dietary fiber)\n"
                "5. Apply requested test flags across all corresponding samples. If no specific tests are explicitly named or generic terms like 'required tests' or 'all tests' are mentioned, set test_total_aa and test_nir to true so that at least one test is active."
            )

            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=f"Please extract sample details from this text:\n\n{text}",
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractedBatch,
                        system_instruction=system_prompt,
                    ),
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=f"Please extract sample details from this text:\n\n{text}",
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractedBatch,
                        system_instruction=system_prompt,
                    ),
                )

            if response.parsed:
                return response.parsed
            return ExtractedBatch.model_validate_json(response.text)
        except Exception as e:
            logger.warning(f"Gemini structured extraction failed ({e}). Falling back to local smart parser.")
            return cls._get_mock_batch_from_text(text)

    @classmethod
    def process_photo_to_text(cls, image_file_path: str) -> str:
        client = cls._get_client()
        ext = os.path.splitext(image_file_path)[1].lower()
        if not client:
            if ext == ".pdf":
                return "Customer: Global Nutrition Corp (PDF Invoice #8942)\nSample 1: Soybean meal Lot A-101 - test Total AA, NIR\nSample 2: Corn meal Lot A-102 - test Total AA, Supp AA\nSample 3: Broiler feed finisher - test NIR, TRP, TDF"
            return "Customer: Agri-Nutrition Labs\nSample 1: Broiler starter mash #001 - test Total AA, NIR, and TRP\nSample 2: Aquaculture shrimp feed #002 - test Supp AA and TDF\nSample 3: Alfalfa hay batch B - test NIR and TDF"

        try:
            with open(image_file_path, "rb") as image_file:
                image_bytes = image_file.read()

            mime_type = "image/jpeg"
            if ext == ".pdf":
                mime_type = "application/pdf"
            elif ext in [".png", ".webp"]:
                mime_type = f"image/{ext.replace('.', '')}"

            doc_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

            system_prompt = (
                "You are an expert document OCR and laboratory manifest digitizer.\n"
                "Analyze the uploaded document or image (which may be a multi-page PDF, printed sheet, or photo).\n"
                "CRITICAL EXTRACTION RULES:\n"
                "1. NO SHIPMENT NOISE: DO NOT include general logistics info (such as DHL/FedEx waybill numbers, package weight, courier details, or origin addresses). Omit these completely.\n"
                "2. KEEP CUSTOMER INFO: Always extract and clearly list the Customer / Company Name and primary contact person.\n"
                "3. LIST SAMPLES: Clearly list all sample IDs, sample codes, treatment numbers (e.g. T-1 to T-11), material types, and sample descriptions.\n"
                "4. STRICT TEST DETECTION (NO GUESSING): Extract requested analytical tests ONLY if explicitly written in the document. If NO specific tests (e.g. Total AA, Supp AA, NIR, TRP, GAA, TDF) are explicitly specified, DO NOT guess or assume test panels. Instead, explicitly output: 'Requested Analysis: Not found in document - please specify tests manually.'"
            )

            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=[doc_part, system_prompt]
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[doc_part, system_prompt]
                )

            return response.text or ""
        except Exception as e:
            logger.warning(f"Gemini document vision OCR failed ({e}). Falling back to local mock text.")
            if ext == ".pdf":
                return "Customer: Global Nutrition Corp (PDF Invoice #8942)\nSample 1: Soybean meal Lot A-101 - test Total AA, NIR\nSample 2: Corn meal Lot A-102 - test Total AA, Supp AA\nSample 3: Broiler feed finisher - test NIR, TRP, TDF"
            return "Customer: Agri-Nutrition Labs\nSample 1: Broiler starter mash #001 - test Total AA, NIR, and TRP\nSample 2: Aquaculture shrimp feed #002 - test Supp AA and TDF\nSample 3: Alfalfa hay batch B - test NIR and TDF"

    @classmethod
    def process_photo(cls, image_file_path: str) -> ExtractedBatch:
        client = cls._get_client()
        ext = os.path.splitext(image_file_path)[1].lower()
        if not client:
            return cls._get_mock_photo_batch()

        try:
            with open(image_file_path, "rb") as image_file:
                image_bytes = image_file.read()

            mime_type = "image/jpeg"
            if ext == ".pdf":
                mime_type = "application/pdf"
            elif ext in [".png", ".webp"]:
                mime_type = f"image/{ext.replace('.', '')}"

            doc_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

            system_prompt = (
                "You are a laboratory sample OCR and document extraction assistant. You analyze documents (multi-page PDFs or images) of sample intake sheets, invoices, or manifests.\n"
                "Search across all pages in multi-page documents to locate the page with sample and test details. Ignore non-sample pages.\n"
                "Your task is to extract all samples listed in the document into structured data.\n"
                "Standardize material codes to: BROILER, PIG, FISH, RUMINANT, PET, SOYBEAN_MEAL, CORN, WHEAT, PREMIX, RAW_MATERIAL, or standard UPPERCASE material code.\n"
                "Identify requested tests:\n"
                "- test_total_aa (Total Amino Acids)\n"
                "- test_supp_aa (Supplemental Amino Acids)\n"
                "- test_nir (NIR)\n"
                "- test_trp (Tryptophan / Trp)\n"
                "- test_gaa (GAA)\n"
                "- test_tdf (Total Dietary Fiber / TDF)\n"
                "Ensure that you extract the Customer/Submitter Name if visible on the sheet."
            )

            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=[doc_part, "Extract all samples and requested tests from this document. Standardize all fields according to schema requirements."],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractedBatch,
                        system_instruction=system_prompt,
                    ),
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[doc_part, "Extract all samples and requested tests from this document. Standardize all fields according to schema requirements."],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractedBatch,
                        system_instruction=system_prompt,
                    ),
                )

            if response.parsed:
                return response.parsed
            return ExtractedBatch.model_validate_json(response.text)
        except Exception as e:
            logger.warning(f"Gemini vision extraction failed ({e}). Falling back to local smart photo batch.")
            return cls._get_mock_photo_batch()

    @staticmethod
    def _get_mock_batch_from_text(text: str) -> ExtractedBatch:
        import re
        from app.schemas import normalize_material_code

        lowered = text.lower()
        customer_name = "Agri-Nutrition Labs"
        if "japfa" in lowered:
            customer_name = "Japfa Indonesia (Sheila)"
        elif "smith" in lowered:
            customer_name = "Smith Farm"

        # Check variety
        variety_match = re.search(r'variety\s+([a-zA-Z0-9_\s]+?)(?:,|\.|$|\s+series|\s+location)', lowered) or re.search(r'sorte\s+([a-zA-Z0-9_\s]+?)(?:,|\.|$)', lowered)
        variety = variety_match.group(1).strip().title() if variety_match else None

        # Check series
        series_match = re.search(r'series\s+([a-zA-Z0-9_]+)', lowered) or re.search(r'serie\s+([a-zA-Z0-9_]+)', lowered)
        series = series_match.group(1).strip() if series_match else None

        # Check location
        location_match = re.search(r'location\s+([a-zA-Z0-9_\s]+?)(?:,|\.|$)', lowered) or re.search(r'ort\s+([a-zA-Z0-9_\s]+?)(?:,|\.|$)', lowered)
        location_city = location_match.group(1).strip().title() if location_match else None

        # Check harvest year
        year_match = re.search(r'(?:harvest\s+year|erntejahr)\s+(\d{4})', lowered) or re.search(r'\b(202\d)\b', lowered)
        harvest_year = int(year_match.group(1)) if year_match else None

        # Check count of samples
        count_match = re.search(r'(\d+)\s+([a-zA-Z0-9_\s]+?)\s+samples?', lowered)
        if count_match:
            count = int(count_match.group(1))
            mat_raw = count_match.group(2).strip()
            material_code = normalize_material_code(mat_raw)
        else:
            # Fallback count parsing
            num_match = re.search(r'(\d+)', lowered)
            count = int(num_match.group(1)) if num_match else 2
            material_code = normalize_material_code(text)

        # Detect tests requested
        test_total_aa = any(k in lowered for k in ["total aa", "amino acid", "total amino", "aa"])
        test_supp_aa = any(k in lowered for k in ["supp aa", "free aa", "supplemental"])
        test_nir = "nir" in lowered or "near infrared" in lowered
        test_trp = "trp" in lowered or "tryptophan" in lowered
        test_gaa = "gaa" in lowered or "guanidino" in lowered
        test_tdf = "tdf" in lowered or "dietary fiber" in lowered or "fiber" in lowered

        # Default tests if none explicitly named or generic "required tests" specified
        if not any([test_total_aa, test_supp_aa, test_nir, test_trp, test_gaa, test_tdf]) or "required test" in lowered:
            test_total_aa = True
            test_nir = True

        mat_display = material_code.replace("_", " ").title()
        samples = []
        for i in range(1, count + 1):
            sample_desc = f"{variety} sample #{i:03d}" if variety else f"{mat_display} sample #{i:03d}"
            samples.append(
                ExtractedSample(
                    customer_name=customer_name,
                    material_code=material_code,
                    variety=variety,
                    series=series,
                    location_city=location_city,
                    harvest_year=harvest_year,
                    sample_description=sample_desc,
                    test_total_aa=test_total_aa,
                    test_supp_aa=test_supp_aa,
                    test_nir=test_nir,
                    test_trp=test_trp,
                    test_gaa=test_gaa,
                    test_tdf=test_tdf,
                )
            )

        return ExtractedBatch(customer_name=customer_name, samples=samples)

    @staticmethod
    def _get_mock_photo_batch() -> ExtractedBatch:
        return ExtractedBatch(
            customer_name="Agri-Nutriton Labs",
            samples=[
                ExtractedSample(
                    customer_name="Agri-Nutriton Labs",
                    material_code="BROILER",
                    sample_description="Broiler starter mash #001 (Photo Scan Mock)",
                    test_total_aa=True,
                    test_nir=True,
                    test_trp=True
                ),
                ExtractedSample(
                    customer_name="Agri-Nutriton Labs",
                    material_code="FISH",
                    sample_description="Aquaculture shrimp feed #002 (Photo Scan Mock)",
                    test_supp_aa=True,
                    test_nir=True
                ),
                ExtractedSample(
                    customer_name="Agri-Nutriton Labs",
                    material_code="RUMINANT",
                    sample_description="Alfalfa hay batch B (Photo Scan Mock)",
                    test_nir=True
                )
            ]
        )
