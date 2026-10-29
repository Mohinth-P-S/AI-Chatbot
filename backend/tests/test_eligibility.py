"""
Unit tests for the deterministic scheme eligibility engine.
Verifies accurate classification into 'eligible', 'maybe', and 'not_eligible'
across edge cases (income limits, category restrictions, gender, education level, disability).
"""
import pytest
from app.eligibility import CitizenProfile, evaluate_all_schemes, evaluate_scheme, load_knowledge_base

@pytest.fixture
def kb():
    return load_knowledge_base()

def test_knowledge_base_loaded(kb):
    """Verifies that knowledge base files load non-empty lists."""
    assert len(kb["scholarships"]) >= 15, f"Expected at least 15 scholarships, found {len(kb['scholarships'])}"
    assert len(kb["certificates"]) >= 5, f"Expected at least 5 certificates, found {len(kb['certificates'])}"
    assert len(kb["pensions"]) >= 4, f"Expected at least 4 pensions, found {len(kb['pensions'])}"

def test_sc_post_matric_eligible(kb):
    """An SC student with income under 2.5L in college should be eligible for SC Post-Matric."""
    profile = CitizenProfile(
        age=19,
        category="SC",
        family_income=120000,
        gender="male",
        education_level="Undergraduate",
        state="Tamil Nadu",
        is_disabled=False,
    )
    results = evaluate_all_schemes(profile, scheme_type="scholarships")
    eligible_ids = [res["scheme"]["id"] for res in results["eligible"]]
    assert "post-matric-sc-central" in eligible_ids

def test_sc_post_matric_income_exceeded(kb):
    """An SC student whose family income exceeds 2.5L is NOT eligible."""
    profile = CitizenProfile(
        age=19,
        category="SC",
        family_income=350000,  # Limit is 250,000
        gender="male",
        education_level="Undergraduate",
        state="Tamil Nadu",
        is_disabled=False,
    )
    results = evaluate_all_schemes(profile, scheme_type="scholarships")
    not_eligible_dict = {res["scheme"]["id"]: res["reasons"] for res in results["not_eligible"]}
    assert "post-matric-sc-central" in not_eligible_dict
    assert any("exceeds the limit" in r for r in not_eligible_dict["post-matric-sc-central"])

def test_missing_income_results_in_maybe(kb):
    """If income is not known, the scheme should land in 'maybe' with missing_fields."""
    profile = CitizenProfile(
        age=19,
        category="SC",
        family_income=None,  # Missing
        gender="male",
        education_level="Undergraduate",
        state="Tamil Nadu",
        is_disabled=False,
    )
    results = evaluate_all_schemes(profile, scheme_type="scholarships")
    maybe_dict = {res["scheme"]["id"]: res["missing_fields"] for res in results["maybe"]}
    assert "post-matric-sc-central" in maybe_dict
    assert "family_income" in maybe_dict["post-matric-sc-central"]

def test_pudhumai_penn_scheme_eligible(kb):
    """A female student in TN who studied classes 6-12 in govt school and joins college."""
    profile = CitizenProfile(
        age=18,
        gender="female",
        category="OBC",
        education_level="Undergraduate",
        state="Tamil Nadu",
        studied_in_govt_school=True,
    )
    results = evaluate_all_schemes(profile, scheme_type="scholarships")
    eligible_ids = [res["scheme"]["id"] for res in results["eligible"]]
    assert "tn-pudhumai-penn" in eligible_ids

def test_pudhumai_penn_male_not_eligible(kb):
    """A male student cannot get Pudhumai Penn; he should qualify for Tamil Pudhalvan if in govt school."""
    male_profile = CitizenProfile(
        age=18,
        gender="male",
        category="OBC",
        education_level="Undergraduate",
        state="Tamil Nadu",
        studied_in_govt_school=True,
    )
    results = evaluate_all_schemes(male_profile, scheme_type="scholarships")
    not_eligible_ids = [res["scheme"]["id"] for res in results["not_eligible"]]
    eligible_ids = [res["scheme"]["id"] for res in results["eligible"]]
    assert "tn-pudhumai-penn" in not_eligible_ids
    assert "tn-tamil-pudhalvan" in eligible_ids

def test_pwd_scholarship_and_pension(kb):
    """A disabled applicant (40%+) should qualify for PwD schemes and DAP pension."""
    profile = CitizenProfile(
        age=20,
        category="General",
        family_income=100000,
        gender="female",
        education_level="Undergraduate",
        is_disabled=True,
        disability_percentage=50,
        state="Tamil Nadu",
    )
    # Check scholarships
    scholarship_res = evaluate_all_schemes(profile, scheme_type="scholarships")
    el_schol = [r["scheme"]["id"] for r in scholarship_res["eligible"]]
    assert "pwd-post-matric" in el_schol

    # Check pensions
    pension_res = evaluate_all_schemes(profile, scheme_type="pensions")
    el_pen = [r["scheme"]["id"] for r in pension_res["eligible"]]
    assert "pension-dap-tn" in el_pen

def test_old_age_pension_age_limit(kb):
    """Under 60 years should not be eligible for Old Age Pension."""
    younger_profile = CitizenProfile(
        age=55,
        family_income=50000,
        state="Tamil Nadu",
        is_destitute=True,
    )
    res = evaluate_all_schemes(younger_profile, scheme_type="pensions")
    not_el = {r["scheme"]["id"]: r["reasons"] for r in res["not_eligible"]}
    assert "pension-oap-tn" in not_el
    assert any("Minimum required age is 60" in r for r in not_el["pension-oap-tn"])

    senior_profile = CitizenProfile(
        age=65,
        family_income=50000,
        state="Tamil Nadu",
        is_destitute=True,
    )
    res_senior = evaluate_all_schemes(senior_profile, scheme_type="pensions")
    el_senior = [r["scheme"]["id"] for r in res_senior["eligible"]]
    assert "pension-oap-tn" in el_senior
