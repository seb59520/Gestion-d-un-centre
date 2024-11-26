import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import type { TimeEntry } from '../../types';

interface TimeTrackingHistoryProps {
  entries: TimeEntry[];
}

export default function TimeTrackingHistory({ entries }: TimeTrackingHistoryProps) {
  const getEntryLabel = (type: TimeEntry['type']) => {
    switch (type) {
      case 'arrival':
        return 'Started work';
      case 'break_start':
        return 'Started break';
      case 'break_end':
        return 'Ended break';
      case 'departure':
        return 'Ended work';
      default:
        return '';
    }
  };

  const getEntryColor = (type: TimeEntry['type']) => {
    switch (type) {
      case 'arrival':
      case 'break_end':
        return 'text-green-600';
      case 'break_start':
        return 'text-yellow-600';
      case 'departure':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!entries.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32 text-gray-500">
          No time entries for this day
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Clock className="h-5 w-5 text-gray-400 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Time History</h2>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {entries.map((entry, entryIdx) => (
            <li key={entry.id}>
              <div className="relative pb-8">
                {entryIdx !== entries.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        entry.type === 'arrival' || entry.type === 'break_end'
                          ? 'bg-green-100'
                          : entry.type === 'break_start'
                          ? 'bg-yellow-100'
                          : 'bg-red-100'
                      }`}
                    >
                      <Clock className={`h-5 w-5 ${getEntryColor(entry.type)}`} />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">
                        {getEntryLabel(entry.type)}
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {format(new Date(entry.timestamp), 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}