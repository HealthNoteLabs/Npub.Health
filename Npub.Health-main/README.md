# Npub.Health

A health metrics dashboard application that allows users to view, manage, and analyze their personal health data from the Nostr ecosystem. This simplified version focuses on core health metrics and workout data.

## Features

- **Health Metrics Dashboard**: View your health metrics (weight, height, age, gender, fitness level) in a unified dashboard
- **Workout Data Viewer**: Display completed workout records and summary statistics
- **Nostr Integration**: Connect to Nostr relays for fetching and publishing health data
- **Privacy-First**: Control where your health data is stored and who can access it

## Health Metrics Supported

This implementation focuses on the following data kinds from Nostr:

- **Kind 1351**: Weight
- **Kind 1352**: Height
- **Kind 1353**: Age
- **Kind 1354**: Gender
- **Kind 1355**: Fitness Level
- **Kind 1301**: Workout Records

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- A Nostr-compatible browser extension (e.g., nos2x or Alby)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/npub-health.git
   cd npub-health
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Usage

1. Connect your Nostr account using the "Connect to Nostr" button in the header
2. View your existing health metrics on the Dashboard page
3. Add new health metrics using the "Add Health Metric" page
4. Log your workouts using the "Log Workout" page

## Technology Stack

- React
- TypeScript
- Tailwind CSS
- nostr-tools (for Nostr integration)
- React Router

## Development

### Project Structure

```
client/
  ├── src/
  │   ├── components/
  │   │   ├── dashboard/
  │   │   │   └── HealthDashboard.tsx
  │   │   ├── forms/
  │   │   │   ├── HealthMetricsForm.tsx
  │   │   │   └── WorkoutForm.tsx
  │   │   └── ui/
  │   │       └── Header.tsx
  │   ├── lib/
  │   │   ├── nostr.ts
  │   │   └── NostrProvider.tsx
  │   ├── App.css
  │   ├── App.tsx
  │   └── index.tsx
  └── package.json
```

### Nostr Integration

Npub.Health uses the nostr-tools library to interact with Nostr relays. The integration:

1. Connects to multiple relays for data redundancy
2. Fetches health metrics and workout records
3. Publishes new metrics and workout data
4. Uses public key authentication through browser extensions

## Roadmap

- Add metric history visualization
- Support for additional health metrics
- Data import/export features
- Enhanced privacy controls
- Mobile app version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Nostr Protocol](https://github.com/nostr-protocol/nostr) for the decentralized social network protocol
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) for the JavaScript Nostr implementation 