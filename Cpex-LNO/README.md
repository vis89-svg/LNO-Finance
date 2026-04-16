# Capex Finance Backend - Node.js + Firebase

This is the Node.js backend for Capex Finance, using Firebase Firestore as the database.

## Prerequisites

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/

2. **Firebase Project** with Firestore enabled
   - Go to: https://console.firebase.google.com/
   - Create a new project or select existing one
   - Enable Firestore Database

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Firebase

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the downloaded JSON file as `firebase-service-account.json` in the `backend/config/` folder

### Step 3: Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update:
- `SESSION_SECRET` - A random secret key for sessions
- `PORT` - Server port (default: 3000)
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` - Hardcoded admin credentials

### Step 4: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

## Project Structure

```
backend/
├── config/
│   └── firebase.js          # Firebase Admin SDK initialization
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── eventController.js   # Event CRUD operations
│   └── financeController.js # Finance record operations
├── middleware/
│   └── session.js           # Session management
├── routes/
│   ├── auth.js              # Auth routes
│   ├── events.js            # Event routes
│   └── finances.js          # Finance routes
├── utils/
│   └── dateHelpers.js       # Date formatting utilities
├── server.js                # Main Express app
├── package.json
└── .env
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/check` | Check auth status |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create new event |
| POST | `/api/events/:id/update` | Update event |
| POST | `/api/events/:id/delete` | Delete event |

### Finances
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finances/event/:eventId` | Get finances for event |
| GET | `/api/finances/:id` | Get single finance |
| POST | `/api/finances/event/:eventId/add` | Add finance record |
| POST | `/api/finances/:id/update` | Update finance |
| POST | `/api/finances/:id/delete` | Delete finance |

## Frontend Files

Static HTML files are in the `public/` folder:
- `login.html` - Login page
- `index.html` - Main dashboard
- `event-creation.html` - Create event page
- `edit-event.html` - Edit event page
- `add-finance.html` - Add finance record page

## Firebase Security Rules

For development, you can use these permissive rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note:** Security is handled by the Express middleware. For production, implement proper Firebase security rules.

## Default Admin Credentials

- **Username:** `Legacyiedc`
- **Password:** `8474244`

These can be changed in the `.env` file.

## Troubleshooting

### Firebase Connection Error
- Ensure `firebase-service-account.json` exists in `backend/config/`
- Check that Firestore is enabled in your Firebase project
- Verify the service account has proper permissions

### Port Already in Use
- Change the `PORT` value in `.env`
- Or kill the process using port 3000

## License

ISC
