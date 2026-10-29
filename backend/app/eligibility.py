"""
Deterministic eligibility engine for Jan Sahayak.
Evaluates citizen profiles against structured scheme rules.
Returns three mutually exclusive groups:
  - eligible: User definitely satisfies all requirements
  - maybe: User satisfies known rules, but some required fields are not provided
  - not_eligible: User violates one or more hard requirements (with reasons)
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Directory containing the knowledge base JSON files
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

class CitizenProfile(BaseModel):
    """Normalized profile collected from conversation or guided questionnaire."""
    age: Optional[int] = Field(default=None, description="Age in years")
    family_income: Optional[int] = Field(default=None, description="Annual family income in INR")
    category: Optional[str] = Field(default=None, description="Caste / Social Category: General, OBC, BC, MBC, DNC, SC, ST, Minority")
    gender: Optional[str] = Field(default=None, description="male, female, other")
    is_disabled: Optional[bool] = Field(default=None, description="Whether person has a benchmark disability (>=40%)")
    disability_percentage: Optional[int] = Field(default=None, description="Percentage of disability if known")
    education_level: Optional[str] = Field(default=None, description="Class 9, Class 10, Class 11, Class 12, ITI, Diploma, Undergraduate, Postgraduate, PhD")
    state: Optional[str] = Field(default="Tamil Nadu", description="State of domicile or residence")
    studied_in_govt_school: Optional[bool] = Field(default=None, description="Whether student attended government / aided school from Class 6-12")
    marks_percentage: Optional[float] = Field(default=None, description="Marks percentage in previous qualifying exam")
    is_destitute: Optional[bool] = Field(default=None, description="Whether person is living in destitute poverty without support")
    marital_status: Optional[str] = Field(default=None, description="single, married, widow, divorced, deserted")
    has_adult_earning_son: Optional[bool] = Field(default=None, description="Whether the applicant has an adult son who can support them")

def load_knowledge_base() -> Dict[str, List[Dict[str, Any]]]:
    """Loads all scheme datasets from data/ directory."""
    scholarships_file = DATA_DIR / "scholarships.json"
    pensions_file = DATA_DIR / "pensions.json"
    certificates_file = DATA_DIR / "certificates.json"

    scholarships = []
    pensions = []
    certificates = []

    if scholarships_file.exists():
        with open(scholarships_file, "r", encoding="utf-8") as f:
            scholarships = json.load(f)

    if pensions_file.exists():
        with open(pensions_file, "r", encoding="utf-8") as f:
            pensions = json.load(f)

    if certificates_file.exists():
        with open(certificates_file, "r", encoding="utf-8") as f:
            certificates = json.load(f)

    return {
        "scholarships": scholarships,
        "pensions": pensions,
        "certificates": certificates,
    }

def normalize_category(cat: Optional[str]) -> Optional[str]:
    """Normalizes category strings for reliable comparison."""
    if not cat:
        return None
    c = cat.strip().upper()
    if "SC" in c:
        return "SC"
    if "ST" in c:
        return "ST"
    if "MBC" in c or "DNC" in c:
        return "MBC"
    if "BC" in c or "OBC" in c:
        return "OBC"
    if "MINORITY" in c or "MUSLIM" in c or "CHRISTIAN" in c:
        return "Minority"
    if "GEN" in c or "OPEN" in c:
        return "General"
    return cat.strip()

def evaluate_scheme(scheme: Dict[str, Any], profile: CitizenProfile) -> Dict[str, Any]:
    """
    Evaluates a single scheme against a citizen profile.
    Returns:
      {
        "status": "eligible" | "maybe" | "not_eligible",
        "scheme": scheme,
        "reasons": [...],        # Reasons why not eligible
        "missing_fields": [...]  # Fields needed to confirm eligibility
      }
    """
    rules = scheme.get("eligibility_rules", {})
    reasons: List[str] = []
    missing_fields: List[str] = []

    # 1. State check
    scheme_state = scheme.get("state", "All")
    if scheme_state != "All":
        if profile.state is None:
            missing_fields.append("state")
        elif profile.state.strip().lower() != scheme_state.strip().lower():
            reasons.append(f"Scheme is limited to residents of {scheme_state}.")

    # 2. Gender check
    rule_gender = rules.get("gender", "any")
    if rule_gender and rule_gender != "any":
        if profile.gender is None:
            missing_fields.append("gender")
        elif profile.gender.strip().lower() != rule_gender.strip().lower():
            reasons.append(f"Scheme is only for {rule_gender} applicants.")

    # 3. Age check
    min_age = rules.get("min_age")
    max_age = rules.get("max_age")
    if min_age is not None or max_age is not None:
        if profile.age is None:
            missing_fields.append("age")
        else:
            if min_age is not None and profile.age < min_age:
                reasons.append(f"Minimum required age is {min_age} years (applicant is {profile.age}).")
            if max_age is not None and profile.age > max_age:
                reasons.append(f"Maximum allowed age is {max_age} years (applicant is {profile.age}).")

    # 4. Income check
    max_income = rules.get("max_family_income")
    if max_income is not None:
        if profile.family_income is None:
            missing_fields.append("family_income")
        else:
            if profile.family_income > max_income:
                reasons.append(f"Annual family income (₹{profile.family_income:,}) exceeds the limit of ₹{max_income:,}.")

    # 5. Category check
    allowed_categories = rules.get("allowed_categories", [])
    if allowed_categories and "All" not in allowed_categories:
        if profile.category is None:
            missing_fields.append("category")
        else:
            norm_user_cat = normalize_category(profile.category)
            norm_allowed = [normalize_category(c) for c in allowed_categories]
            # If user has a category that isn't matched
            if norm_user_cat not in norm_allowed and profile.category not in allowed_categories:
                reasons.append(f"Applicant category '{profile.category}' is not eligible (allowed: {', '.join(allowed_categories)}).")

    # 6. Disability check
    requires_disability = rules.get("requires_disability", False)
    if requires_disability:
        if profile.is_disabled is None:
            missing_fields.append("is_disabled")
        elif not profile.is_disabled:
            reasons.append("Scheme requires a recognized benchmark disability (40% or more).")
        else:
            min_disability_pct = rules.get("minimum_disability_percentage", 40)
            if profile.disability_percentage is not None and profile.disability_percentage < min_disability_pct:
                reasons.append(f"Benchmark disability percentage must be at least {min_disability_pct}%.")

    # 7. Education level check
    allowed_edu_levels = rules.get("education_levels", [])
    if allowed_edu_levels:
        if profile.education_level is None:
            missing_fields.append("education_level")
        else:
            user_edu = profile.education_level.strip().lower()
            edu_match = any(user_edu == lvl.strip().lower() for lvl in allowed_edu_levels)
            if not edu_match:
                reasons.append(f"Course level '{profile.education_level}' does not match required levels: {', '.join(allowed_edu_levels)}.")

    # 8. Government school attendance (for TN Pudhumai Penn / Tamil Pudhalvan)
    req_govt_school = rules.get("studied_in_govt_school", False)
    if req_govt_school:
        if profile.studied_in_govt_school is None:
            missing_fields.append("studied_in_govt_school")
        elif not profile.studied_in_govt_school:
            reasons.append("Requires continuous schooling from Class 6 to 12 in a Government or recognized aided school.")

    # 9. Minimum marks percentage (if applicable)
    min_marks = rules.get("minimum_marks_percentage", 0)
    if min_marks > 0:
        if profile.marks_percentage is None:
            missing_fields.append("marks_percentage")
        elif profile.marks_percentage < min_marks:
            reasons.append(f"Requires minimum {min_marks}% marks in previous examination (applicant has {profile.marks_percentage}%).")

    # 10. Destitute / Pension specific checks
    if rules.get("destitute_status_required", False):
        if profile.is_destitute is None:
            missing_fields.append("is_destitute")
        elif not profile.is_destitute:
            reasons.append("Applicant must be certified as destitute without regular financial means.")

    req_marital = rules.get("marital_status")
    if req_marital:
        if profile.marital_status is None:
            missing_fields.append("marital_status")
        elif profile.marital_status.strip().lower() != req_marital.strip().lower():
            reasons.append(f"Requires marital status '{req_marital}'.")

    # If applicant definitely violated any hard rule
    if reasons:
        return {
            "status": "not_eligible",
            "scheme": scheme,
            "reasons": reasons,
            "missing_fields": [],
        }

    # If applicant has no violations but missing critical info
    if missing_fields:
        return {
            "status": "maybe",
            "scheme": scheme,
            "reasons": [],
            "missing_fields": missing_fields,
        }

    # Satisfied all criteria
    return {
        "status": "eligible",
        "scheme": scheme,
        "reasons": [],
        "missing_fields": [],
    }

def evaluate_all_schemes(profile: CitizenProfile, scheme_type: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Evaluates profile across all or selected scheme types ('scholarships' or 'pensions').
    Returns { "eligible": [...], "maybe": [...], "not_eligible": [...] }
    """
    kb = load_knowledge_base()
    schemes_to_check: List[Dict[str, Any]] = []

    if scheme_type == "scholarships":
        schemes_to_check.extend(kb.get("scholarships", []))
    elif scheme_type == "pensions":
        schemes_to_check.extend(kb.get("pensions", []))
    else:
        schemes_to_check.extend(kb.get("scholarships", []))
        schemes_to_check.extend(kb.get("pensions", []))

    results = {
        "eligible": [],
        "maybe": [],
        "not_eligible": [],
    }

    for scheme in schemes_to_check:
        eval_result = evaluate_scheme(scheme, profile)
        status = eval_result["status"]
        results[status].append(eval_result)

    return results
