"""
RFCTLARR Act 2013 Statutory Valuation and Compensation Engine
SIH26016 Land Acquisition Digital Twin Engine

Implements Section 26 to Section 30 statutory compensation rules:
- Section 26: Determination of Market Value (higher of circle rate or registered average sale deeds)
- Section 26(2) & First Schedule: Multiplier factor for rural areas (1.00x - 2.00x based on distance from urban area)
- Section 29 & Section 27/28: Valuation of attached assets (structures, trees, standing crops) and severance damage
- Section 30(1): Solatium (100% on total market value and assets)
- Section 30(3): Additional Interest at 12% per annum on base market value from Section 11 notice to award date
- Traceable and explainable audit trail with statutory citations
- Workflow states: CALCULATED -> APPROVED -> PAYMENT_PENDING -> PAID | DISPUTED | ON_HOLD
- Dynamic synchronization with PostgreSQL dependency_edges and CPM schedule
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import json
import logging
from typing import Any, Optional
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sih26016 import SIHCompensationRecord
from app.services.sih26016_service import sih_service

logger = logging.getLogger("valuation_engine")

# -------------------------------------------------------------------------
# Synthetic Demo Rules & Configurable Slabs
# -------------------------------------------------------------------------

RULE_VERSION = "RFCTLARR_2013_DEMO_V1"
RULE_BASIS = (
    "Right to Fair Compensation and Transparency in Land Acquisition, "
    "Rehabilitation and Resettlement Act, 2013 (Sections 26 to 30) - "
    "Synthetic Demo Configuration v2026.1"
)

STATUTORY_DISCLAIMER = (
    "DISCLAIMER: Statutory valuation computed by KOSH SIH26016 Rule Engine using "
    "RFCTLARR Act 2013 (Sections 26-30) statutory formulas with Synthetic Demo Rates "
    "and Parameters. Not a legally registered award deed."
)

DEFAULT_CIRCLE_RATES_PER_SQM: dict[str, Decimal] = {
    "agricultural_irrigated": Decimal("1200.00"),
    "agricultural_unirrigated": Decimal("850.00"),
    "residential": Decimal("3500.00"),
    "commercial": Decimal("6500.00"),
    "industrial": Decimal("4800.00"),
    "barren": Decimal("450.00"),
    "default": Decimal("1000.00"),
}

# Distance from nearest urban area boundary (km) -> Statutory Multiplier Factor
# As per RFCTLARR First Schedule & State Notification (e.g., Rajasthan RFCTLARR Rules 2016)
MULTIPLIER_SLABS: list[tuple[Decimal, Decimal, Decimal]] = [
    # (min_km_exclusive, max_km_inclusive, multiplier)
    (Decimal("0.0"), Decimal("10.0"), Decimal("1.20")),
    (Decimal("10.0"), Decimal("20.0"), Decimal("1.50")),
    (Decimal("20.0"), Decimal("30.0"), Decimal("1.75")),
    (Decimal("30.0"), Decimal("9999.0"), Decimal("2.00")),
]
URBAN_MULTIPLIER = Decimal("1.00")

SOLATIUM_PERCENTAGE = Decimal("100.00")  # Section 30(1): 100%
ANNUAL_INTEREST_RATE = Decimal("0.12")   # Section 30(3): 12% per annum
DAYS_IN_YEAR = Decimal("365.25")

VALID_WORKFLOW_STATUSES = {
    "CALCULATED",
    "APPROVED",
    "PAYMENT_PENDING",
    "PAID",
    "DISPUTED",
    "ON_HOLD",
}


# -------------------------------------------------------------------------
# Data Structures
# -------------------------------------------------------------------------

@dataclass
class ValuationInput:
    parcel_id: str
    area_sqm: Decimal
    circle_rate_per_sqm: Optional[Decimal] = None
    market_rate_per_sqm: Optional[Decimal] = None
    land_category: str = "agricultural_irrigated"
    distance_from_urban_km: Optional[Decimal] = None
    multiplier_factor: Optional[Decimal] = None
    asset_value: Decimal = Decimal("0.00")
    trees_crops_value: Decimal = Decimal("0.00")
    severance_damage: Decimal = Decimal("0.00")
    other_damages: Decimal = Decimal("0.00")
    notification_date: Optional[date] = None
    award_date: Optional[date] = None
    case_id: Optional[str] = None


@dataclass
class ValuationCalculationStep:
    step_number: int
    title: str
    statutory_citation: str
    formula: str
    inputs: dict[str, Any]
    result: float
    explanation: str


@dataclass
class ValuationResult:
    compensation_id: str
    parcel_id: str
    case_id: Optional[str]
    market_value_base: Decimal
    multiplier_factor: Decimal
    market_value_adjusted: Decimal
    asset_value: Decimal
    severance_damage: Decimal
    subtotal_before_solatium: Decimal
    solatium_amount: Decimal
    interest_12pct_amount: Decimal
    total_compensation: Decimal
    compensation_status: str
    payment_status: str
    rule_version: str
    rule_basis: str
    steps: list[ValuationCalculationStep]
    valuation_inputs: dict[str, Any]
    award_date: Optional[date]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    disclaimer: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "compensation_id": self.compensation_id,
            "parcel_id": self.parcel_id,
            "case_id": self.case_id,
            "market_value_base": float(self.market_value_base),
            "multiplier_factor": float(self.multiplier_factor),
            "market_value_adjusted": float(self.market_value_adjusted),
            "asset_value": float(self.asset_value),
            "severance_damage": float(self.severance_damage),
            "subtotal_before_solatium": float(self.subtotal_before_solatium),
            "solatium_amount": float(self.solatium_amount),
            "interest_12pct_amount": float(self.interest_12pct_amount),
            "total_compensation": float(self.total_compensation),
            "compensation_status": self.compensation_status,
            "payment_status": self.payment_status,
            "rule_version": self.rule_version,
            "rule_basis": self.rule_basis,
            "calculation_trace": {
                "steps": [asdict(s) for s in self.steps],
                "disclaimer": self.disclaimer,
            },
            "valuation_inputs": self.valuation_inputs,
            "award_date": self.award_date.isoformat() if self.award_date else None,
            "approved_by": self.approved_by,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "disclaimer": self.disclaimer,
        }


# -------------------------------------------------------------------------
# Valuation Engine Core Class
# -------------------------------------------------------------------------

class ValuationEngine:
    """
    Deterministic rule-based statutory valuation engine.
    Calculates compensation awards with Python Decimal currency precision
    and full explainability traces.
    """

    @staticmethod
    def get_default_circle_rate(land_category: str) -> Decimal:
        norm_cat = (land_category or "default").strip().lower()
        return DEFAULT_CIRCLE_RATES_PER_SQM.get(norm_cat, DEFAULT_CIRCLE_RATES_PER_SQM["default"])

    @staticmethod
    def determine_multiplier(distance_km: Optional[Decimal]) -> Decimal:
        if distance_km is None or distance_km <= Decimal("0.0"):
            return URBAN_MULTIPLIER
        for min_km, max_km, mult in MULTIPLIER_SLABS:
            if min_km < distance_km <= max_km:
                return mult
        return Decimal("2.00")

    @classmethod
    def calculate(
        cls,
        inputs: ValuationInput,
        compensation_id: Optional[str] = None,
        existing_status: str = "CALCULATED",
        approved_by: Optional[str] = None,
        approved_at: Optional[datetime] = None,
    ) -> ValuationResult:
        """
        Executes Sections 26-30 statutory calculations using Decimal arithmetic.
        """
        # Ensure Decimals
        area_sqm = Decimal(str(inputs.area_sqm)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if area_sqm <= Decimal("0.00"):
            raise ValueError(f"Invalid parcel area: {inputs.area_sqm} sqm. Must be strictly positive.")

        # 1. Base Rate & Market Value (Section 26)
        cat = (inputs.land_category or "agricultural_irrigated").strip().lower()
        circle_rate = (
            Decimal(str(inputs.circle_rate_per_sqm))
            if inputs.circle_rate_per_sqm is not None
            else cls.get_default_circle_rate(cat)
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        market_sale_rate = (
            Decimal(str(inputs.market_rate_per_sqm)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if inputs.market_rate_per_sqm is not None
            else Decimal("0.00")
        )

        chosen_rate = max(circle_rate, market_sale_rate)
        market_value_base = (area_sqm * chosen_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        step_1 = ValuationCalculationStep(
            step_number=1,
            title="Determination of Market Value of Land",
            statutory_citation="RFCTLARR Act 2013 Section 26(1)",
            formula="area_sqm * max(circle_rate_per_sqm, average_sale_rate_per_sqm)",
            inputs={
                "area_sqm": float(area_sqm),
                "circle_rate_per_sqm": float(circle_rate),
                "market_sale_rate_per_sqm": float(market_sale_rate),
                "chosen_rate_per_sqm": float(chosen_rate),
                "land_category": cat,
            },
            result=float(market_value_base),
            explanation=(
                f"Statutory market rate determined as ₹{chosen_rate:,.2f}/sqm "
                f"(higher of minimum circle rate ₹{circle_rate:,.2f} and sale deed rate ₹{market_sale_rate:,.2f}) "
                f"across {area_sqm:,.2f} sqm, yielding base market value of ₹{market_value_base:,.2f}."
            ),
        )

        # 2. Multiplier Application (Section 26(2) & First Schedule)
        if inputs.multiplier_factor is not None:
            multiplier = Decimal(str(inputs.multiplier_factor)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            mult_reason = f"Explicitly configured multiplier factor of {multiplier:.2f}x."
        else:
            dist_km = (
                Decimal(str(inputs.distance_from_urban_km))
                if inputs.distance_from_urban_km is not None
                else Decimal("15.0")
            )
            multiplier = cls.determine_multiplier(dist_km)
            mult_reason = f"Statutory rural distance factor of {multiplier:.2f}x based on {dist_km:.2f} km distance."

        market_value_adjusted = (market_value_base * multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        step_2 = ValuationCalculationStep(
            step_number=2,
            title="Application of Rural Distance Multiplier Factor",
            statutory_citation="RFCTLARR Act 2013 Section 26(2) & First Schedule",
            formula="market_value_base * multiplier_factor",
            inputs={
                "distance_from_urban_km": float(inputs.distance_from_urban_km) if inputs.distance_from_urban_km is not None else None,
                "multiplier_factor": float(multiplier),
            },
            result=float(market_value_adjusted),
            explanation=(
                f"Applied multiplier factor {multiplier:.2f}x to base market value ₹{market_value_base:,.2f} "
                f"({mult_reason}), resulting in adjusted land market value of ₹{market_value_adjusted:,.2f}."
            ),
        )

        # 3. Attached Assets & Severance (Sections 27, 28, 29)
        asset_val = Decimal(str(inputs.asset_value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        trees_crops = Decimal(str(inputs.trees_crops_value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        tot_assets = (asset_val + trees_crops).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        sev_damage = Decimal(str(inputs.severance_damage or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        other_dam = Decimal(str(inputs.other_damages or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        tot_damages = (sev_damage + other_dam).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        subtotal = (market_value_adjusted + tot_assets + tot_damages).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        step_3 = ValuationCalculationStep(
            step_number=3,
            title="Valuation of Attached Assets and Severance Damage",
            statutory_citation="RFCTLARR Act 2013 Sections 27, 28 & 29",
            formula="market_value_adjusted + (structures_value + trees_crops_value) + (severance_damage + other_damages)",
            inputs={
                "structures_value": float(asset_val),
                "trees_crops_value": float(trees_crops),
                "total_attached_assets": float(tot_assets),
                "severance_damage": float(sev_damage),
                "other_damages": float(other_dam),
                "total_damages": float(tot_damages),
            },
            result=float(subtotal),
            explanation=(
                f"Added attached assets ₹{tot_assets:,.2f} (structures/wells ₹{asset_val:,.2f}, trees/crops ₹{trees_crops:,.2f}) "
                f"and severance/relocation damages ₹{tot_damages:,.2f} to adjusted land value, "
                f"yielding pre-solatium subtotal of ₹{subtotal:,.2f}."
            ),
        )

        # 4. Solatium Mandatory Award (Section 30(1))
        # 100% of subtotal
        solatium = (subtotal * (SOLATIUM_PERCENTAGE / Decimal("100.00"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        step_4 = ValuationCalculationStep(
            step_number=4,
            title="Mandatory Solatium Award (100%)",
            statutory_citation="RFCTLARR Act 2013 Section 30(1)",
            formula="100% * subtotal_before_solatium",
            inputs={
                "solatium_percentage": float(SOLATIUM_PERCENTAGE),
                "subtotal_before_solatium": float(subtotal),
            },
            result=float(solatium),
            explanation=(
                f"Awarded statutory 100% solatium (₹{solatium:,.2f}) on total market value and attached assets."
            ),
        )

        # 5. Additional 12% Interest (Section 30(3))
        # 12% per annum on base market value from Section 11 notice to award date
        notif_date = inputs.notification_date
        aw_date = inputs.award_date or date.today()
        interest_amount = Decimal("0.00")
        interest_days = 0

        if notif_date:
            delta = (aw_date - notif_date).days
            interest_days = max(0, delta)
            if interest_days > 0:
                fraction = Decimal(interest_days) / DAYS_IN_YEAR
                interest_amount = (market_value_base * ANNUAL_INTEREST_RATE * fraction).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

        step_5 = ValuationCalculationStep(
            step_number=5,
            title="12% Per Annum Additional Statutory Amount (Section 30(3))",
            statutory_citation="RFCTLARR Act 2013 Section 30(3)",
            formula="market_value_base * 12% * (elapsed_days / 365.25)",
            inputs={
                "notification_date": notif_date.isoformat() if notif_date else None,
                "award_date": aw_date.isoformat(),
                "elapsed_days": interest_days,
                "annual_interest_rate_pct": float(ANNUAL_INTEREST_RATE * 100),
            },
            result=float(interest_amount),
            explanation=(
                f"12.0% per annum additional statutory compensation on base market value (₹{market_value_base:,.2f}) "
                f"for {interest_days} days between Section 11 notice and award date: ₹{interest_amount:,.2f} "
                f"(statutory component under Section 30(3), distinct from Section 80 penal interest)."
                if notif_date else "Section 11 notification date not provided; statutory additional amount computed as ₹0.00."
            ),
        )


        # 6. Final Total Compensation Award
        total_comp = (subtotal + solatium + interest_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        step_6 = ValuationCalculationStep(
            step_number=6,
            title="Total Statutory Award Determination",
            statutory_citation="RFCTLARR Act 2013 Sections 26-30",
            formula="subtotal_before_solatium + solatium_amount + interest_12pct_amount",
            inputs={
                "subtotal_before_solatium": float(subtotal),
                "solatium_amount": float(solatium),
                "interest_12pct_amount": float(interest_amount),
            },
            result=float(total_comp),
            explanation=(
                f"Total statutory compensation package determined at ₹{total_comp:,.2f}."
            ),
        )

        steps = [step_1, step_2, step_3, step_4, step_5, step_6]

        cid = compensation_id or f"CR-{inputs.parcel_id}"

        clean_inputs = {
            "parcel_id": inputs.parcel_id,
            "case_id": inputs.case_id,
            "area_sqm": float(area_sqm),
            "circle_rate_per_sqm": float(circle_rate),
            "market_rate_per_sqm": float(market_sale_rate),
            "land_category": cat,
            "distance_from_urban_km": float(inputs.distance_from_urban_km) if inputs.distance_from_urban_km is not None else None,
            "multiplier_factor": float(multiplier),
            "asset_value": float(tot_assets),
            "severance_damage": float(tot_damages),
            "notification_date": notif_date.isoformat() if notif_date else None,
            "award_date": aw_date.isoformat() if aw_date else None,
        }

        return ValuationResult(
            compensation_id=cid,
            parcel_id=inputs.parcel_id,
            case_id=inputs.case_id,
            market_value_base=market_value_base,
            multiplier_factor=multiplier,
            market_value_adjusted=market_value_adjusted,
            asset_value=tot_assets,
            severance_damage=tot_damages,
            subtotal_before_solatium=subtotal,
            solatium_amount=solatium,
            interest_12pct_amount=interest_amount,
            total_compensation=total_comp,
            compensation_status=existing_status,
            payment_status=existing_status,
            rule_version=RULE_VERSION,
            rule_basis=RULE_BASIS,
            steps=steps,
            valuation_inputs=clean_inputs,
            award_date=aw_date,
            approved_by=approved_by,
            approved_at=approved_at,
            disclaimer=STATUTORY_DISCLAIMER,
        )

    # -------------------------------------------------------------------------
    # Database Persistence & Integration
    # -------------------------------------------------------------------------

    @classmethod
    async def get_or_calculate_valuation(
        cls,
        parcel_id: str,
        db: Optional[AsyncSession] = None,
    ) -> dict[str, Any]:
        """
        Retrieves existing statutory award from PostgreSQL or memory cache.
        If none exists, derives it on-the-fly using parcel attributes and stores it.
        """
        norm_pid = parcel_id.strip().upper()

        # 1. Check PostgreSQL compensation_records if db session available
        if db:
            query = select(SIHCompensationRecord).where(
                (SIHCompensationRecord.parcel_id == norm_pid) |
                (SIHCompensationRecord.compensation_id == f"CR-{norm_pid}")
            ).limit(1)
            res = await db.execute(query)
            record = res.scalars().first()
            if record:
                rec_dict = record.to_dict()
                if not rec_dict.get("calculation_trace"):
                    # Reconstruct trace if legacy row lacked it
                    recalc = cls._reconstruct_from_record(record, norm_pid)
                    return recalc.to_dict()
                return rec_dict

        # 2. Check sih_service memory cache
        cached_records = sih_service._data_cache.get("compensation_records", []) if sih_service._data_cache else []
        cases = {c["case_id"]: c for c in sih_service._data_cache.get("acquisition_cases", [])} if sih_service._data_cache else {}
        cases_by_parcel = {c["parcel_id"]: c for c in cases.values() if "parcel_id" in c}

        matched_cr = None
        for cr in cached_records:
            if cr.get("parcel_id") == norm_pid or cr.get("compensation_id") == f"CR-{norm_pid}":
                matched_cr = cr
                break
            # Match via acquisition_cases
            if cr.get("case_id") and cr["case_id"] in cases:
                if cases[cr["case_id"]].get("parcel_id") == norm_pid:
                    matched_cr = cr
                    break

        if matched_cr:
            if "calculation_trace" in matched_cr and matched_cr["calculation_trace"]:
                return matched_cr
            # Reconstruct trace
            p_case = cases_by_parcel.get(norm_pid)
            val_input = ValuationInput(
                parcel_id=norm_pid,
                case_id=p_case.get("case_id") if p_case else None,
                area_sqm=Decimal(str(matched_cr.get("market_value_base", 1000000))) / Decimal("1000"),
                multiplier_factor=Decimal(str(matched_cr.get("multiplier_factor", 1.5))),
                asset_value=Decimal(str(matched_cr.get("asset_value", 0))),
                severance_damage=Decimal(str(matched_cr.get("severance_damage", 0))),
            )
            reconstructed = cls.calculate(
                val_input,
                compensation_id=matched_cr.get("compensation_id"),
                existing_status=(matched_cr.get("compensation_status") or "CALCULATED").upper()
            )
            return reconstructed.to_dict()

        # 3. Derive fresh statutory valuation from parcel dossier
        parcel_detail = sih_service.get_parcel_detail(norm_pid)
        area_sqm = Decimal("2500.00")
        land_use = "agricultural_irrigated"
        case_id = None
        notif_date = None

        if parcel_detail:
            area_sqm = Decimal(str(parcel_detail.get("area_sqm") or 2500.00))
            land_use = parcel_detail.get("land_use") or "agricultural_irrigated"
            case_info = parcel_detail.get("acquisition_case") or {}
            case_id = case_info.get("case_id")
            if case_info.get("notification_date"):
                try:
                    notif_date = date.fromisoformat(case_info["notification_date"])
                except Exception:
                    pass

        val_input = ValuationInput(
            parcel_id=norm_pid,
            case_id=case_id,
            area_sqm=area_sqm,
            land_category=land_use,
            distance_from_urban_km=Decimal("15.5"),
            asset_value=Decimal("150000.00"),
            trees_crops_value=Decimal("45000.00"),
            severance_damage=Decimal("25000.00"),
            notification_date=notif_date or date(2025, 4, 1),
            award_date=date.today(),
        )

        fresh_val = cls.calculate(val_input)
        if db:
            await cls.save_to_db(fresh_val, db)

        # Sync to memory cache
        cls.sync_to_cache(fresh_val)
        return fresh_val.to_dict()

    @classmethod
    async def save_to_db(cls, val: ValuationResult, db: AsyncSession) -> None:
        """
        Upserts the ValuationResult into PostgreSQL compensation_records.
        """
        stmt = text("""
            INSERT INTO compensation_records (
                compensation_id, parcel_id, case_id, market_value_base,
                multiplier_factor, asset_value, severance_damage,
                subtotal_before_solatium, solatium_amount, interest_12pct_amount,
                total_compensation, compensation_status, payment_status,
                rule_version, rule_basis, calculation_trace, valuation_inputs,
                award_date, approved_by, approved_at, source_type, updated_at
            ) VALUES (
                :cid, :pid, :case_id, :mv_base,
                :mult, :asset_val, :sev_dam,
                :subtot, :solatium, :interest,
                :total, :comp_status, :pay_status,
                :rule_ver, :rule_basis, :trace, :inputs,
                :aw_date, :app_by, :app_at, 'MODEL_DERIVED', now()
            )
            ON CONFLICT (compensation_id) DO UPDATE SET
                parcel_id = EXCLUDED.parcel_id,
                case_id = EXCLUDED.case_id,
                market_value_base = EXCLUDED.market_value_base,
                multiplier_factor = EXCLUDED.multiplier_factor,
                asset_value = EXCLUDED.asset_value,
                severance_damage = EXCLUDED.severance_damage,
                subtotal_before_solatium = EXCLUDED.subtotal_before_solatium,
                solatium_amount = EXCLUDED.solatium_amount,
                interest_12pct_amount = EXCLUDED.interest_12pct_amount,
                total_compensation = EXCLUDED.total_compensation,
                compensation_status = EXCLUDED.compensation_status,
                payment_status = EXCLUDED.payment_status,
                calculation_trace = EXCLUDED.calculation_trace,
                valuation_inputs = EXCLUDED.valuation_inputs,
                award_date = EXCLUDED.award_date,
                approved_by = EXCLUDED.approved_by,
                approved_at = EXCLUDED.approved_at,
                updated_at = now();
        """)

        trace_json = json.dumps({
            "steps": [asdict(s) for s in val.steps],
            "disclaimer": val.disclaimer,
        })
        inputs_json = json.dumps(val.valuation_inputs)

        await db.execute(stmt, {
            "cid": val.compensation_id,
            "pid": val.parcel_id,
            "case_id": val.case_id,
            "mv_base": val.market_value_base,
            "mult": val.multiplier_factor,
            "asset_val": val.asset_value,
            "sev_dam": val.severance_damage,
            "subtot": val.subtotal_before_solatium,
            "solatium": val.solatium_amount,
            "interest": val.interest_12pct_amount,
            "total": val.total_compensation,
            "comp_status": val.compensation_status,
            "pay_status": val.payment_status,
            "rule_ver": val.rule_version,
            "rule_basis": val.rule_basis,
            "trace": trace_json,
            "inputs": inputs_json,
            "aw_date": val.award_date,
            "app_by": val.approved_by,
            "app_at": val.approved_at,
        })
        await db.commit()

    @classmethod
    def sync_to_cache(cls, val: ValuationResult) -> None:
        """Updates in-memory sih_service cache with the computed valuation."""
        if not sih_service._data_cache:
            return
        records = sih_service._data_cache.setdefault("compensation_records", [])
        found = False
        val_d = val.to_dict()
        for idx, r in enumerate(records):
            if r.get("compensation_id") == val.compensation_id or r.get("parcel_id") == val.parcel_id:
                records[idx] = val_d
                found = True
                break
        if not found:
            records.append(val_d)

    @classmethod
    async def approve_award(
        cls,
        compensation_id: str,
        officer_id: str,
        db: AsyncSession,
    ) -> dict[str, Any]:
        """
        Transitions statutory award from CALCULATED -> APPROVED.
        Marks it ready for disbursement.
        """
        now = datetime.now(timezone.utc)
        stmt = text("""
            UPDATE compensation_records
            SET compensation_status = 'APPROVED',
                payment_status = 'APPROVED',
                approved_by = :officer,
                approved_at = :approved_at,
                updated_at = now()
            WHERE compensation_id = :cid
            RETURNING parcel_id, total_compensation;
        """)
        res = await db.execute(stmt, {
            "officer": officer_id,
            "approved_at": now,
            "cid": compensation_id,
        })
        row = res.first()
        if not row:
            raise ValueError(f"Compensation record {compensation_id} not found in database.")

        await db.commit()
        pid = row[0]

        # Update in-memory cache
        if sih_service._data_cache:
            for r in sih_service._data_cache.get("compensation_records", []):
                if r.get("compensation_id") == compensation_id:
                    r["compensation_status"] = "APPROVED"
                    r["payment_status"] = "APPROVED"
                    r["approved_by"] = officer_id
                    r["approved_at"] = now.isoformat()
                    break

        return {
            "success": True,
            "compensation_id": compensation_id,
            "parcel_id": pid,
            "status": "APPROVED",
            "approved_by": officer_id,
            "approved_at": now.isoformat(),
        }

    @classmethod
    async def update_payment_status(
        cls,
        compensation_id: str,
        new_status: str,
        notes: Optional[str] = None,
        actor_id: str = "OFFICER",
        db: Optional[AsyncSession] = None,
    ) -> dict[str, Any]:
        """
        Updates payment status with CPM dependency graph synchronization.
        - DISPUTED | ON_HOLD: Activates a blocking dependency edge in CPM.
        - PAID: Clears blocking edge, releasing critical path delay.
        """
        clean_status = new_status.strip().upper()
        if clean_status not in VALID_WORKFLOW_STATUSES:
            raise ValueError(f"Invalid workflow status '{new_status}'. Allowed: {sorted(list(VALID_WORKFLOW_STATUSES))}")

        pid = None
        if db:
            stmt = text("""
                UPDATE compensation_records
                SET compensation_status = :status,
                    payment_status = :status,
                    updated_at = now()
                WHERE compensation_id = :cid
                RETURNING parcel_id;
            """)
            res = await db.execute(stmt, {"status": clean_status, "cid": compensation_id})
            row = res.first()
            if row:
                pid = row[0]
            await db.commit()

        # Update in-memory cache
        if sih_service._data_cache:
            for r in sih_service._data_cache.get("compensation_records", []):
                if r.get("compensation_id") == compensation_id:
                    r["compensation_status"] = clean_status
                    r["payment_status"] = clean_status
                    if not pid:
                        pid = r.get("parcel_id")
                    break

        # Blocker CPM synchronization
        cpm_impact = {}
        if pid and db:
            if clean_status in ["DISPUTED", "ON_HOLD"]:
                # Check existing edge
                existing_res = await db.execute(text("""
                    SELECT edge_id FROM dependency_edges
                    WHERE from_node_type = 'compensation' AND from_node_id = :comp_id
                """), {"comp_id": str(compensation_id)})
                existing = existing_res.first()

                if existing:
                    await db.execute(text("""
                        UPDATE dependency_edges
                        SET is_blocking = TRUE,
                            weight_days = 40.0,
                            to_node_id = :to_id
                        WHERE edge_id = :edge_id
                    """), {"edge_id": existing[0], "to_id": pid})
                else:
                    await db.execute(text("""
                        INSERT INTO dependency_edges (
                            from_node_type, from_node_id,
                            to_node_type, to_node_id, edge_type,
                            weight_days, is_blocking, source_type
                        ) VALUES (
                            'compensation', :from_id,
                            'parcel', :to_id, 'blocks',
                            40.0, TRUE, 'MODEL_DERIVED'
                        )
                    """), {"from_id": str(compensation_id), "to_id": pid})

                # Gate downstream project_segment for this parcel
                await db.execute(text("""
                    UPDATE dependency_edges
                    SET is_blocking = TRUE
                    WHERE from_node_type = 'parcel'
                      AND from_node_id = :pid
                      AND to_node_type = 'project_segment'
                """), {"pid": pid})

                await db.commit()
                # Recalculate CPM
                await sih_service.sync_with_db(db, force=True)
                cpm_report = sih_service.get_critical_path_report()
                cpm_impact = {
                    "blocked": True,
                    "project_delay_days": cpm_report.get("project_delay_days"),
                    "critical_path_nodes": cpm_report.get("critical_path_nodes", []),
                }

            elif clean_status in ["PAID", "APPROVED"]:
                # Deactivate blocking edge
                await db.execute(text("""
                    UPDATE dependency_edges
                    SET is_blocking = FALSE,
                        weight_days = 0.0
                    WHERE from_node_type = 'compensation' AND from_node_id = :from_id
                """), {"from_id": str(compensation_id)})

                # Check if any OTHER active blockers remain on this parcel
                remaining = await db.execute(text("""
                    SELECT count(*) FROM dependency_edges
                    WHERE to_node_type = 'parcel'
                      AND to_node_id = :pid
                      AND is_blocking = TRUE
                """), {"pid": pid})
                rem_count = remaining.scalar() or 0
                if rem_count == 0:
                    await db.execute(text("""
                        UPDATE dependency_edges
                        SET is_blocking = FALSE
                        WHERE from_node_type = 'parcel'
                          AND from_node_id = :pid
                          AND to_node_type = 'project_segment'
                    """), {"pid": pid})

                await db.commit()
                # Recalculate CPM
                await sih_service.sync_with_db(db, force=True)
                cpm_report = sih_service.get_critical_path_report()
                cpm_impact = {
                    "blocked": False,
                    "project_delay_days": cpm_report.get("project_delay_days"),
                    "critical_path_nodes": cpm_report.get("critical_path_nodes", []),
                }

        return {
            "success": True,
            "compensation_id": compensation_id,
            "parcel_id": pid,
            "new_status": clean_status,
            "notes": notes,
            "cpm_impact": cpm_impact,
        }

    @classmethod
    def _reconstruct_from_record(cls, record: SIHCompensationRecord, parcel_id: str) -> ValuationResult:
        """Reconstructs full ValuationResult from a raw DB record lacking trace."""
        val_input = ValuationInput(
            parcel_id=parcel_id,
            case_id=record.case_id,
            area_sqm=Decimal("2000.00"),
            multiplier_factor=Decimal(str(record.multiplier_factor or 1.5)),
            asset_value=Decimal(str(record.asset_value or 0)),
            severance_damage=Decimal(str(record.severance_damage or 0)),
            award_date=record.award_date,
        )
        return cls.calculate(
            val_input,
            compensation_id=record.compensation_id,
            existing_status=record.compensation_status or "CALCULATED",
            approved_by=record.approved_by,
            approved_at=record.approved_at,
        )


valuation_engine = ValuationEngine()
