import os
import base64
import logging
from typing import Optional, List
from openai import OpenAI
from app.config import settings
from app.schemas import ExtractedBatch, ExtractedSample

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def _get_client() -> Optional[OpenAI]:
        # Try to read key from config or environment variable
        api_key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY is not configured. Running in Mock Mode.")
            return None
        return OpenAI(api_key=api_key)

    @classmethod
    def transcribe_audio(cls, audio_file_path: str) -> str:
        client = cls._get_client()
        if not client:
            # Mock transcription
            return "This is a mock transcription: Please register broiler chicken feed samples for Smith Farm. We need Total Amino Acids and NIR tests. Also, swine feed for piglet sample, test for NIR and GAA."

        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
                return transcript.text
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            raise RuntimeError(f"Failed to transcribe audio: {str(e)}")

    @classmethod
    def extract_structured_data(cls, text: str) -> ExtractedBatch:
        client = cls._get_client()
        if not client:
            # Return mock parsed batch based on keywords or default values
            return cls._get_mock_batch_from_text(text)

        try:
            system_prompt = (
                "You are an expert laboratory sample intake AI assistant.\n"
                "Your job is to parse spoken voice transcripts or notes and extract lab samples in a structured JSON schema.\n"
                "Standardize and map the material/animal codes to BROILER, PIG, FISH, RUMINANT, PET, or OTHER.\n"
                "For requested tests, check the boolean flags:\n"
                "- test_total_aa (Total Amino Acids, total AA, amino acids)\n"
                "- test_supp_aa (Supplemental Amino Acids, free amino acids, supp AA)\n"
                "- test_nir (NIR, near infrared, spectroscopy)\n"
                "- test_trp (Tryptophan, Trp)\n"
                "- test_gaa (GAA, guanidinoacetic acid)\n"
                "Ensure that at least one test is set to True per sample if any test was mentioned."
            )
            
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Please extract sample details from this text:\n\n{text}"}
                ],
                response_format=ExtractedBatch,
            )
            return completion.choices[0].message.parsed
        except Exception as e:
            logger.error(f"LLM Structured extraction failed: {e}")
            raise RuntimeError(f"Failed to extract structured data: {str(e)}")

    @classmethod
    def process_photo(cls, image_file_path: str) -> ExtractedBatch:
        client = cls._get_client()
        if not client:
            # Return mock parsed batch for demo purposes
            return cls._get_mock_photo_batch()

        try:
            # Read and base64 encode the image
            with open(image_file_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode("utf-8")

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

            completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Extract all samples and requested tests from this image. Standardize all fields according to schema requirements."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                response_format=ExtractedBatch,
            )
            return completion.choices[0].message.parsed
        except Exception as e:
            logger.error(f"LLM vision extraction failed: {e}")
            raise RuntimeError(f"Failed to process image with AI: {str(e)}")

    @staticmethod
    def _get_mock_batch_from_text(text: str) -> ExtractedBatch:
        # Very simple keyword checking mock parser
        samples = []
        customer_name = "Global Feeds Corp"
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
