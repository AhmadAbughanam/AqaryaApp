// Placeholder: App string constants scaffold.
// All user-facing strings for the Aqarya app.
// Centralised here to make future localisation straightforward.

export const Strings = {
  // ─── App ───────────────────────────────────────────────────────────────────
  app: {
    name: 'Aqarya',
    tagline: 'Smart Property Intelligence',
    loading: 'Loading…',
  },

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in using your SANAD credentials',
      emailLabel: 'SANAD Email',
      emailPlaceholder: 'name@sanad.gov.jo',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your SANAD password',
      submitButton: 'Sign In',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      signingIn: 'Signing in…',
    },
    accessDenied: {
      title: 'Access Denied',
      message: "You don't have permission to view this page.",
      backButton: 'Go Back',
      signOutButton: 'Sign Out',
    },
    errors: {
      invalidCredentials:
        'Invalid SANAD email or password. Please try again.',
      networkError: 'Network error. Please check your connection.',
      sessionExpired: 'Your session has expired. Please sign in again.',
      generic: 'Something went wrong. Please try again.',
    },
  },

  // ─── Navigation ────────────────────────────────────────────────────────────
  nav: {
    home: 'Home',
    map: 'Map',
    portfolio: 'Portfolio',
    activity: 'Activity',
    profile: 'Profile',
    properties: 'Properties',
    analytics: 'Analytics',
    auditLogs: 'Audit Logs',
    verification: 'Verification',
    chat: 'Assistant',
  },

  // ─── Property List ─────────────────────────────────────────────────────────
  propertyList: {
    screenTitle: 'Properties',
    searchPlaceholder: 'Search by address, city…',
    filterButton: 'Filter',
    sortButton: 'Sort',
    emptyTitle: 'No Properties Found',
    emptyMessage: 'Try adjusting your search or filters.',
    loadingMore: 'Loading more properties…',
    dailyVisitors: 'Daily Visitors',
    buildingAge: 'Building Age',
    ageUnit: 'Y',
    verifiedBadge: 'Verified',
    pendingBadge: 'Pending',
  },

  // ─── Property Detail ───────────────────────────────────────────────────────
  propertyDetail: {
    screenTitle: 'Property Detail',
    houseNumber: 'House Number',
    estimatedPrice: 'Estimate House Price',
    averageAge: 'Average Age',
    dailyVisitors: 'Daily Visitors',
    buildingAge: 'Building Age',
    zoneLabel: 'Zone',
    simulateButton: 'Simulate Investment',
    chatButton: 'Ask AI Assistant',
    shareButton: 'Share',
    saveButton: 'Save',
    photosHeader: 'Photos',
    detailsHeader: 'Details',
    locationHeader: 'Location',
    nearbyHeader: 'Nearby Properties',
    ageUnit: 'Y',
    yearsUnit: 'Years',
    viewingButton: 'Sign up for a viewing',
  },

  // ─── Investment Simulation ─────────────────────────────────────────────────
  investmentSimulation: {
    screenTitle: 'Investment Simulation',
    sharesLabel: 'Number of Shares',
    sharesPlaceholder: 'Enter share amount',
    pricePerShare: 'Price per Share',
    totalInvestment: 'Total Investment',
    projectedReturn: 'Projected Return',
    riskLevel: 'Risk Level',
    riskLow: 'Low',
    riskMedium: 'Medium',
    riskHigh: 'High',
    simulateButton: 'Run Simulation',
    simulatingButton: 'Simulating…',
    resultHeader: 'Simulation Result',
    investButton: 'Invest Now',
    disclaimerText:
      'This simulation is for informational purposes only and does not constitute financial advice.',
  },

  // ─── Portfolio ─────────────────────────────────────────────────────────────
  portfolio: {
    screenTitle: 'My Portfolio',
    totalValue: 'Total Portfolio Value',
    totalReturn: 'Total Return',
    activeInvestments: 'Active Investments',
    emptyTitle: 'No Investments Yet',
    emptyMessage: 'Start investing in properties to build your portfolio.',
    exploreButton: 'Explore Properties',
    sharesOwned: 'Shares Owned',
    currentValue: 'Current Value',
    returnLabel: 'Return',
  },

  // ─── Chatbot ───────────────────────────────────────────────────────────────
  chatbot: {
    screenTitle: 'Aqarya Assistant',
    assistantName: 'Emmy',
    onlineStatus: 'Online',
    offlineStatus: 'Offline',
    inputPlaceholder: 'Write a Message',
    sendButton: 'Send',
    welcomeMessage:
      "Hi, I'm Emmy 👋\nI'm a manager that's here to help",
    typingIndicator: 'Emmy is typing…',
    errorMessage: 'Sorry, I could not process your request. Please try again.',
    photosLabel: 'Here are the photos:',
    viewingCTA: "Looks good 🏠, I want to sign up for a viewing",
    voiceButton: 'Voice message',
  },

  // ─── DLS Admin — Property Verification ────────────────────────────────────
  verification: {
    screenTitle: 'Property Verification',
    pendingTab: 'Pending',
    verifiedTab: 'Verified',
    rejectedTab: 'Rejected',
    approveButton: 'Approve',
    rejectButton: 'Reject',
    viewDocumentsButton: 'View Documents',
    emptyPending: 'No pending verifications.',
    emptyVerified: 'No verified properties yet.',
    emptyRejected: 'No rejected properties.',
    confirmApproveTitle: 'Approve Property?',
    confirmApproveMessage:
      'This will mark the property as verified and make it visible to citizens.',
    confirmRejectTitle: 'Reject Property?',
    confirmRejectMessage:
      'Please provide a reason for rejection.',
    rejectReasonPlaceholder: 'Enter reason…',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  },

  // ─── DLS Admin — Audit Logs ────────────────────────────────────────────────
  auditLogs: {
    screenTitle: 'Audit Logs',
    searchPlaceholder: 'Search logs…',
    filterAll: 'All',
    filterApproved: 'Approved',
    filterRejected: 'Rejected',
    filterInvestment: 'Investment',
    emptyTitle: 'No Logs Found',
    emptyMessage: 'There are no audit logs matching your criteria.',
    timestampLabel: 'Timestamp',
    actionLabel: 'Action',
    userLabel: 'User',
    propertyLabel: 'Property',
  },

  // ─── DLS Admin — Analytics ────────────────────────────────────────────────
  analytics: {
    screenTitle: 'Analytics',
    totalSimulations: 'Total Simulations',
    totalProperties: 'Total Properties',
    totalInvestors: 'Total Investors',
    totalVolume: 'Investment Volume',
    avgRisk: 'Avg. Risk Score',
    propertiesByZone: 'Properties by Zone',
    investmentTrend: 'Investment Trend',
    topProperties: 'Top Properties',
    periodDay: 'Day',
    periodWeek: 'Week',
    periodMonth: 'Month',
    periodYear: 'Year',
  },

  // ─── Common / Shared ───────────────────────────────────────────────────────
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    retry: 'Retry',
    loading: 'Loading…',
    seeAll: 'See All',
    noResults: 'No results found.',
    error: 'Something went wrong.',
    success: 'Success!',
    currency: 'JOD',
    currencySymbol: '$',
  },

  // ─── Accessibility ─────────────────────────────────────────────────────────
  a11y: {
    closeModal: 'Close modal',
    goBack: 'Go back',
    searchIcon: 'Search',
    filterIcon: 'Filter',
    menuIcon: 'Open menu',
    heartIcon: 'Save property',
    shareIcon: 'Share property',
    sendMessage: 'Send message',
    playVoice: 'Play voice message',
    propertyImage: 'Property image',
    avatarImage: 'User avatar',
  },
} as const;

export type StringsType = typeof Strings;
