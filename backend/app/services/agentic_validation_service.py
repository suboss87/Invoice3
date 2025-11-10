"""
Agentic validation service powered by LangGraph + Gemini

Two agents:
1. Matching agent focuses on invoice ↔ PO ↔ GRN alignment.
2. Fraud agent evaluates vendor risk signals & recommends action.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, TypedDict

import google.generativeai as genai
from langgraph.graph import START, END, StateGraph

from app.config import config


class ValidationState(TypedDict, total=False):
    extraction: Dict[str, Any]
    po: Dict[str, Any]
    grn: Dict[str, Any]
    vendor: Dict[str, Any]
    extraction_quality: float
    matching: Dict[str, Any]
    fraud: Dict[str, Any]
    insights: List[Dict[str, Any]]


class AgenticValidationService:
    """Runs the two-agent validation flow inside a LangGraph workflow."""

    def __init__(self):
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

        workflow = StateGraph(ValidationState)
        workflow.add_node("match_agent", self._match_agent)
        workflow.add_node("fraud_agent", self._fraud_agent)
        workflow.add_edge(START, "match_agent")
        workflow.add_edge("match_agent", "fraud_agent")
        workflow.add_edge("fraud_agent", END)
        self.graph = workflow.compile()

    async def validate_invoice(
        self,
        extraction: Dict[str, Any],
        po: Dict[str, Any],
        grn: Dict[str, Any],
        vendor: Dict[str, Any],
        extraction_quality: float = 100.0
    ) -> Dict[str, Any]:
        """
        Validate invoice using LangGraph workflow.

        Returns:
            Dict containing matching, fraud, recommendation, reasoning, summary, insights.
        """
        initial_state: ValidationState = {
            "extraction": extraction,
            "po": po,
            "grn": grn,
            "vendor": vendor,
            "extraction_quality": extraction_quality,
            "insights": []
        }

        # langgraph workflow is synchronous; offload to thread pool
        final_state = await asyncio.to_thread(self.graph.invoke, initial_state)

        matching = final_state.get("matching", {})
        fraud = final_state.get("fraud", {})
        insights = final_state.get("insights", [])

        recommendation = self._determine_recommendation(
            matching, fraud, extraction_quality
        )
        reasoning = self._build_reasoning(matching, fraud, insights, extraction_quality)
        summary = self._build_summary(matching, fraud, recommendation)

        return {
            "matching": matching,
            "fraud": fraud,
            "recommendation": recommendation,
            "reasoning": reasoning,
            "summary": summary,
            "insights": insights
        }

    # --------------------------------------------------------------------- #
    # LangGraph nodes
    # --------------------------------------------------------------------- #

    def _match_agent(self, state: ValidationState) -> ValidationState:
        """LangGraph node that performs 3-way matching via Gemini."""
        prompt = f"""
You are MatchAgent, an expert AP auditor.
Compare the Invoice fields with Purchase Order and Goods Receipt data.

Return ONLY JSON with this schema:
{{
  "matching": {{
    "invoice_po_score": <0-100>,
    "invoice_po_status": "<MATCH|PARTIAL|MISMATCH>",
    "invoice_po_mismatches": ["list issues"],
    "invoice_grn_score": <0-100>,
    "invoice_grn_status": "<MATCH|PARTIAL|MISMATCH>",
    "invoice_grn_mismatches": ["list issues"],
    "overall_status": "<MATCH|PARTIAL|MISMATCH>",
    "overall_score": <0-100>
  }},
  "insights": ["short bullet explaining your findings"]
}}

Invoice Data:
{json.dumps(state["extraction"], indent=2)}

Purchase Order:
{json.dumps(state["po"], indent=2)}

Goods Receipt:
{json.dumps(state["grn"], indent=2)}
"""

        data = self._invoke_llm(prompt)
        matching = data.get("matching", {})
        state["matching"] = matching
        insight_events = [
            {
                "stage": "MATCH_AGENT",
                "message": insight,
                "timestamp": datetime.utcnow().isoformat()
            }
            for insight in data.get("insights", [])
        ]
        state.setdefault("insights", []).extend(insight_events)
        return state

    def _fraud_agent(self, state: ValidationState) -> ValidationState:
        """LangGraph node focused on fraud & risk signals."""
        prompt = f"""
You are FraudAgent. Evaluate fraud risks using invoice data, vendor history, and prior matching results.

