# Real-time Voice Chat Template

A barebone template for building real-time voice applications with OpenAI's API and WebRTC. Features built-in arXiv paper search capabilities and customizable AI instructions.

## Features

- Real-time voice communication with AI
- Built-in arXiv paper search functionality
- Live event display
- Customizable AI instructions
- Clean, dark-themed UI
- WebRTC-based audio streaming

## ❤️ Support & Get 400+ AI Projects
This is one of 400+ fascinating projects in my collection! Support me on Patreon to get:

- 🎯 Access to 400+ AI projects (and growing daily!)
- 📥 Full source code & detailed explanations
- 📚 1000x Cursor Course
- 🎓 Live coding sessions & AMAs
- 💬 1-on-1 consultations (higher tiers)
- 🎁 Exclusive discounts on AI tools

## Technical Stack

- **Backend**: FastAPI
- **Frontend**: HTML, JavaScript, TailwindCSS, DaisyUI
- **Real-time Communication**: WebRTC
- **API Integration**: OpenAI Real-time API, arXiv API
- **Styling**: Dark mode with animations

## Custom Instructions System

The template includes a two-layer instruction system:

1. **Backend Instructions** (main.py):
   - Basic AI behavior guidelines
   - Function-specific instructions
   - Voice interaction rules

2. **Frontend Instructions** (app.js):
   - Detailed AI role configuration
   - Context and guidelines
   - Function usage specifications
   - Real-time session updates

## ArXiv Integration

Built-in functionality to search and fetch latest papers:
- Real-time paper search
- Automatic result parsing
- Title, authors, summary, and link extraction
- Configurable result limits

## Setup

1. Set your OpenAI API key:
```bash
# Windows
set OPENAI_API_KEY=your_api_key_here

# Linux/Mac
export OPENAI_API_KEY=your_api_key_here
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python main.py
```

4. Open in browser:
```
http://127.0.0.1:8000
```

## Usage Examples

1. **Start Voice Chat**:
   - Click "Start Voice Chat"
   - Grant microphone permissions
   - Wait for connection confirmation

2. **Search Papers**:
   - "Find recent papers about machine learning"
   - "Show me the latest research on AI"
   - "Search for papers about neural networks"

3. **End Session**:
   - Click "Stop Voice Chat"
   - Resources are automatically cleaned up

## Requirements

- Python 3.7+
- Modern web browser with WebRTC support
- Microphone access
- OpenAI API key

## Customization

1. **Modify AI Instructions**:
   - Edit `DEFAULT_INSTRUCTIONS` in main.py
   - Update `SESSION_CONFIG` in app.js

2. **Adjust ArXiv Settings**:
   - Modify `maxResults` parameter
   - Customize paper formatting
   - Add additional search parameters

3. **UI Customization**:
   - Modify TailwindCSS classes
   - Update DaisyUI theme
   - Customize animations