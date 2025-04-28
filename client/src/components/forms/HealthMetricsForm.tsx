import React, { useState } from 'react';
import { useNostr } from '../../lib/NostrProvider';
import { publishMetric, CLIENT_KINDS } from '../../lib/nostr';

const HealthMetricsForm: React.FC = () => {
  const { isAuthenticated } = useNostr();
  const [formData, setFormData] = useState({
    metricType: 'weight',
    value: '',
    unit: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const metricTypeOptions = [
    { value: 'weight', label: 'Weight', kind: CLIENT_KINDS.WEIGHT, defaultUnit: 'kg' },
    { value: 'height', label: 'Height', kind: CLIENT_KINDS.HEIGHT, defaultUnit: 'cm' },
    { value: 'age', label: 'Age', kind: CLIENT_KINDS.AGE, defaultUnit: 'years' },
    { value: 'gender', label: 'Gender', kind: CLIENT_KINDS.GENDER, defaultUnit: '' },
    { value: 'fitnessLevel', label: 'Fitness Level', kind: CLIENT_KINDS.FITNESS_LEVEL, defaultUnit: '' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If changing metric type, update the unit field with the default unit
    if (name === 'metricType') {
      const selectedMetric = metricTypeOptions.find(option => option.value === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        unit: selectedMetric?.defaultUnit || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setMessage({ text: 'Please connect your Nostr account first', type: 'error' });
      return;
    }

    if (!formData.value) {
      setMessage({ text: 'Please enter a value', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const selectedMetric = metricTypeOptions.find(option => option.value === formData.metricType);
      if (!selectedMetric) throw new Error('Invalid metric type');

      // Create the content object based on metric type
      const content = {
        value: formData.value,
        unit: formData.unit,
        notes: formData.notes,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await publishMetric(selectedMetric.kind, content);
      
      setMessage({ text: 'Metric published successfully!', type: 'success' });
      
      // Reset form
      setFormData({
        metricType: 'weight',
        value: '',
        unit: 'kg',
        notes: ''
      });
    } catch (error) {
      console.error('Error publishing metric:', error);
      setMessage({ text: 'Failed to publish metric. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg my-4">
        <p className="text-yellow-700">Connect your Nostr account to add health metrics.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Add Health Metric</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="metricType" className="block text-sm font-medium text-gray-700 mb-1">
            Metric Type
          </label>
          <select
            id="metricType"
            name="metricType"
            value={formData.metricType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select metric type"
          >
            {metricTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <input
            type="text"
            id="value"
            name="value"
            value={formData.value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter value"
            aria-label="Metric value"
          />
        </div>
        
        {(['weight', 'height'].includes(formData.metricType)) && (
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter unit"
              aria-label="Measurement unit"
            />
          </div>
        )}
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes here"
            aria-label="Additional notes"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Metric'}
        </button>
      </form>
    </div>
  );
};

export default HealthMetricsForm; 