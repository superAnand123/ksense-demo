'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { calculateRisk, type ScoredPatient } from './lib/riskCalculator';

const API_KEY = "ak_a3f0d665d0a9af431aa99af0b98241e277293cb9a278598f";
const BASE_URL = "https://assessment.ksensetech.com/api";

type Patient = {
  patient_id: string;
  name: string;
  age: number | string;
  gender: string;
  blood_pressure: string;
  temperature: number | string;
  visit_date: string;
  diagnosis: string;
  medications: string;
};

export default function DemoMedAssessment() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [scoredPatients, setScoredPatients] = useState<ScoredPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPatients = async () => {
    let allPatients: Patient[] = [];
    let page = 1;
    const limit = 20;

    try {
      while (true) {
        const res = await axios.get(`${BASE_URL}/patients`, {
          headers: { "x-api-key": API_KEY },
          params: { page, limit },
        });

        allPatients = [...allPatients, ...res.data.data];

        if (!res.data.pagination?.hasNext) break;

        page++;
        await new Promise((r) => setTimeout(r, 350)); // gentle rate limit
      }

      setPatients(allPatients);
      const scored = allPatients.map(calculateRisk);
      setScoredPatients(scored);
    } catch (err: any) {
      setError(err.message || "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const high_risk_patients = scoredPatients
      .filter((p) => p.totalRisk >= 4)
      .map((p) => p.patient_id);

    const fever_patients = patients
      .filter((p) => parseFloat(String(p.temperature)) >= 99.6)
      .map((p) => p.patient_id);

    const data_quality_issues = scoredPatients
      .filter((p) => p.hasIssues)
      .map((p) => p.patient_id);

    try {
      const res = await axios.post(
        `${BASE_URL}/submit-assessment`,
        { high_risk_patients, fever_patients, data_quality_issues },
        { headers: { "x-api-key": API_KEY } }
      );

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  if (loading) return <div className="text-center mt-20 text-xl">Fetching patient data from DemoMed API...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">DemoMed Healthcare Risk Assessment</h1>
        <p className="text-center text-gray-600 mb-8">Total Patients: <strong>{patients.length}</strong></p>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-xl text-lg transition"
          >
            {submitting ? "Submitting Assessment..." : "Calculate Risk & Submit Results"}
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">{error}</div>}

        {result && (
          <div className="bg-white border border-green-200 rounded-2xl p-8 mb-10 shadow">
            <h2 className="text-2xl font-bold mb-4">✅ Submission Result</h2>
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Patients Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Patient ID</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-center">Age</th>
                  <th className="px-6 py-4 text-center">BP</th>
                  <th className="px-6 py-4 text-center">Temp (°F)</th>
                  <th className="px-6 py-4 text-center">BP Risk</th>
                  <th className="px-6 py-4 text-center">Temp Risk</th>
                  <th className="px-6 py-4 text-center">Age Risk</th>
                  <th className="px-6 py-4 text-center font-bold">Total Risk</th>
                  <th className="px-6 py-4 text-center">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scoredPatients.map((p, i) => {
                  const original = patients[i];
                  return (
                    <tr key={p.patient_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{p.patient_id}</td>
                      <td className="px-6 py-4">{p.name}</td>
                      <td className="px-6 py-4 text-center">{original.age}</td>
                      <td className="px-6 py-4 text-center font-mono">{original.blood_pressure}</td>
                      <td className="px-6 py-4 text-center">{original.temperature}</td>
                      <td className="px-6 py-4 text-center">{p.bpScore}</td>
                      <td className="px-6 py-4 text-center">{p.tempScore}</td>
                      <td className="px-6 py-4 text-center">{p.ageScore}</td>
                      <td className="px-6 py-4 text-center font-bold text-lg">
                        {p.totalRisk >= 4 ? (
                          <span className="text-red-600">{p.totalRisk}</span>
                        ) : (
                          p.totalRisk
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.hasIssues ? (
                          <span className="text-amber-600 text-sm">{p.issues.join(", ")}</span>
                        ) : (
                          "✅"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}