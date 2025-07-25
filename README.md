# DuhLaurien's Hand-Hacked RSS Feed Checker

A web-based application that validates and analyzes RSS feeds for Podcasting 2.0 compliance, providing detailed feedback on feed structure, metadata, and Podcasting 2.0 specific elements.

## 🎯 Project Overview

This application helps podcast creators, hosting platforms, and developers ensure their RSS feeds meet Podcasting 2.0 standards. It provides comprehensive validation feedback, educational content, and actionable recommendations for feed optimization.

### Key Features
- **RSS Feed Validation**: Parse and validate RSS feeds for Podcasting 2.0 compliance
- **Comprehensive Analysis**: Check required and optional Podcasting 2.0 elements
- **Educational Content**: Learn about validation rules and best practices
- **Modern UI**: Clean, responsive interface with dark/light theme support
- **Export Reports**: Save validation results in JSON and CSV formats

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd dl-rss-checker

# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Task Master Integration

This project uses [Claude Task Master](https://github.com/eyaltoledano/claude-task-master) for AI-powered task management and development assistance.

### Task Master Setup
The project is configured with Task Master and includes:
- **PRD**: Comprehensive Product Requirements Document
- **Tasks**: 5 structured development tasks with priorities and dependencies
- **Templates**: Reusable templates for future projects

### Available Tasks
1. **Task 1**: Enhance RSS Feed Parsing and Validation (High Priority)
2. **Task 2**: Improve User Interface and User Experience (High Priority)
3. **Task 3**: Implement CORS Proxy and Feed Access (Medium Priority)
4. **Task 4**: Add Educational Content and Documentation (Medium Priority)
5. **Task 5**: Export and Reporting Functionality (Low Priority)

### Using Task Master
```bash
# List all tasks
npx task-master list

# Show next recommended task
npx task-master next

# Show specific task(s)
npx task-master show 1,3,5
```

### AI Assistant Commands
In your editor's AI chat, you can:
- "What's the next task I should work on?"
- "Can you help me implement task 1?"
- "Show me tasks 1, 3, and 5"
- "Can you help me expand task 4?"

## 🛠️ Technology Stack

- **Frontend**: React 19+ with TypeScript
- **Styling**: CSS3 with modern design principles
- **XML Parsing**: xml2js library
- **HTTP Requests**: Axios for API calls
- **Build Tool**: Create React App
- **Task Management**: Claude Task Master

## 📁 Project Structure

```
dl-rss-checker/
├── .taskmaster/           # Task Master configuration and tasks
│   ├── config.json       # Task Master project configuration
│   ├── docs/             # Project documentation
│   │   └── prd.txt       # Product Requirements Document
│   ├── tasks/            # Development tasks
│   └── templates/        # Reusable templates
├── public/               # Static assets
├── src/                  # Source code
│   ├── components/       # React components
│   ├── services/         # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── package.json
└── README.md
```

## 🎨 Features

### Core Functionality
- RSS feed URL input and validation
- Podcasting 2.0 compliance checking
- Structured validation results with severity levels
- Compliance scoring and recommendations

### User Experience
- Modern, responsive design
- Dark/light theme toggle
- Accessibility compliance (WCAG 2.1 AA)
- Mobile-friendly interface
- Real-time validation feedback

### Advanced Features
- CORS proxy support for restricted feeds
- Educational content and documentation
- Export functionality (JSON, CSV)
- Feed comparison capabilities (planned)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📦 Build and Deployment

```bash
# Build for production
npm run build

# Deploy to static hosting
# The build folder contains the production-ready application
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Podcasting 2.0 Specification](https://github.com/Podcastindex-org/podcast-namespace)
- [RSS 2.0 Specification](https://cyber.harvard.edu/rss/rss.html)
- [Claude Task Master](https://github.com/eyaltoledano/claude-task-master)

## 📞 Support

For questions or support, please open an issue in the repository.
