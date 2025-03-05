import React from 'react';
import ReactDOM from 'react-dom/client'; // This is the correct import for React 18+
import AnalyticsChart from './AnalyticsChart';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tp-analytics-container');
    if (container) {
        const root = ReactDOM.createRoot(container); // Use createRoot from react-dom/client
        root.render(<AnalyticsChart />);
    }
});
