export type ScoredPatient = {
    patient_id: string;
    name: string;
    totalRisk: number;
    bpScore: number;
    tempScore: number;
    ageScore: number;
    hasIssues: boolean;
    issues: string[];
};

export function calculateRisk(patient: any): ScoredPatient {
    let bpScore = 0;
    let tempScore = 0;
    let ageScore = 0;
    const issues: string[] = [];

    const bp = String(patient.blood_pressure || "").trim();
    const [sysStr, diaStr] = bp.split("/");
    const systolic = parseFloat(sysStr);
    const diastolic = parseFloat(diaStr);

    if (!bp || isNaN(systolic) || isNaN(diastolic) || !bp.includes("/")) {
        bpScore = 0;
        issues.push("BP");
    } else {
        if (systolic >= 140 || diastolic >= 90) bpScore = 4;
        else if (systolic >= 130 || diastolic >= 80) bpScore = 3;
        else if (systolic >= 120 && diastolic < 80) bpScore = 2;
        else bpScore = 1;
    }

    // === Temperature Risk ===
    const temp = parseFloat(patient.temperature);
    if (isNaN(temp)) {
        tempScore = 0;
        issues.push("Temp");
    } else if (temp >= 101) {
        tempScore = 2;
    } else if (temp >= 99.6) {
        tempScore = 1;
    } else {
        tempScore = 0;
    }

    // === Age Risk ===
    const age = parseInt(patient.age);
    if (isNaN(age)) {
        ageScore = 0;
        issues.push("Age");
    } else if (age > 65) {
        ageScore = 2;
    } else {
        ageScore = 1; // <40 or 40-65 both = 1 point
    }

    const totalRisk = bpScore + tempScore + ageScore;

    return {
        patient_id: patient.patient_id,
        name: patient.name || "Unknown",
        totalRisk,
        bpScore,
        tempScore,
        ageScore,
        hasIssues: issues.length > 0,
        issues,
    };
}