import React, { useState } from 'react';
import { useNostr } from '../../lib/NostrProvider';
import { publishMetric, CLIENT_KINDS } from '../../lib/nostr';

interface WorkoutFormData {
  type: string;
  duration: string;
  date: string;
  intensity: string;
  notes: string;
}

const WorkoutForm: React.FC = () => {
  const { isAuthenticated } = useNostr();
  const [formData, setFormData] = useState<WorkoutFormData>({
    type: '',
    duration: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    intensity: 'medium',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const intensityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setMessage({ text: 'Please connect your Nostr account first', type: 'error' });
      return;
    }

    // Validate required fields
    if (!formData.type || !formData.duration || !formData.date) {
      setMessage({ text: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Create workout record content
      const workout = {
        type: formData.type,
        duration: parseInt(formData.duration, 10) || 0,
        date: new Date(formData.date).toISOString(),
        intensity: formData.intensity,
        notes: formData.notes,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await publishMetric(CLIENT_KINDS.WORKOUT, workout);
      
      setMessage({ text: 'Workout recorded successfully!', type: 'success' });
      
      // Reset form
      setFormData({
        type: '',
        duration: '',
        date: new Date().toISOString().split('T')[0],
        intensity: 'medium',
        notes: ''
      });
    } catch (error) {
      console.error('Error recording workout:', error);
      setMessage({ text: 'Failed to record workout. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg my-4">
        <p className="text-yellow-700">Connect your Nostr account to log workouts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Log Workout</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Workout Type*
          </label>
          <input
            id="type"
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="e.g., Running, Weightlifting, Yoga"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Workout type"
            required
          />
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)*
          </label>
          <input
            id="duration"
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Duration in minutes"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Workout duration in minutes"
            required
          />
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date*
          </label>
          <input
            id="date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Workout date"
            required
          />
        </div>
        
        <div>
          <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 mb-1">
            Intensity
          </label>
          <select
            id="intensity"
            name="intensity"
            value={formData.intensity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Workout intensity"
          >
            {intensityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
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
            placeholder="Any additional details about your workout"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Workout notes"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Saving...' : 'Log Workout'}
        </button>
      </form>
    </div>
  );
};

export default WorkoutForm; 