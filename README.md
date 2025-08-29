# PromptBoard

![PromptBoard Banner](assets/readme-banner.svg)

A fast, client-side prompt library with tags, instant search, one-click copy, and JSON/Markdown export. Tailwind + vanilla JS.

## 🚀 Features

- **Instant Search**: Lightning-fast prompt filtering and search
- **Tag System**: Organize prompts with custom tags
- **One-Click Copy**: Copy prompts to clipboard instantly  
- **Import/Export**: JSON and Markdown export/import support
- **Client-Side**: No backend required, works entirely in the browser
- **Dark Mode**: Beautiful dark interface by default
- **Responsive**: Works seamlessly on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Storage**: Local Storage API
- **Build**: No build process required
- **Deploy**: Vercel-ready static site

## 🏃‍♂️ Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/G-Reg04/promptboard-greg.git
   cd promptboard-greg
   ```

2. **Open in browser**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Or simply open index.html in your browser
   ```

3. **Visit** `http://localhost:8000`

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/G-Reg04/promptboard-greg)

Or manually:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

## 📁 Project Structure

```
promptboard-greg/
├── index.html          # Main HTML file
├── app.js              # Application logic
├── assets/
│   ├── icon.svg        # App favicon
│   └── readme-banner.svg # README banner
├── vercel.json         # Vercel configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🎯 Roadmap

- [ ] CRUD operations for prompts
- [ ] Advanced search and filtering
- [ ] Tag management system
- [ ] Copy to clipboard functionality
- [ ] JSON/Markdown export
- [ ] Import from various formats
- [ ] Keyboard shortcuts
- [ ] Prompt templates
- [ ] Bulk operations
- [ ] PWA support

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**PromptBoard** - Organize your prompts, supercharge your workflow! ⚡
