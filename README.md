# DuhLaurien's Hand-Hacked RSS Feed Checker

![Project Image](public/project-image.jpg)

A modern RSS feed checker and podcast episode viewer with **Value 4 Value** support, featuring glassmorphism UI design and comprehensive Podcasting 2.0 validation.

## 🌟 Features

- **🎵 Podcast Episode Viewer**: Browse and explore podcast episodes with detailed track information
- **💰 Value 4 Value Support**: Display value recipient information and payment splits for podcast tracks
- **🎨 Modern Glassmorphism UI**: Beautiful transparent design with custom color palette
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **🔍 RSS/Atom Feed Support**: Parse and validate RSS and Atom feeds
- **⚡ Real-time Validation**: Instant feedback on feed structure and Podcasting 2.0 compliance
- **🌐 CORS Proxy Support**: Handle cross-origin requests for remote feeds
- **📊 Chapter Support**: Display detailed track listings with timestamps

## 🚀 Live Demo

**Visit the live application:** [https://dl-rss-checker-a2mqgqyoz-chadfs-projects.vercel.app](https://dl-rss-checker-a2mqgqyoz-chadfs-projects.vercel.app)

## 🎯 Test with Homegrown Hits

Try the application with the Homegrown Hits podcast feed:
```
https://feed.homegrownhits.xyz/feed.xml
```

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: CSS3 with Glassmorphism effects
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **XML Parsing**: Fast XML Parser
- **Deployment**: Vercel

## 🎨 Design Features

- **Glassmorphism UI**: Transparent backgrounds with backdrop blur effects
- **Custom Color Palette**: 
  - Primary: `#d2cbf0` (Light Purple)
  - Secondary: `#5e618f` (Dark Purple)
  - Background: `#140d1b` (Dark Background)
  - Accent: `#9cc2d1` (Light Blue)
- **Responsive Layout**: Adapts to all screen sizes
- **Smooth Animations**: Hover effects and transitions

## 🔧 Value 4 Value Features

- **Value Recipient Display**: Show payment splits for podcast hosts and guests
- **Remote Feed Integration**: Fetch value recipient data from external podcast feeds
- **Payment Percentage Breakdown**: Detailed percentage calculations for each recipient
- **Lightning Address Links**: Direct links to Lightning addresses for payments

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ChadFarrow/duhlaurien-hand-hacked-rss-checker.git
   cd duhlaurien-hand-hacked-rss-checker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🌐 Deployment

The application is deployed on Vercel and automatically updates when changes are pushed to the main branch.

### Environment Variables (Optional)

For enhanced functionality, you can set up Podcast Index API credentials:

1. Get API credentials from [https://podcastindex.org/developer](https://podcastindex.org/developer)
2. Create a `.env.local` file in the project root:
   ```
   REACT_APP_PODCAST_INDEX_API_KEY=your_api_key_here
   REACT_APP_PODCAST_INDEX_API_SECRET=your_api_secret_here
   ```
3. Restart the development server

## 🎵 Supported Feed Types

- **RSS 2.0**: Full support with Podcasting 2.0 extensions
- **Atom**: Basic support for Atom feeds
- **Podcasting 2.0**: Value 4 Value, chapters, transcripts, soundbites

## 🔍 Validation Features

- **RSS Structure Validation**: Check required and optional elements
- **Podcasting 2.0 Compliance**: Validate Value 4 Value implementation
- **Chapter Support**: Parse and display podcast chapters
- **Value Recipient Validation**: Verify payment split configurations

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT License - feel free to use this code for your own projects.

## 🙏 Acknowledgments

- **Homegrown Hits** for the project image and inspiration
- **Podcasting 2.0** community for the Value 4 Value specification
- **Vercel** for hosting and deployment
- **React** team for the amazing framework

---

**Built with ❤️ by DuhLaurien**
