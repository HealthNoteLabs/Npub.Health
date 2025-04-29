import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '../../components/NostrProvider';
import { fetchHealthHistory, CLIENT_KINDS } from '../../lib/nostr';
import MetricHistoryChart from './MetricHistoryChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface MetricHistoryData {
  weight: Array<{ timestamp: number; value: number; unit?: string; displayValue?: string; displayUnit?: string }>;
  height: Array<{ timestamp: number; value: number; unit?: string; displayValue?: string; displayUnit?: string }>;
  age: Array<{ timestamp: number; value: number; unit?: string }>;
}

type MetricType = 'weight' | 'height' | 'age';

const MetricHistoryDetail: React.FC = () => {
  const { metricType } = useParams<{ metricType: MetricType }>();
  const navigate = useNavigate();
  const { publicKey } = useNostr();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<MetricHistoryData | null>(null);

  useEffect(() => {
    if (!publicKey || !metricType) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch historical data
        const historyData = await fetchHealthHistory(publicKey);
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading health history data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [publicKey, metricType]);

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please connect your Nostr account to view your health data.</p>
      </div>
    );
  }

  if (!metricType || !['weight', 'height', 'age'].includes(metricType)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Invalid metric type.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading your health history data...</p>
      </div>
    );
  }

  // Determine the appropriate data, unit and kind based on metric type
  let data: Array<{ timestamp: number; value: number; unit?: string; displayValue?: string; displayUnit?: string }> = [];
  let unit = '';
  let kind = 0;
  let title = '';
  let description = '';

  switch (metricType) {
    case 'weight':
      data = history?.weight || [];
      unit = 'lbs';
      kind = CLIENT_KINDS.WEIGHT;
      title = 'Weight History';
      description = 'Track your weight changes over time';
      break;
    case 'height':
      data = history?.height || [];
      unit = 'ft-in';
      kind = CLIENT_KINDS.HEIGHT;
      title = 'Height History';
      description = 'Your recorded height measurements';
      break;
    case 'age':
      data = history?.age || [];
      unit = 'years';
      kind = CLIENT_KINDS.AGE;
      title = 'Age Records';
      description = 'Your recorded age updates';
      break;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <div className="w-full">
        <MetricHistoryChart
          title={title}
          historyData={data}
          unit={unit}
          displayUnit={metricType === 'height' ? 'ft-in' : unit}
          className="w-full"
        />
      </div>

      {data.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detailed History</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...data]
                  .sort((a, b) => b.timestamp - a.timestamp) // Sort newest first
                  .map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metricType === 'height' && item.displayValue 
                          ? item.displayValue 
                          : item.value} {metricType === 'height' && item.displayUnit ? '' : unit}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-medium text-yellow-800">No History Data</h3>
          <p className="mt-2 text-sm text-yellow-700">
            There is no historical data available for your {metricType}. Data will appear here once you have multiple recordings.
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-8">
        <h3 className="text-lg font-medium text-blue-800">About Nostr Health Data</h3>
        <p className="mt-2 text-sm text-blue-700">
          Health metrics are stored using the NIP-101h specification (kinds 1351-1355). To see your data here,
          you need to have published these metrics through compatible Nostr health apps. The dashboard automatically
          fetches the most recent data for each metric type associated with your Nostr pubkey.
        </p>
      </div>
    </div>
  );
};

export default MetricHistoryDetail; 