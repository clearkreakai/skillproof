'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AssessmentSummary {
  id: string;
  created_at: string;
  company_name: string;
  role_title: string;
  status: string;
  response_count: number;
  completed_count: number;
}

interface ResultSummary {
  id: string;
  created_at: string;
  assessment_id: string;
  company_name: string;
  role_title: string;
  overall_score: number;
  candidate_name?: string;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assessments' | 'results'>('results');
  const [error, setError] = useState('');

  // Simple auth check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic password - in production use proper auth
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'mettle2026') {
      setAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
        setResults(data.results || []);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Mettle Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mettle Admin Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('admin_auth');
              setAuthenticated(false);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Assessments</p>
            <p className="text-3xl font-bold text-gray-900">{assessments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Completed Results</p>
            <p className="text-3xl font-bold text-gray-900">{results.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Avg Score</p>
            <p className="text-3xl font-bold text-gray-900">
              {results.length > 0
                ? Math.round(results.reduce((a, r) => a + r.overall_score, 0) / results.length)
                : '--'}
              %
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-3xl font-bold text-gray-900">
              {results.filter(r => {
                const today = new Date().toDateString();
                return new Date(r.created_at).toDateString() === today;
              }).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Results ({results.length})
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'assessments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Assessments ({assessments.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading...</p>
          </div>
        ) : activeTab === 'results' ? (
          /* Results Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No results yet. Candidates will appear here once they complete assessments.
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(result.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.role_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(result.overall_score)}`}>
                          {result.overall_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/results/${result.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          target="_blank"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Assessments Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No assessments created yet.
                    </td>
                  </tr>
                ) : (
                  assessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(assessment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assessment.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assessment.role_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assessment.completed_count} / {assessment.response_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assessment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assessment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/assess/${assessment.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                          target="_blank"
                        >
                          Take Test
                        </Link>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/assess/${assessment.id}`
                            );
                            alert('Link copied!');
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Copy Link
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
