# FinanceChat

A conversational finance tracking application built with Vue.js, Node.js and MongoDB. Simply type your financial transactions into the chat interface, and the app will automatically categorize and record them for you.

## Features

- **Conversational Interface**: Chat-based interaction similar to ChatGPT for recording transactions
- **Automatic Categorization**: Natural language processing to categorize transactions as income or expenses
- **Real-time Balance Updates**: See your balance change instantly as you record transactions
- **Transaction Reports**: View detailed reports and breakdowns of your spending
- **User Accounts**: Multi-user support with secure authentication
- **Business Type Settings**: Customized categories for different business types (Food/Beverage, Service, Product, Personal)
- **Data Persistence**: All data is stored securely in MongoDB
- **Responsive Design**: Works on desktop and mobile devices

## Project Setup

```bash
# Install all dependencies (frontend, backend, and serverless functions)
npm run install:all

# Run both frontend and backend development servers
npm run dev

# Run only frontend with hot-reload
npm run serve

# Run only backend with nodemon for auto-reload
npm run server:dev

# Compile and minify for production
npm run build

# Lint and fix files
npm run lint

# Run Netlify dev environment (requires Netlify CLI)
npm run netlify:dev
```

For detailed backend and database setup instructions, see [BACKEND_SETUP.md](BACKEND_SETUP.md).

## How to Use

1. Type your transactions in natural language in the chat box
   - Examples: "Spent $50 on groceries today", "Received $1200 from my salary"
2. The app will automatically categorize the transaction and update your balance
3. View detailed reports and transaction history in the Reports section
4. Manage your settings and export data in the Settings section

## Technology Stack

### Frontend
- **Vue.js 3**: Frontend framework
- **Vuex**: State management
- **Vue Router**: Navigation
- **Axios**: HTTP client for API requests
- **date-fns**: Date formatting and manipulation
- **GSAP**: Animations and transitions

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication with JSON Web Tokens
- **bcrypt**: Password hashing

### Deployment
- **Netlify**: Frontend hosting and serverless functions
- **MongoDB Atlas**: Cloud database hosting

## Browser Support

- Chrome
- Firefox
- Safari
- Edge

## License

This project is licensed under the MIT License.
