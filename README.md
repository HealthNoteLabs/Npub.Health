# Npub.Health

A decentralized health records platform built on Nostr protocol.

## Project Overview

Npub.Health provides a secure, user-controlled platform for managing health data using the Nostr protocol. This application gives individuals ownership over their health information while enabling selective sharing with healthcare providers.

## Features

- Secure health record storage using Nostr protocol
- User-controlled data sharing and permissions
- Provider verification system
- Cross-platform support (web, mobile)
- End-to-end encryption for sensitive health data

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js
- **Database**: SQLite with Drizzle ORM
- **Protocol**: Nostr

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/HealthNoteLabs/Npub.Health.git
   cd Npub.Health
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Project Structure

```
Npub.Health/
├── client/           # Frontend React application
├── server/           # Backend Node.js server
├── shared/           # Shared utilities and types
├── scripts/          # Utility scripts
└── ...
```

## Development

### Running the app in development mode

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or feedback, please open an issue on this repository. 