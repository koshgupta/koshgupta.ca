// Site copy. Facts come from PRODUCT.md (sourced from the resume); keep them verbatim.

export const profile = {
  name: 'Koshlender Gupta',
  role: 'Computer science student at Toronto Metropolitan University',
  status: 'Graduating June 2027',
  links: [
    { label: 'GitHub', href: 'https://github.com/koshgupta' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/koshlendergupta' },
  ],
}

// Each cover's word is sized to fit its card; the circle is the spotlight that sweeps across it.
// circle / ink / inner: palette names for the circle, the word, and the word inside the circle.
// y: the circle's offset below the word's midline, as a multiple of the word's size.
export const sections = [
  {
    id: 'about',
    label: 'About',
    word: 'About',
    cover: { y: 0.06, circle: 'ash', ink: 'mahogany', inner: 'granite' },
    text: [
      'I am a CS student at Toronto Metropolitan University, but in our industry you never really stop learning. I like making software that solves inconveniences, because the more time we can save on mundane tasks, the more time we can spend doing the things we love. For me, that’s spending time with my pet bird.',
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    word: 'Projects',
    width: 'wide',
    cover: { y: -0.08, circle: 'mahogany', ink: 'mahogany', inner: 'sand' },
    entries: [
      {
        title: 'S&P 500 Daily Volatility Forecasting Pipeline',
        figure: { value: '09:05', unit: 'ET', caption: 'Forecast delivered daily by this time, hands-off' },
        body: [
          'An XGBoost model that forecasts daily S&P 500 volatility, trained on five years of futures and macroeconomic data. Optuna hyperparameter tuning and feature selection improved accuracy by 22% over the baseline.',
          'A FinBERT + LLM sentiment component reads pre-market financial news and contributes 40% of the model’s predictive signal. Data ingestion from multiple market sources is automated end to end, with completion alerts when the forecast lands.',
        ],
        tags: ['Python', 'XGBoost', 'Optuna', 'pandas', 'HuggingFace Transformers', 'Parquet'],
        link: { label: 'Source on GitHub', href: 'https://github.com/koshgupta/whathappenednow' },
      },
      {
        title: 'Risk vs. Return Cluster Model',
        body: [
          'Groups S&P 500 companies by market risk (beta) and one-year return. A data script scrapes the current ticker list from Wikipedia and pulls each stock’s figures from Yahoo Finance.',
          'The model drops missing values and IQR outliers, standardizes both features and runs K-Means with four clusters, then summarizes each cluster and plots them on a risk-versus-return scatter.',
        ],
        tags: ['Python', 'scikit-learn', 'pandas', 'NumPy', 'yfinance', 'Beautiful Soup', 'Matplotlib'],
        link: { label: 'Source on GitHub', href: 'https://github.com/koshgupta/Risk-vs-Return-Cluster-Model' },
      },
      {
        title: 'Club Management App, Backend',
        body: [
          'The backend for a team-built club management app. A relational data layer in SQLite and GORM supports CRUD operations across the core entities, and JWT middleware handles authentication and authorization on every API endpoint.',
          'Features shipped through a pull-request workflow with peer review and structured error handling.',
        ],
        tags: ['Go', 'SQLite', 'GORM', 'JWT', 'Git'],
        link: { label: 'Team repository', href: 'https://github.com/nicholas489/Dance-Club-Management-App' },
      },
      {
        title: 'Asana Task Downloader',
        body: [
          'A desktop tool built to make the Science Society’s financial audits easier. Enter an Asana API token and project ID, and it lists every task in the project through Asana’s API and fetches the attachment details in parallel.',
          'Files download into a folder per task and come back as a single dated zip in your Downloads folder.',
        ],
        tags: ['Python', 'Asana API', 'Tkinter', 'requests', 'Thread pools'],
        link: { label: 'Source on GitHub', href: 'https://github.com/koshgupta/asana-task-downloader' },
      },
    ],
  },
  {
    id: 'experience',
    label: 'Experience',
    word: 'Experience',
    cover: { y: 0.08, circle: 'granite', ink: 'mahogany', inner: 'sand' },
    entries: [
      {
        meta: 'May – Dec 2025',
        title: 'IT Intern, City of Toronto',
        org: 'Technology Services Division',
        body: [
          'I worked on software asset management for the City: connecting ServiceNow to older municipal systems and building license-usage reporting that shaped renewal decisions.',
        ],
      },
      {
        meta: 'May 2024 – Jun 2025',
        title: 'Vice President of Finance',
        org: 'Undergraduate Science Society of Toronto Metropolitan',
        body: [
          'I ran the society’s budgeting and reporting, managed sponsor funds and spending for two hackathons, set up the project workflows the executive team worked from, and built an attachment downloader on Asana’s API to make financial audits easier.',
        ],
      },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    word: 'Education',
    cover: { y: 0.1, circle: 'charcoal', ink: 'mahogany', inner: 'sand' },
    entries: [
      {
        meta: 'Sep 2022 – Jun 2027',
        title: 'Toronto Metropolitan University',
        org: 'Bachelor of Science in Computer Science',
        body: ['Formerly Ryerson University. Classes finish in December 2026, with graduation in June 2027.'],
        list: [
          { term: 'Data Structures', detail: 'Algorithms in Java, C, Python, Lisp, Elixir and Rust' },
          { term: 'Operating Systems', detail: 'Distributed, multi-threaded and embedded systems; UNIX and Linux (Bash, C, VMs)' },
          { term: 'Data Mining / Science', detail: 'pandas, Matplotlib and scikit-learn; regression, decision trees, random forests, support vector machines, k-nearest neighbors, naive Bayes and neural networks' },
          { term: 'Software Engineering I', detail: 'SDLC models, Agile methods, Git, Jira, MongoDB, Ruby, Go and DBMS' },
        ],
      },
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    word: 'Skills',
    tone: 'granite',
    cover: { y: -0.05, circle: 'mahogany', ink: 'sand', inner: 'ash' },
    groups: [
      { name: 'Languages & Frameworks', items: ['Python', 'Go', 'Java', 'JavaScript', 'Rust', 'Ruby', 'React', 'HTML', 'REST API'] },
      { name: 'ML & Data', items: ['XGBoost', 'Optuna', 'HuggingFace Transformers (FinBERT, Qwen)', 'scikit-learn', 'pandas', 'NumPy', 'Matplotlib', 'Parquet'] },
      { name: 'Databases & Technologies', items: ['SQL', 'NoSQL', 'SQLite', 'MySQL', 'GORM', 'OAuth', 'JWT', 'JSON', 'Docker', 'CI/CD', 'Relational modeling', 'Unit testing'] },
      { name: 'Tools & Platforms', items: ['Git/GitHub', 'Jira', 'Asana', 'ServiceNow', 'Databento', 'VS Code', 'IntelliJ', 'GoLand', 'Linux/Unix', 'Postman', 'Azure', 'Jupyter', 'SAP'] },
    ],
  },
]
