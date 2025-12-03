# 🚀 Job Portal - MERN Stack Application

A modern, full-featured job search and application platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

## ✨ Features

### 🔍 Feature 2: Advanced Job Search & Filter

- **Multi-criteria Search**
  - General keyword search across all job fields
  - Job title filtering (partial match)
  - Location-based filtering (city or remote)
  - Skills/keywords filtering (comma-separated)

- **Smart Sorting**
  - Most Recent
  - Most Relevant
  - Salary: High to Low
  - Salary: Low to High

- **Pagination**
  - Configurable items per page
  - Page navigation with ellipsis
  - URL state preservation
  - Smooth scroll on page change

- **Real-time Updates**
  - Debounced search input (500ms)
  - Loading states with spinners
  - Error handling with retry
  - Empty state messages

- **Job Application**
  - Apply button on each job card
  - Dedicated application page
  - Form validation
  - Resume upload (PDF, DOC, DOCX)
  - External application link support

### 🎨 UI/UX Features

- **Deep Themed Design**
  - Gradient backgrounds and buttons
  - Smooth transitions and animations
  - Hover effects on cards
  - Professional color scheme (Indigo/Purple)
  - Responsive layout (mobile-first)

- **Interactive Components**
  - Animated loading spinners
  - Filter tags with close buttons
  - Company logo placeholders with colors
  - Skill badges
  - Salary display with formatting

## 🛠️ Tech Stack

### Frontend
- **React.js 18.3.1** - UI library
- **React Router DOM** - Client-side routing
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Vite** - Build tool and dev server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 4.22** - Web framework
- **Prisma 7.0** - ORM for database
- **MongoDB** - NoSQL database
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Deployment
- **Vercel** - Hosting platform (optimized)

## 📁 Project Structure

```
using_ZED_471/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── SearchBar.jsx
│   │   │   └── JobCard.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── HomePage.jsx
│   │   │   └── ApplyPage.jsx
│   │   ├── utils/           # Helper functions
│   │   │   ├── api.js       # API service
│   │   │   └── helpers.js   # Utility functions
│   │   ├── App.jsx          # Main app component with routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                   # Backend Node.js application
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   └── jobs.js      # Job endpoints
│   │   ├── utils/           # Utility modules
│   │   │   ├── prisma.js    # Database client
│   │   │   └── queryBuilder.js  # Query helpers
│   │   ├── data/            # Fallback data
│   │   │   └── jobs.json    # Sample job listings
│   │   └── index.js         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example         # Environment variables template
│   └── package.json
│
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 10.0.0
- **MongoDB** account (MongoDB Atlas recommended)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd using_ZED_471
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   
   # Copy environment variables
   cp .env.example .env
   
   # Edit .env and update DATABASE_URL with your MongoDB connection string
   # DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/
   ```

3. **Setup Prisma**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Push schema to database
   npm run prisma:push
   ```

4. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   
   # Copy environment variables
   cp .env.example .env
   
   # Edit .env if needed (default API URL is http://localhost:4000)
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:4000`

2. **Start Frontend (in new terminal)**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔌 API Endpoints

### Jobs API

#### `GET /api/jobs`
Fetch jobs with filtering, sorting, and pagination

**Query Parameters:**
- `title` (string) - Filter by job title (partial match)
- `location` (string) - Filter by location (partial match)
- `keywords` (string) - Filter by skills/keywords (comma-separated)
- `q` (string) - General search query
- `sortBy` (string) - Sort order: `recent`, `salary_high`, `salary_low`, `relevant`
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false,
  "filters": {...}
}
```

#### `GET /api/jobs/:id`
Fetch a single job by ID

**Response:**
```json
{
  "success": true,
  "job": {...}
}
```

#### `GET /api/jobs/stats/summary`
Get job statistics (total jobs, top locations, top companies)

#### `GET /api/health`
Health check endpoint

## 📊 Database Schema

```prisma
model Job {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  title          String
  company        String
  location       String
  description    String
  type           String
  salaryMin      Int?
  salaryMax      Int?
  salaryCurrency String?
  keywords       String[]
  applyUrl       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([title])
  @@index([company])
  @@index([location])
  @@index([createdAt])
}
```

## 🎯 Key Features Implementation

### Search & Filter
- **Backend**: Dynamic Prisma queries with `where` clauses
- **Frontend**: Debounced input with real-time updates
- **URL State**: Search params preserved in URL for sharing

### Salary Sorting
- **High to Low**: Sorts by `salaryMax` DESC, then `salaryMin` DESC
- **Low to High**: Sorts by `salaryMin` ASC, then `salaryMax` ASC
- **Null Handling**: Jobs without salary appear last

### Error Handling
- **Backend**: Try-catch blocks with proper error messages
- **Frontend**: Error boundaries and retry mechanisms
- **Fallback**: JSON data used when database unavailable

### Loading States
- **Skeleton screens** on initial load
- **Inline spinners** during searches
- **Disabled states** for buttons during submission

## 🚢 Deployment

### Vercel Deployment

1. **Backend Deployment**
   ```bash
   cd server
   vercel
   ```
   - Set environment variables in Vercel dashboard
   - Note the deployed URL

2. **Frontend Deployment**
   ```bash
   cd client
   # Update .env with production API URL
   vercel
   ```

### Environment Variables for Production

**Backend (Vercel):**
- `DATABASE_URL` - MongoDB connection string
- `NODE_ENV=production`
- `CORS_ORIGIN` - Frontend URL

**Frontend (Vercel):**
- `VITE_API_URL` - Backend API URL

## 🧪 Testing

### Test Search Functionality
1. Try general search with "developer"
2. Filter by location "Remote"
3. Filter by skills "react,node"
4. Sort by salary high to low
5. Navigate through pages
6. Click Apply on a job

### Test Edge Cases
- Empty search results
- Network errors
- Invalid pagination
- Special characters in search
- Multiple simultaneous filters

## 🔧 Development

### Adding New Features
1. Create new route in `server/src/routes/`
2. Add API method in `client/src/utils/api.js`
3. Create component in `client/src/components/`
4. Update routing in `client/src/App.jsx`

### Code Style
- Use ES6+ features
- Functional components with hooks
- Async/await for promises
- JSDoc comments for functions
- Meaningful variable names

## 📝 Sample Data

The application includes 20+ sample job listings in `server/src/data/jobs.json` covering:
- Frontend, Backend, Full Stack roles
- Various locations (Remote, NYC, SF, etc.)
- Salary ranges from $25k - $190k
- Different job types (Full-time, Contract, Internship)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4000
npx kill-port 4000

# Kill process on port 5173
npx kill-port 5173
```

### Database Connection Issues
- Check MongoDB connection string
- Verify IP whitelist in MongoDB Atlas
- Ensure DATABASE_URL is set in .env

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf client/.vite
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Feature 1**: JWT Authentication (Teammate)
- **Feature 2**: Job Search & Filter (Current Implementation)

## 🎉 Acknowledgments

- Built with ❤️ using MERN Stack
- Designed for modern job seekers
- Optimized for performance and UX

---

**Status**: ✅ Ready for Production

**Last Updated**: January 2025

**Version**: 1.0.0