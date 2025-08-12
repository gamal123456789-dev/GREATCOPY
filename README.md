# Gearscore - Gaming Boosting Platform 🎮

Professional website for game development services and technical support for players.

## 🚀 Features

- **Advanced Authentication**: Discord OAuth and traditional login support
- **Admin Dashboard**: Order and user management
- **Real-time Chat**: Socket.IO for direct communication
- **Secure Payment System**: Secure payment processing
- **Real-time Notifications**: Web alerts for updates
- **Advanced Security**: OWASP Top 10 protection
- **Responsive Design**: Works on all devices

## 🛠️ Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.IO
- **Security**: Rate limiting, Input validation, Security headers
- **Testing**: Jest, React Testing Library

## 📋 System Requirements

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🔧 Installation and Local Setup

### 1. Clone the Project
```bash
git clone <repository-url>
cd gearscore-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb gearscoredatabase

# Run migrations
npx prisma migrate dev

# Add initial data (optional)
npx prisma db seed
```

### 4. Environment Variables Setup
Copy `.env.example` file to `.env` and update the values:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/gearscoredatabase"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://gear-score.com"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Email
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Website URL
NEXT_PUBLIC_BASE_URL="https://gear-score.com"

# VAPID keys for notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

### 5. Start the Server
```bash
# Start development server
npm run dev

# Or start production server
npm run build
npm start
```

The website will be available at: `https://gear-score.com` or `http://localhost:5200` for local development

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Security tests
npm test tests/security.test.js
```

## 📁 Project Structure

```
├── components/          # React components
├── pages/              # Next.js pages
│   ├── api/           # API endpoints
│   ├── admin/         # Admin pages
│   └── auth/          # Authentication pages
├── lib/               # Helper libraries
├── hooks/             # Custom React hooks
├── context/           # React context
├── prisma/            # Database configuration
├── public/            # Static files
├── styles/            # CSS files
├── __tests__/         # Unit tests
└── types/             # TypeScript definitions
```

## 🔐 Security

The project includes comprehensive protection from:
- ✅ Broken Access Control
- ✅ Cryptographic Failures
- ✅ Injection Attacks
- ✅ Insecure Design
- ✅ Security Misconfiguration
- ✅ Vulnerable Components
- ✅ Authentication Failures
- ✅ Software Integrity Failures
- ✅ Logging and Monitoring
- ✅ Server-Side Request Forgery

For more details, see `SECURITY_AUDIT_REPORT.md`

## 🚀 Deployment

### Vercel (Recommended)
1. Upload code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy!

For complete details, see `DEPLOYMENT_GUIDE.md`

### Other supported platforms:
- Railway
- DigitalOcean App Platform
- Heroku
- AWS

## 📊 Monitoring and Analytics

- **Security Logging**: Log all security activities
- **Rate Limiting**: Protection from attacks
- **Error Tracking**: Error monitoring
- **Performance Monitoring**: Performance analysis

## 🤝 Contributing

1. Fork the project
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## 📞 Support

- **Documentation**: See `docs/` folder
- **Security**: See `SECURITY_GUIDELINES.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Issues**: Open an issue on GitHub

## 🎯 Roadmap

- [ ] Support for more games
- [ ] Mobile application
- [ ] Loyalty points system
- [ ] Cryptocurrency support
- [ ] Public API for developers

---

**Made with ❤️ for the Arabic gaming community**

*Last updated: January 2025*"# Gear-scorebetter" 
