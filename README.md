# Golf Shot Tracker App

A mobile app for tracking golf shots, swing counts, and club distances per hole on a map. Designed for golfers who want to analyze their performance and keep a round-by-round record.

## Features

- 📍 **Map-based shot tracking:** Set start and end points for each shot on a satellite map.
- 🏌️ **Per-hole shot history:** Record and view shots for each hole (supports 9 or 18 holes).
- ⛳ **Swing counter:** Track swings per hole, automatically resets when you change holes.
- 🏆 **Club selection:** Choose your club for each shot and see distance per club.
- 🔄 **Easy controls:** Floating control panel for centering map, setting start, resetting points, and accessing settings.
- ⚙️ **Settings:** Switch between 9 and 18 hole rounds.
- 🎯 **Visual feedback:** End point marker with distance tooltip and highlight circle.
- 📱 **Mobile-friendly UI:** Clean, touch-optimized design for use on the course.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/nicolasmoyano/WhackTrack
   cd WhackTrack
   ```

2. **Install dependencies:**

   ```sh
   yarn install
   # or
   npm install
   ```

3. **Start the app:**

   ```sh
   expo start
   ```

4. **Run on your device:**
   - Use the Expo Go app on your phone, or
   - Run on an emulator/simulator.

## Usage

- Tap the **flag** to set your start point (your location or a map point).
- Tap the map to set your end point.
- Select your club and tap **Add swing** to record a shot.
- Use the arrows to navigate between holes.
- View your shot history and swing count per hole.
- Access settings (gear icon) to switch between 9 and 18 holes.

## Screenshots

_Add screenshots here if available._

## Tech Stack

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [@expo/vector-icons](https://docs.expo.dev/guides/icons/)

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

**Enjoy your golf rounds and track your progress!**
