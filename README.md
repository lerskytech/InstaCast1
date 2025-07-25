# Instacast - Peer-to-Peer Podcast Recording App

Instacast is a cross-platform, peer-to-peer podcast recording application built with React. The app allows podcast hosts to record high-quality audio from multiple guests connected over a local network without the need for server infrastructure.

## Features

### For Hosts

- One-click setup to start a podcast session
- Camera and microphone integration
- Real-time view of connected guests
- Ability to mute/unmute any participant
- Session recording with downloadable audio files
- Central mixing of all audio streams

### For Guests

- Simple interface to join a host's session
- Microphone integration with audio level indicators
- Mute/unmute capabilities
- Connection status monitoring

## Technology Stack

- **React**: UI framework
- **React Router**: Navigation and routing
- **PeerJS**: WebRTC peer-to-peer communication wrapper
- **Browser APIs**: MediaDevices, MediaStream, MediaRecorder

## Getting Started

In the project directory, you can run:
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Important Notes

- Both hosts and guests must be connected to the same local network for optimal performance
- Camera and microphone permissions are required
- For best results, use Chrome, Firefox, or Edge browsers
- The WebRTC technology works best over local networks; performance over the internet may vary

## Using Instacast

### As a Host

1. Click "Start as Host" on the homepage
2. Grant camera and microphone permissions when prompted
3. Wait for guests to connect (they will appear in the guests list)
4. Use the mute controls to manage audio for each guest
5. Click "Start Recording" when ready to begin
6. Click "Stop Recording" when finished to download the audio file

### As a Guest

1. Click "Join as Guest" on the homepage
2. Grant microphone permissions when prompted
3. Select a host from the available hosts list (or enter a host ID manually)
4. Click "Join" to connect to the host
5. Use the mute button to control your microphone

## Development Workflow

### Installation

To set up the project locally:

```
npm install
```

### Available Scripts

- **Start Development Server:**

  ```
  npm start
  ```

  This runs the app in development mode at [http://localhost:3000](http://localhost:3000).

- **Run Linting:**

  ```
  npm run lint
  ```

  This checks your code for any linting errors or warnings.

- **Auto-fix Linting Issues:**

  ```
  npm run lint:fix
  ```

  This automatically fixes many common linting issues.

- **Format Code:**

  ```
  npm run format
  ```

  This formats your code using Prettier.

- **Build for Production:**
  ```
  npm run build
  ```
  This builds the app for production to the `build` folder. It automatically runs linting and formatting before building.

## Deployment

### Netlify Deployment

This app is designed to be deployed on Netlify:

```
npm run build
```

This builds the app for production to the `build` folder.\
Upload the contents of the `build` folder to Netlify, or use the Netlify CLI for deployment:

```
npm install -g netlify-cli
netlify deploy
```

### Continuous Integration

The project is configured to handle warnings as warnings (not errors) during CI builds. This is accomplished by:

1. Setting `CI=false` in the build script in package.json
2. Setting `CI=false` in the Netlify environment variables (netlify.toml)

### Troubleshooting Build Issues

If you encounter build errors:

1. **ESLint Warnings:** Run `npm run lint:fix` to automatically fix most linting issues.
2. **React Hook Warnings:** Check for missing dependencies in useEffect and useCallback hooks.
3. **CI Environment Issues:** Make sure the CI environment variable is set to false for Netlify builds.

### Local Network Considerations

Note that when deployed to a public URL, users must be on the same local network for optimal peer-to-peer connectivity.\

## Dependencies

- react
- react-dom
- react-router-dom
- peerjs

## Limitations and Future Improvements

- Currently supports WebRTC-compatible browsers only
- Limited error recovery for dropped connections
- Future versions could add:
  - Persistent recording storage
  - Text chat between participants
  - Connection via internet (not just LAN)
  - Multiple audio tracks for post-processing

## Architecture

The app follows a clean, modular React architecture:

- **components/**: UI components (Home, Host, Guest)
- **contexts/**: React contexts for state management
- **hooks/**: Custom React hooks (useMedia)
- **utils/**: Utility functions and classes (recording)

## Browser Support

Instacast requires browsers with support for:

- WebRTC (RTCPeerConnection)
- MediaDevices API
- MediaRecorder API
- AudioContext

## License

MIT

## GitHub Repository

The source code is available on GitHub at: [lerskytech/InstaCast1](https://github.com/lerskytech/InstaCast1)
