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
            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=[audio_part, "Transcribe this audio recording into clear text."]
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[audio_part, "Transcribe this audio recording into clear text."]
                )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini audio transcription failed: {e}")
            raise RuntimeError(f"Failed to transcribe audio with Gemini: {str(e)}")

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
                "1. RANGE & COUNT EXPANSION: If the text specifies multiple samples by count or ID range (e.g. '4 broiler grower samples... descriptions 1001 to 1004'), expand them into individual sample items (e.g. 1001, 1002, 1003, 1004).\n"
                "2. CUSTOMER / SUBMITTER: Extract company name and/or contact person (e.g., 'Japfa Indonesia (Sheila)').\n"
                "3. MATERIAL CODES: Standardize and map material/animal types to BROILER, PIG, FISH, RUMINANT, PET, or OTHER.\n"
                "4. TEST FLAGS: Identify requested tests and set boolean flags:\n"
                "   - test_total_aa (Total Amino Acids, total AA)\n"
                "   - test_supp_aa (Supplemental Amino Acids, free AA, supp AA)\n"
                "   - test_nir (NIR, near infrared)\n"
                "   - test_trp (Tryptophan, Trp)\n"
                "   - test_gaa (GAA, guanidinoacetic acid)\n"
                "5. Apply requested test flags across all corresponding samples."
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
            logger.error(f"Gemini structured extraction failed: {e}")
            raise RuntimeError(f"Failed to extract structured data with Gemini: {str(e)}")

    @classmethod
    def process_photo(cls, image_file_path: str) -> ExtractedBatch:
        client = cls._get_client()
        if not client:
            return cls._get_mock_photo_batch()

        try:
            with open(image_file_path, "rb") as image_file:
                image_bytes = image_file.read()

            ext = os.path.splitext(image_file_path)[1].lower()
            mime_type = "image/jpeg"
            if ext in [".png", ".webp"]:
                mime_type = f"image/{ext.replace('.', '')}"

            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

            system_prompt = (
                "You are a laboratory sample OCR and extraction assistant. You analyze images of sample intake sheets, handwritten manifests, or labels.\n"
                "Your task is to extract all samples listed in the image into structured data.\n"
                "Standardize material/animal codes to: BROILER, PIG, FISH, RUMINANT, PET, or OTHER.\n"
                "Identify requested tests:\n"
                "- test_total_aa (Total Amino Acids)\n"
                "- test_supp_aa (Supplemental Amino Acids)\n"
                "- test_nir (NIR)\n"
                "- test_trp (Tryptophan / Trp)\n"
                "- test_gaa (GAA)\n"
                "Ensure that you extract the Customer/Submitter Name if visible on the sheet."
            )

            try:
                response = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=[image_part, "Extract all samples and requested tests from this image. Standardize all fields according to schema requirements."],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractedBatch,
                        system_instruction=system_prompt,
                    ),
                )
            except Exception:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[image_part, "Extract all samples and requested tests from this image. Standardize all fields according to schema requirements."],
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
            logger.error(f"Gemini vision extraction failed: {e}")
            raise RuntimeError(f"Failed to process image with Gemini: {str(e)}")

    @staticmethod
    def _get_mock_batch_from_text(text: str) -> ExtractedBatch:
        # Very simple keyword checking mock parser
        samples = []
        if "japfa" in text.lower():
            customer_name = "Japfa Indonesia (Sheila)"
            return ExtractedBatch(
                customer_name=customer_name,
                samples=[
                    ExtractedSample(
                        customer_name=customer_name,
                        material_code="BROILER",
                        sample_description="Broiler grower feed 1001",
                        test_total_aa=True,
                        test_supp_aa=True,
                        test_trp=True
                    ),
                    ExtractedSample(
                        customer_name=customer_name,
                        material_code="BROILER",
                        sample_description="Broiler grower feed 1002",
                        test_total_aa=True,
                        test_supp_aa=True,
                        test_trp=True
                    ),
                    ExtractedSample(
                        customer_name=customer_name,
                        material_code="BROILER",
                        sample_description="Broiler grower feed 1003",
                        test_total_aa=True,
                        test_supp_aa=True,
                        test_trp=True
                    ),
                    ExtractedSample(
                        customer_name=customer_name,
                        material_code="BROILER",
                        sample_description="Broiler grower feed 1004",
                        test_total_aa=True,
                        test_supp_aa=True,
                        test_trp=True
                    ),
                ]
            )

        if "smith" in text.lower():
            customer_name = "Smith Farm"
        
        # Look for broiler / chicken
        if "broiler" in text.lower() or "chicken" in text.lower():
            samples.append(
                ExtractedSample(
                    customer_name=customer_name,
                    material_code="BROILER",
                    sample_description="Broiler grower feed finisher batch",
                    test_total_aa=True,
                    test_nir=True
                )
            )
        
        # Look for pig / swine
        if "pig" in text.lower() or "swine" in text.lower():
            samples.append(
                ExtractedSample(
                    customer_name=customer_name,
                    material_code="PIG",
                    sample_description="Piglet starter feed premium",
                    test_nir=True,
                    test_gaa=True
                )
            )

        if not samples:
            # Return a default list if nothing matches
            samples = [
                ExtractedSample(
                    customer_name=customer_name,
                    material_code="BROILER",
                    sample_description="Sample feed A - voice input mock",
                    test_total_aa=True
                ),
                ExtractedSample(
                    customer_name=customer_name,
                    material_code="RUMINANT",
                    sample_description="Silage sample B - voice input mock",
                    test_nir=True
                )
            ]

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
