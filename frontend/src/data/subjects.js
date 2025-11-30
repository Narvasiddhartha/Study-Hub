export const SUBJECTS = [
  {
    slug: 'dsa',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    icon: '📗',
    link: '/dsa',
    description: 'Master the fundamentals of data structures and algorithms to solve problems with confidence during contests and interviews.',
    focus: 'Problem Solving',
    duration: '6-8 weeks',
    topics: [
      'Arrays & Math',
      'Linked Lists',
      'Stacks & Queues',
      'Trees & Tries',
      'Graphs',
      'Dynamic Programming',
      'Greedy & Backtracking',
      'Bit Manipulation'
    ],
    youtubeId: '0IAPZzGSbME',
    roadmap: [
      'Week 1: Brush up on complexity, arrays, and math tricks.',
      'Week 2: Conquer linked lists, stacks, and queues with implementation drills.',
      'Week 3: Tree traversals, BST patterns, and binary heaps.',
      'Week 4: Graph traversal (BFS/DFS), shortest paths, Union-Find.',
      'Week 5: Dynamic programming patterns (knapsack, LIS, interval).',
      'Week 6: Mock contests + mixed-topic revision under timed settings.'
    ],
    resources: [
      { label: 'GeeksforGeeks DSA', url: 'https://www.geeksforgeeks.org/dsa/' },
      { label: 'LeetCode 75', url: 'https://leetcode.com/studyplan/leetcode-75/' },
      { label: 'CSES Problem Set', url: 'https://cses.fi/problemset/' }
    ],
    notes: [
      { label: 'DSA Basics (PDF)', url: '/pdfs/dsa-basics.pdf' },
      { label: 'Advanced Algorithms (PDF)', url: '/pdfs/dsa-advanced.pdf' }
    ],
    practice: [
      { label: 'LeetCode', url: 'https://leetcode.com' },
      { label: 'Codeforces', url: 'https://codeforces.com' },
      { label: 'GFG Practice', url: 'https://practice.geeksforgeeks.org/' }
    ]
  },
  {
    slug: 'os',
    name: 'Operating Systems',
    icon: '🖥️',
    link: '/os',
    description: 'Understand how operating systems orchestrate processes, memory, and hardware resources.',
    focus: 'Systems Thinking',
    duration: '4 weeks',
    topics: [
      'OS Architecture',
      'Process & Thread Management',
      'CPU Scheduling',
      'Synchronization',
      'Deadlocks',
      'Memory & Paging',
      'File Systems',
      'Case Studies'
    ],
    youtubeId: 'vBURTt97EkA',
    roadmap: [
      'Week 1: Process model, threads, scheduling strategies.',
      'Week 2: Synchronization primitives, deadlock avoidance/detection.',
      'Week 3: Memory management, paging, segmentation, virtual memory.',
      'Week 4: File systems, IO, and Linux/Windows internals walkthrough.'
    ],
    resources: [
      { label: 'OSTEP Notes', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/' },
      { label: 'Little Book of Semaphores', url: 'https://greenteapress.com/wp/semaphores/' }
    ],
    notes: [
      { label: 'OS Quick Notes', url: '/pdfs/os-notes.pdf' }
    ],
    practice: [
      { label: 'Nand2Tetris OS labs', url: 'https://www.nand2tetris.org/' },
      { label: 'Labs: xv6', url: 'https://pdos.csail.mit.edu/6.828/2021/xv6.html' }
    ]
  },
  {
    slug: 'cn',
    name: 'Computer Networks',
    icon: '🌐',
    link: '/cn',
    description: 'Build a strong mental model of modern networking, from physical signals to secure web requests.',
    focus: 'Network Fluency',
    duration: '4-5 weeks',
    topics: [
      'OSI & TCP/IP',
      'Switching & Routing',
      'Transport Layer',
      'Congestion Control',
      'Socket Programming',
      'Network Security',
      'Wireless & Mobile',
      'Monitoring Tools'
    ],
    youtubeId: 'IPvYjXCsTg8',
    roadmap: [
      'Week 1: OSI vs TCP/IP layers with real packet captures.',
      'Week 2: Routing algorithms, NAT, VLANs, congestion control.',
      'Week 3: TCP/UDP deep dive, reliability, flow control, socket basics.',
      'Week 4: HTTPS/TLS, VPNs, firewalls, cloud networking topologies.'
    ],
    resources: [
      { label: 'Cisco Packet Tracer Labs', url: 'https://skillsforall.com/resources/lab-activities' },
      { label: 'MDN HTTP Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP' }
    ],
    notes: [
      { label: 'CN Quick Reference', url: '/pdfs/cn-reference.pdf' }
    ],
    practice: [
      { label: 'Wireshark Labs', url: 'https://gaia.cs.umass.edu/kurose_ross/wireshark.php' }
    ]
  },
  {
    slug: 'dbms',
    name: 'Database Systems',
    icon: '💾',
    link: '/dbms',
    description: 'Design, query, and scale relational databases with confidence.',
    focus: 'Data Layer Design',
    duration: '5 weeks',
    topics: [
      'Relational Model',
      'SQL Mastery',
      'Indexes & Query Plans',
      'Transactions & ACID',
      'Isolation Levels',
      'Normalization',
      'Replication',
      'Sharding & CAP'
    ],
    youtubeId: 'HXV3zeQKqGY',
    roadmap: [
      'Week 1: ER models, relational algebra, SQL basics.',
      'Week 2: Joins, subqueries, CTEs, and window functions.',
      'Week 3: Index structures, query optimization, explain plans.',
      'Week 4: Transactions, concurrency control, deadlocks.',
      'Week 5: Distributed databases, replication strategies, CAP theorem.'
    ],
    resources: [
      { label: 'SQLBolt Labs', url: 'https://sqlbolt.com/' },
      { label: 'CMU 15-445 Notes', url: 'https://15445.courses.cs.cmu.edu/' }
    ],
    notes: [
      { label: 'DBMS Cheatsheet', url: '/pdfs/dbms-cheatsheet.pdf' }
    ],
    practice: [
      { label: 'LeetCode Database', url: 'https://leetcode.com/problemset/database/' }
    ]
  },
  {
    slug: 'java',
    name: 'Java Programming',
    icon: '☕',
    link: '/java',
    description: 'Write production-grade Java using modern language features and frameworks.',
    focus: 'Backend Craft',
    duration: '4 weeks',
    topics: [
      'Core OOP',
      'Collections & Generics',
      'Streams & Lambdas',
      'Exception Handling',
      'JVM Internals',
      'Spring Boot',
      'Testing',
      'Deployment'
    ],
    youtubeId: 'RRubcjpTkks',
    roadmap: [
      'Week 1: Refresh OOP, classes, interfaces, SOLID.',
      'Week 2: Collections framework, generics, concurrency basics.',
      'Week 3: Streams API, functional programming, unit testing.',
      'Week 4: Build RESTful services with Spring Boot + JPA.'
    ],
    resources: [
      { label: 'Effective Java Notes', url: 'https://github.com/HugoMatilla/Effective-JAVA-Summary' },
      { label: 'Spring Guides', url: 'https://spring.io/guides' }
    ],
    notes: [
      { label: 'Java Quick Notes', url: '/pdfs/java-notes.pdf' }
    ],
    practice: [
      { label: 'Exercism Java', url: 'https://exercism.org/tracks/java' }
    ]
  },
  {
    slug: 'python',
    name: 'Python Programming',
    icon: '🐍',
    link: '/python',
    description: 'Sharpen Pythonic thinking for automation, data work, and backend scripting.',
    focus: 'Automation + Data',
    duration: '3-4 weeks',
    topics: [
      'Pythonic Syntax',
      'Data Structures',
      'Modules & Packaging',
      'File & Network IO',
      'Async & Concurrency',
      'Testing',
      'Data Libraries',
      'APIs & FastAPI'
    ],
    youtubeId: 'rfscVS0vtbw',
    roadmap: [
      'Week 1: Core syntax, data types, comprehensions.',
      'Week 2: Modules, packaging, virtual envs, file I/O.',
      'Week 3: Asyncio, requests, FastAPI mini project.',
      'Week 4: Data stack (pandas, matplotlib) + deployment.'
    ],
    resources: [
      { label: 'Real Python', url: 'https://realpython.com/' },
      { label: 'Python Async Guide', url: 'https://docs.python.org/3/library/asyncio.html' }
    ],
    notes: [
      { label: 'Python Cheatsheet', url: '/pdfs/python-notes.pdf' }
    ],
    practice: [
      { label: 'Hackerrank Python', url: 'https://www.hackerrank.com/domains/python' }
    ]
  },
  {
    slug: 'web-dev',
    name: 'Web Development',
    icon: '🌍',
    link: '/web-dev',
    description: 'Build responsive, accessible web apps from UI to deployment.',
    focus: 'Full-stack Shipping',
    duration: '6 weeks',
    topics: [
      'Semantic HTML',
      'Modern CSS',
      'JavaScript Essentials',
      'React Basics',
      'State Management',
      'APIs & Auth',
      'Testing & Accessibility',
      'Deployments'
    ],
    youtubeId: 'FTFaQWZBqQ8',
    roadmap: [
      'Week 1: Semantic HTML, responsive CSS, flexbox/grid labs.',
      'Week 2: Modern JavaScript, ES modules, tooling.',
      'Week 3: React components, hooks, routing.',
      'Week 4: State management, API consumption, auth flows.',
      'Week 5: Testing, performance budgets, accessibility audits.',
      'Week 6: Deployments with Vercel/Docker and CI/CD.'
    ],
    resources: [
      { label: 'Frontend Mentor', url: 'https://www.frontendmentor.io/' },
      { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/' }
    ],
    notes: [
      { label: 'Web Dev Handbook', url: '/pdfs/webdev-handbook.pdf' }
    ],
    practice: [
      { label: 'Frontend Practice', url: 'https://www.frontendpractice.com/' }
    ]
  },
  {
    slug: 'se',
    name: 'Software Engineering',
    icon: '📋',
    link: '/se',
    description: 'Go beyond coding by mastering architecture, documentation, and delivery practices.',
    focus: 'System Design',
    duration: '5 weeks',
    topics: [
      'SDLC & Requirements',
      'Architecture Patterns',
      'UML/C4 Modeling',
      'Design Principles',
      'Testing Strategy',
      'DevOps & CI/CD',
      'Observability',
      'Postmortems'
    ],
    youtubeId: 'i8eJZK4p6nA',
    roadmap: [
      'Week 1: Requirement gathering, writing specs, prioritization.',
      'Week 2: Architecture styles, design trade-offs, diagrams.',
      'Week 3: Quality strategies, testing pyramid, automation.',
      'Week 4: DevOps tooling, CI/CD, monitoring.',
      'Week 5: Reliability, SLOs, incident response best practices.'
    ],
    resources: [
      { label: '12-Factor App', url: 'https://12factor.net/' },
      { label: 'Awesome Architecture', url: 'https://github.com/sindresorhus/awesome#programming-languages' }
    ],
    notes: [
      { label: 'SE Playbook', url: '/pdfs/se-playbook.pdf' }
    ],
    practice: [
      { label: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
    ]
  },
  {
    slug: 'ml',
    name: 'Machine Learning',
    icon: '🧠',
    link: '/ml',
    description: 'Develop intuition for ML math, modelling, and deploying responsible systems.',
    focus: 'Model Building',
    duration: '6-7 weeks',
    topics: [
      'Math Refresher',
      'Regression & Classification',
      'Ensembles',
      'Neural Networks',
      'MLOps Basics',
      'Experiment Tracking',
      'Responsible AI',
      'Case Studies'
    ],
    youtubeId: 'GwIo3gDZCVQ',
    roadmap: [
      'Week 1: Linear algebra, calculus, probability brush-up.',
      'Week 2: Regression, classification, evaluation metrics.',
      'Week 3: Ensemble methods, feature engineering workflows.',
      'Week 4: Neural nets with PyTorch/TensorFlow.',
      'Week 5: Experiment tracking, MLflow, deployment basics.',
      'Week 6: Responsible AI, monitoring drift, post-deployment.'
    ],
    resources: [
      { label: 'fast.ai', url: 'https://course.fast.ai/' },
      { label: 'Made With ML', url: 'https://madewithml.com/' }
    ],
    notes: [
      { label: 'ML Cheatsheet', url: '/pdfs/ml-cheatsheet.pdf' }
    ],
    practice: [
      { label: 'Kaggle', url: 'https://www.kaggle.com/' }
    ]
  },
  {
    slug: 'placement',
    name: 'Placement Prep',
    icon: '🏆',
    link: '/placement',
    description: 'Structure your final-mile preparation with projects, aptitude, and mock interviews.',
    focus: 'Career Launch',
    duration: '4 weeks',
    topics: [
      'Resume & Storytelling',
      'Aptitude & Reasoning',
      'HR + Behavioral',
      'System Design',
      'Project Demos',
      'Company Research',
      'Mock Interviews',
      'Offer Negotiation'
    ],
    youtubeId: '2z8OP44D_88',
    roadmap: [
      'Week 1: Resume polish, LinkedIn hygiene, storytelling practice.',
      'Week 2: Alternate aptitude drills with CS core revision.',
      'Week 3: Mock interviews (DSA + HR) with weekly retros.',
      'Week 4: Company-specific prep, offer handling, and mindset.'
    ],
    resources: [
      { label: 'InterviewBit', url: 'https://www.interviewbit.com/' },
      { label: 'Pramp', url: 'https://www.pramp.com/' }
    ],
    notes: [
      { label: 'Placement Tracker Template', url: '/pdfs/placement-tracker.pdf' }
    ],
    practice: [
      { label: 'Gainlo Mock Interviews', url: 'https://www.gainlo.co/' }
    ]
  }
];

export const SUBJECTS_MAP = SUBJECTS.reduce((acc, subject) => {
  acc[subject.slug] = subject;
  return acc;
}, {});

