# Let Me AI That For You 🤖

A passive-aggressive way to show people they could have just asked AI directly. This is like [lmgtfy.com](https://lmgtfy.com) but for AI - you send someone a link with a question, they see a typing animation in a ChatGPT-style UI, and get a real AI response streamed live.

## 🎯 Features

- **ChatGPT-style UI**: Convincing dark theme interface that mimics ChatGPT
- **Typing Animations**: Realistic typing effect that "types out" the question
- **Streaming AI Responses**: Real-time responses from Anthropic's Claude Haiku
- **Passive-Aggressive Messaging**: Subtle "Could have just asked AI yourself 🙃" hint
- **Mobile Responsive**: Works perfectly on all devices
- **URL-Encoded Questions**: No database needed - questions are encoded in the URL
- **One-Click Sharing**: Easy link generation and copying

## 🚀 Live Demo

Visit [let-me-ai-that.vercel.app](https://let-me-ai-that.vercel.app) (when deployed)

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **AI**: Anthropic Claude 3.5 Haiku with streaming
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React

## 📖 How It Works

1. **Homepage**: User types a question and clicks "Generate Link"
2. **Generated Link**: Creates a URL like `/?q=how+do+i+center+a+div`
3. **When someone opens the link**:
   - See a typing animation that "types out" the question
   - Question appears as a user message in the chat
   - AI response streams in real-time from Claude Haiku
   - Passive-aggressive message appears with share option

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/franacc12312/let-me-ai-that.git
   cd let-me-ai-that
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Build for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/franacc12312/let-me-ai-that)

1. Connect your GitHub repository to Vercel
2. Add your `ANTHROPIC_API_KEY` environment variable in Vercel dashboard
3. Deploy!

### Other Platforms

This is a standard Next.js app and can be deployed on:
- Netlify
- Railway
- AWS Amplify
- Cloudflare Pages
- Any Node.js hosting service

Just make sure to set the `ANTHROPIC_API_KEY` environment variable.

## 🎨 Customization

### Changing the AI Model

Edit `src/app/api/chat/route.ts`:

```typescript
const stream = await anthropic.messages.create({
  model: 'claude-3-5-haiku-20241022', // Change this
  max_tokens: 1000,
  // ...
});
```

Available models:
- `claude-3-5-haiku-20241022` (fastest, cheapest)
- `claude-3-5-sonnet-20241022` (balanced)
- `claude-3-opus-20240229` (most capable)

### Customizing the System Prompt

In the same file, modify the `system` parameter:

```typescript
system: 'You are a helpful AI assistant. Answer questions concisely and helpfully.',
```

### Styling Changes

The app uses Tailwind CSS. Key files:
- `src/app/globals.css` - Global styles and animations
- `src/app/page.tsx` - Main component with all the styling

## 📄 API Reference

### POST /api/chat

Streams AI responses from Anthropic Claude.

**Request Body:**
```json
{
  "message": "How do I center a div?"
}
```

**Response:**
Server-sent events stream with text deltas.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎭 Inspiration

Inspired by the classic "Let Me Google That For You" but updated for the AI era. Sometimes people need a gentle (passive-aggressive) nudge to realize they could have just asked ChatGPT, Claude, or any other AI assistant directly.

## ⚠️ Disclaimer

This is meant to be a fun, educational project. Use responsibly and don't be too passive-aggressive with your friends! 😉

---

**Built with ❤️ by [franacc12312](https://github.com/franacc12312)**