Respond ONLY with JSON:
{{
  "fraud": {{
    "risk_score": <0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "signals": [
      {{
        "type": "<BANK_CHANGE|DUPLICATE|AMOUNT_ANOMALY|VELOCITY|OTHER>",
        "severity": "<LOW|MEDIUM|HIGH>",
        "description": "What you observed",
        "risk_points": <0-40>
      }}
    ],
    "checks_performed": {{
      "bank_change": true,
      "duplicate": true,
      "amount_anomaly": true,
      "velocity": true
    }}
  }},
  "insights": ["short bullet describing each fraud concern"]
}}

Invoice Data:
{json.dumps(state["extraction"], indent=2)}

Vendor History:
{json.dumps(state["vendor"], indent=2)}

Matching Summary:
{json.dumps(state.get("matching", {}), indent=2)}

Extraction Quality: {state.get("extraction_quality", 100)}
"""

        data = self._invoke_llm(prompt)
        fraud = data.get("fraud", {})
        # Ensure defaults for checks_performed
        fraud.setdefault(
            "checks_performed",
            {
                "bank_change": True,
                "duplicate": True,
                "amount_anomaly": True,
                "velocity": True
            }
        )
        state["fraud"] = fraud
        insight_events = [
            {
                "stage": "FRAUD_AGENT",
                "message": insight,
                "timestamp": datetime.utcnow().isoformat()
            }
            for insight in data.get("insights", [])
        ]
        state.setdefault("insights", []).extend(insight_events)
        return state

    # --------------------------------------------------------------------- #
    # Helpers
    # --------------------------------------------------------------------- #

    def _invoke_llm(self, prompt: str) -> Dict[str, Any]:
        """Call Gemini and parse JSON safely."""
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.15,
                    top_p=0.8,
                    max_output_tokens=2048,
                )
            )
            text = (response.text or "").strip()
            # Remove code fences if present
            if text.startswith("```"):
                text = text.strip("`")
                if text.startswith("json"):
                    text = text[4:].strip()
            return json.loads(text)
        except Exception as exc:
            return {
                "matching": {},
                "fraud": {
                    "risk_score": 50,
                    "risk_level": "MEDIUM",
                    "signals": [{
                        "type": "SYSTEM",
                        "severity": "MEDIUM",
                        "description": f"Agent error: {exc}",
                        "risk_points": 20
                    }],
                    "checks_performed": {
                        "bank_change": False,
                        "duplicate": False,
                        "amount_anomaly": False,
                        "velocity": False
                    }
                },
                "insights": [f"Agent fallback due to error: {exc}"]
            }

    def _determine_recommendation(
        self,
        matching: Dict[str, Any],
        fraud: Dict[str, Any],
        extraction_quality: float
    ) -> str:
        """Derive final recommendation from agent results."""
        risk_score = fraud.get("risk_score", 0)
        overall_score = matching.get("overall_score", 0)

        if extraction_quality < 70:
            return "NEEDS_REVIEW"
        if risk_score >= 70:
            return "REJECT"
        if overall_score < 60:
            return "REJECT"
        if risk_score >= 40 or overall_score < 85:
            return "NEEDS_REVIEW"
        return "APPROVE"

    def _build_reasoning(
        self,
        matching: Dict[str, Any],
        fraud: Dict[str, Any],
        insights: List[Dict[str, Any]],
        extraction_quality: float
    ) -> str:
        """Compose human-readable reasoning summary."""
        parts = [
            f"Extraction quality: {extraction_quality:.1f}%",
            f"Match score: {matching.get('overall_score', 0)}/100 ({matching.get('overall_status', 'UNKNOWN')})",
            f"Fraud risk: {fraud.get('risk_score', 0)}/100 ({fraud.get('risk_level', 'UNKNOWN')})"
        ]
        if insights:
            parts.append("Agent insights:")
            parts.extend([f"- [{item.get('stage')}] {item.get('message')}" for item in insights])
        return "\n".join(parts)

    def _build_summary(
        self,
        matching: Dict[str, Any],
        fraud: Dict[str, Any],
        recommendation: str
    ) -> str:
        """Short summary for UI badges."""
        return (
            f"{recommendation}: Match {matching.get('overall_score', 0)} / "
            f"Risk {fraud.get('risk_score', 0)}"
        )
