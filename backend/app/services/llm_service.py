"""
LLM Validation Service - Gemini-powered 3-way matching and fraud detection
"""
import google.generativeai as genai
import json
from typing import Dict, Any
from app.config import config

class LLMValidationService:
    """
    Single LLM call performs:
    - 3-way matching (Invoice ↔ PO ↔ GRN)
    - Fraud detection (bank changes, duplicates, anomalies)
    - Risk scoring (0-100)
    - Recommendations (APPROVE/REVIEW/REJECT)
    
    Uses Gemini as primary, OpenAI as backup
    """
    
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')  # Fast and stable
        
    async def validate_invoice(
        self,
        invoice_data: Dict,
        po_data: Dict,
        grn_data: Dict,
        vendor_history: Dict,
        extraction_quality: float = 100.0
    ) -> Dict:
        """
        Complete validation in ONE LLM call
        
        Args:
            invoice_data: Extracted invoice fields (45 fields)
            po_data: Purchase order data
            grn_data: Goods receipt note data
            vendor_history: Vendor's historical data
        
        Returns:
            Complete validation result with matching, fraud, and recommendation
        """
        
        prompt = self._build_validation_prompt(
            invoice_data, po_data, grn_data, vendor_history, extraction_quality
        )
        
        try:
            # Generate using Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistency
                    top_p=0.8,
                    max_output_tokens=2048,
                )
            )
            
            # Parse JSON response
            result = self._parse_response(response.text)
            return result
            
        except Exception as e:
            print(f"❌ Gemini validation error: {str(e)}")
            # Fallback to OpenAI if Gemini fails
            return await self._fallback_openai_validation(
                invoice_data, po_data, grn_data, vendor_history, extraction_quality
            )
    
    def _build_validation_prompt(
        self, 
        invoice: Dict, 
        po: Dict, 
        grn: Dict, 
        vendor_history: Dict,
        extraction_quality: float = 100.0
    ) -> str:
        """Build comprehensive validation prompt"""
        
        return f"""You are an expert AP (Accounts Payable) auditor with 20 years of experience in invoice validation, fraud detection, and financial compliance.

Perform complete invoice validation analysis for the following invoice:

═══════════════════════════════════════════════════════
EXTRACTION QUALITY: {extraction_quality}%
═══════════════════════════════════════════════════════
(If quality < 70%, recommend NEEDS_REVIEW regardless of other scores)

═══════════════════════════════════════════════════════
INVOICE DATA (Extracted Fields):
═══════════════════════════════════════════════════════
{json.dumps(invoice, indent=2)}

═══════════════════════════════════════════════════════
PURCHASE ORDER DATA:
═══════════════════════════════════════════════════════
{json.dumps(po, indent=2)}

═══════════════════════════════════════════════════════
GOODS RECEIPT NOTE DATA:
═══════════════════════════════════════════════════════
{json.dumps(grn, indent=2)}

═══════════════════════════════════════════════════════
VENDOR HISTORY:
═══════════════════════════════════════════════════════
{json.dumps(vendor_history, indent=2)}

═══════════════════════════════════════════════════════
VALIDATION TASKS:
═══════════════════════════════════════════════════════

**Task 1: THREE-WAY MATCHING VALIDATION**

A) Invoice ↔ PO Comparison:
   - Vendor name: Check exact or fuzzy match (>85% similarity)
   - Amount: Check within 1% tolerance
   - Line items: Match descriptions (fuzzy) and quantities
   - Terms: Check payment terms consistency
   - Calculate match score: 0-100
   - List specific mismatches if any

B) Invoice ↔ GRN Comparison:
   - Quantities: Invoiced quantities must be ≤ received quantities
   - Delivery dates: Invoice date must be ≥ delivery date
   - Line items: Must correspond to received items
   - Calculate match score: 0-100
   - List specific mismatches if any

C) Overall Matching Status:
   - MATCH: Both scores > 90
   - PARTIAL: Both scores 70-90
   - MISMATCH: Any score < 70

**Task 2: FRAUD DETECTION ANALYSIS**

A) Bank Account Change:
   - Compare invoice bank details with vendor history
   - Flag if account number or routing number changed
   - Risk points: 40 if changed

B) Duplicate Invoice:
   - Check if invoice number exists in vendor history
   - Check for similar amounts in last 30 days
   - Risk points: 50 if duplicate

C) Amount Anomaly:
   - Compare invoice total to vendor average amount
   - Calculate deviation (e.g., 2x, 3x, 4x normal)
   - Risk points: 30 if > 2x average

D) Velocity Check:
   - Check number of invoices in last 24 hours
   - Risk points: 20 if > 3 invoices/day

E) Overall Risk Score: Sum of risk points (0-100)

**Task 3: RECOMMENDATION**

Based on match scores, risk score, and extraction quality:

REJECT (Hard Stops):
- Risk ≥ 70 (Critical fraud risk)
- Match < 50 (Major mismatch - not just tax/shipping variance)
- Duplicate invoice detected

NEEDS_REVIEW (Compliance & Risk Management):
- Extraction quality < 70% (Unreliable data)
- Invoice total > $50,000 (High-value threshold)
- Match score 50-84 (Partial match - needs human judgment)
- Risk score 40-69 (Medium risk)
- Bank account change detected
- Velocity alert (>5 invoices in 24h)
- Amount anomaly (>3x vendor average)
- First-time vendor (<3 invoices)

APPROVE (Auto-Approval):
- Extraction quality ≥ 80%
- Match score ≥ 85
- Risk score < 40
- All fraud checks passed

═══════════════════════════════════════════════════════
REQUIRED JSON RESPONSE FORMAT:
═══════════════════════════════════════════════════════

Respond ONLY with valid JSON in this exact format:

{{
  "matching": {{
    "invoice_po_score": <integer 0-100>,
    "invoice_po_status": "<MATCH|PARTIAL|MISMATCH>",
    "invoice_po_mismatches": [
      "List any specific mismatches found",
      "e.g., Vendor name: 'Acme Corp' vs 'Acme Corporation' (98% similar)",
      "e.g., Amount: $6480 vs $6500 (0.3% difference)"
    ],
    
    "invoice_grn_score": <integer 0-100>,
    "invoice_grn_status": "<MATCH|PARTIAL|MISMATCH>",
    "invoice_grn_mismatches": [
      "List any specific mismatches found",
      "e.g., Line 2: Invoiced 20 units, only 15 received"
    ],
    
    "overall_status": "<MATCH|PARTIAL|MISMATCH>",
    "overall_score": <integer 0-100>
  }},
  
  "fraud": {{
    "risk_score": <integer 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
    
    "signals": [
      {{
        "type": "BANK_CHANGE",
        "severity": "HIGH",
        "description": "Bank account changed from ****5678 to ****1234",
        "risk_points": 40
      }}
    ],
    
    "checks_performed": {{
      "bank_changed": <true|false>,
      "is_duplicate": <true|false>,
      "amount_anomaly": <true|false>,
      "velocity_issue": <true|false>
    }}
  }},
  
  "recommendation": "<APPROVE|NEEDS_REVIEW|REJECT>",
  
  "reasoning": "Detailed explanation of your analysis and conclusion",
  
  "summary": "One-sentence summary for UI display"
}}

═══════════════════════════════════════════════════════
IMPORTANT GUIDELINES:
═══════════════════════════════════════════════════════
- Use actual numbers from the data
- Be specific in mismatches (show actual values)
- Calculate scores mathematically
- Consider tolerance thresholds (1% for amounts, 85% for name matching)
- Provide clear, actionable reasoning
- Respond ONLY with valid JSON, no other text
"""
    
    def _parse_response(self, response_text: str) -> Dict:
        """Parse and validate LLM response"""
        try:
            # Try to extract JSON from response
            # Sometimes LLM includes markdown code blocks
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith('```'):
                text = text.split('```')[1]
                if text.startswith('json'):
                    text = text[4:]
                text = text.strip()
            
            result = json.loads(text)
            
            # Validate structure
            required_keys = ['matching', 'fraud', 'recommendation']
            if not all(key in result for key in required_keys):
                raise ValueError("Missing required keys in response")
            
            # Add risk_level if not present
            if 'risk_level' not in result['fraud']:
                risk_score = result['fraud']['risk_score']
                if risk_score < 30:
                    result['fraud']['risk_level'] = 'LOW'
                elif risk_score < 50:
                    result['fraud']['risk_level'] = 'MEDIUM'
                elif risk_score < 70:
                    result['fraud']['risk_level'] = 'HIGH'
                else:
                    result['fraud']['risk_level'] = 'CRITICAL'
            
            return result
            
        except Exception as e:
            print(f"❌ Parse error: {str(e)}")
            print(f"Response text: {response_text[:500]}")
            # Return a default safe response
            return self._default_validation_response()
    
    async def _fallback_openai_validation(
        self, 
        invoice_data: Dict, 
        po_data: Dict, 
        grn_data: Dict, 
        vendor_history: Dict,
        extraction_quality: float = 100.0
    ) -> Dict:
        """Fallback to OpenAI if Gemini fails"""
        try:
            from openai import OpenAI
            
            client = OpenAI(api_key=config.OPENAI_API_KEY)
            prompt = self._build_validation_prompt(
                invoice_data, po_data, grn_data, vendor_history, extraction_quality
            )
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AP auditor. Respond only with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=2048
            )
            
            result = self._parse_response(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"❌ OpenAI fallback error: {str(e)}")
            return self._default_validation_response()
    
    def _default_validation_response(self) -> Dict:
        """Return default response when validation fails"""
        return {
            "matching": {
                "invoice_po_score": 0,
                "invoice_po_status": "UNKNOWN",
                "invoice_po_mismatches": ["Validation service error"],
                "invoice_grn_score": 0,
                "invoice_grn_status": "UNKNOWN",
                "invoice_grn_mismatches": ["Validation service error"],
                "overall_status": "UNKNOWN",
                "overall_score": 0
            },
            "fraud": {
                "risk_score": 100,
                "risk_level": "CRITICAL",
                "signals": [
                    {
                        "type": "VALIDATION_ERROR",
                        "severity": "CRITICAL",
                        "description": "Automated validation failed - manual review required",
                        "risk_points": 100
                    }
                ],
                "checks_performed": {
                    "bank_changed": False,
                    "is_duplicate": False,
                    "amount_anomaly": False,
                    "velocity_issue": False
                }
            },
            "recommendation": "NEEDS_REVIEW",
            "reasoning": "Automated validation system encountered an error. This invoice requires manual review.",
            "summary": "Validation error - manual review required"
        }

