import re
from typing import Any, Dict, List, Tuple
from pydantic import BaseModel
from app.core.permissions import RiskLevel

class DLPFinding(BaseModel):
    finding_type: str
    location: str
    severity: RiskLevel
    snippet: str
    description: str

class DLPScanResult(BaseModel):
    has_sensitive_data: bool
    findings: List[DLPFinding]
    sanitized_payload: Dict[str, Any]

class SensitiveDataService:
    # Safe pattern definitions
    PATTERNS = {
        "OPENAI_API_KEY": (
            re.compile(r"\b(sk-[a-zA-Z0-9T3BlbkFJ]{20,})\b"),
            RiskLevel.CRITICAL,
            "Raw OpenAI API Secret Key detected"
        ),
        "GENERIC_API_KEY": (
            re.compile(r"\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)[\s:=]+['\"]?([a-zA-Z0-9_\-\.]{20,})['\"]?", re.IGNORECASE),
            RiskLevel.CRITICAL,
            "Raw API Key or Secret Token parameter detected"
        ),
        "JWT_TOKEN": (
            re.compile(r"\b(eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})\b"),
            RiskLevel.HIGH,
            "JSON Web Token (JWT) credentials exposed in payload"
        ),
        "PRIVATE_KEY_HEADER": (
            re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"),
            RiskLevel.CRITICAL,
            "Asymmetric Private Key certificate header detected"
        ),
        "CREDIT_CARD": (
            re.compile(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})\b"),
            RiskLevel.CRITICAL,
            "Payment Card Number (PCI-DSS sensitive) detected"
        ),
        "EMAIL_ADDRESS": (
            re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
            RiskLevel.LOW,
            "Customer Personal Email address (PII)"
        ),
        "PHONE_NUMBER": (
            re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
            RiskLevel.LOW,
            "Customer Phone number (PII)"
        ),
        "BULK_SQL_INJECTION_PATTERN": (
            re.compile(r"(\bSELECT\b[\s\S]+\bFROM\b|\bDROP\s+TABLE\b|\bUNION\s+SELECT\b|--|\bOR\s+1=1\b)", re.IGNORECASE),
            RiskLevel.CRITICAL,
            "SQL Injection or bulk database dump payload detected"
        )
    }

    def scan_and_sanitize(self, payload: Any, path: str = "payload") -> DLPScanResult:
        findings: List[DLPFinding] = []
        sanitized = self._traverse_and_redact(payload, path, findings)
        
        return DLPScanResult(
            has_sensitive_data=len(findings) > 0,
            findings=findings,
            sanitized_payload=sanitized if isinstance(sanitized, dict) else {"data": sanitized}
        )

    def _traverse_and_redact(self, item: Any, current_path: str, findings: List[DLPFinding]) -> Any:
        if isinstance(item, dict):
            new_dict = {}
            for k, v in item.items():
                child_path = f"{current_path}.{k}"
                
                # Check key name for suspicious keywords (password, token, api_key)
                if any(sec in k.lower() for sec in ["password", "secret", "token", "api_key", "private_key"]):
                    if isinstance(v, str) and len(v) > 0:
                        findings.append(
                            DLPFinding(
                                finding_type="CONFIDENTIAL_CREDENTIAL_FIELD",
                                location=child_path,
                                severity=RiskLevel.CRITICAL,
                                snippet=f"{k}: [REDACTED_SECRET]",
                                description=f"High-entropy secret in field '{k}'"
                            )
                        )
                        new_dict[k] = "[REDACTED_SECRET]"
                        continue

                new_dict[k] = self._traverse_and_redact(v, child_path, findings)
            return new_dict

        elif isinstance(item, list):
            return [self._traverse_and_redact(x, f"{current_path}[{i}]", findings) for i, x in enumerate(item)]

        elif isinstance(item, str):
            sanitized_str = item
            for p_type, (regex, severity, desc) in self.PATTERNS.items():
                matches = regex.findall(item)
                if matches:
                    for match in matches:
                        match_str = match if isinstance(match, str) else str(match[0] if match else "")
                        if not match_str:
                            continue
                        
                        # Add finding
                        masked = self._mask_string(match_str)
                        findings.append(
                            DLPFinding(
                                finding_type=p_type,
                                location=current_path,
                                severity=severity,
                                snippet=masked,
                                description=desc
                            )
                        )
                        # Redact in sanitized payload
                        sanitized_str = sanitized_str.replace(match_str, f"***REDACTED_{p_type}***")
            return sanitized_str

        return item

    def _mask_string(self, text: str) -> str:
        if len(text) <= 6:
            return "***"
        return f"{text[:3]}***{text[-3:]}"

sensitive_data_service = SensitiveDataService()
